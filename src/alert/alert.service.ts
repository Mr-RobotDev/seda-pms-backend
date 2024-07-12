import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Alert } from './schema/alert.schema';
import { Trigger } from './schema/trigger.schema';
import { DeviceService } from '../device/device.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { RangeType } from './enums/range-type.enum';
import { DeviceType } from '../device/enums/device-type.enum';
import { Field } from '../common/enums/field.enum';
import { WeekDay } from '../common/enums/week-day.enum';
import { ScheduleType } from '../common/enums/schedule-type.enum';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';

@Injectable()
export class AlertService {
  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: PaginatedModel<Alert>,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) {}

  async filterAlerts(device: string, field: Field): Promise<Alert[]> {
    return this.alertModel.find(
      {
        device,
        enabled: true,
        'trigger.field': field,
      },
      '-createdAt',
      {
        populate: {
          path: 'device',
          select: 'name lastUpdated',
        },
      },
    );
  }

  async shouldSendAlert(
    alert: Alert,
    currentDay: WeekDay,
    fieldValue: number,
  ): Promise<boolean> {
    if (this.isScheduleMatched(alert, currentDay)) {
      if (this.isConditionMet(alert.trigger, fieldValue)) {
        if (!alert.conditionStartTime) {
          alert.conditionStartTime = new Date();
          await this.alertModel.findByIdAndUpdate(alert.id, {
            conditionStartTime: alert.conditionStartTime,
            active: true,
          });
        }

        const startTime = new Date(alert.conditionStartTime);
        const now = new Date();
        const duration = (now.getTime() - startTime.getTime()) / 1000 / 60;

        if (duration >= alert.trigger.duration) {
          await this.alertModel.findByIdAndUpdate(alert.id, {
            conditionStartTime: null,
          });
          return true;
        }
      } else {
        await this.resetAlertCondition(alert.id);
      }
    }
    return false;
  }

  async resetAlertCondition(alert: string) {
    await this.alertModel.findByIdAndUpdate(alert, {
      conditionStartTime: null,
      active: false,
    });
  }

  private isScheduleMatched(alert: Alert, currentDay: WeekDay): boolean {
    return (
      alert.scheduleType === ScheduleType.EVERYDAY ||
      (alert.scheduleType === ScheduleType.WEEKDAYS &&
        ![WeekDay.SATURDAY, WeekDay.SUNDAY].includes(currentDay)) ||
      (alert.scheduleType === ScheduleType.CUSTOM &&
        alert.weekdays.includes(currentDay))
    );
  }

  private isConditionMet(trigger: Trigger, fieldValue: number): boolean {
    switch (trigger.range.type) {
      case RangeType.INSIDE:
        return (
          fieldValue >= trigger.range.lower && fieldValue <= trigger.range.upper
        );
      case RangeType.OUTSIDE:
        return (
          fieldValue < trigger.range.lower || fieldValue > trigger.range.upper
        );
      case RangeType.LOWER:
        return fieldValue < trigger.range.lower;
      case RangeType.UPPER:
        return fieldValue > trigger.range.upper;
      default:
        return false;
    }
  }

  async getAlertsByDevice(device: string): Promise<Alert[]> {
    return this.alertModel.find({ device });
  }

  async createAlert(createAlertDto: CreateAlertDto): Promise<Alert> {
    const device = await this.deviceService.getDeviceById(
      createAlertDto.device,
    );
    if (!device) {
      throw new NotFoundException(`Device #${createAlertDto.device} not found`);
    }

    switch (createAlertDto.trigger.field) {
      case Field.PRESSURE:
        if (device.type === DeviceType.PRESSURE && device.pressureAlert) {
          throw new BadRequestException(
            `Pressure alert for device #${createAlertDto.device} already exists`,
          );
        }
        break;
      case Field.TEMPERATURE:
        if (device.type !== DeviceType.PRESSURE && device.temperatureAlert) {
          throw new BadRequestException(
            `Temperature alert for device #${createAlertDto.device} already exists`,
          );
        }
        break;
      case Field.RELATIVE_HUMIDITY:
        if (device.type !== DeviceType.PRESSURE && device.humidityAlert) {
          throw new BadRequestException(
            `Humidity alert for device #${createAlertDto.device} already exists`,
          );
        }
        break;
      default:
        throw new BadRequestException(
          `Unsupported field ${createAlertDto.trigger.field}`,
        );
    }

    const newAlert = await this.alertModel.create(createAlertDto);

    switch (createAlertDto.trigger.field) {
      case Field.PRESSURE:
        await this.deviceService.updateDeviceAlertStatus(device.id, {
          pressureAlert: true,
        });
        break;
      case Field.TEMPERATURE:
        await this.deviceService.updateDeviceAlertStatus(device.id, {
          temperatureAlert: true,
        });
        break;
      case Field.RELATIVE_HUMIDITY:
        await this.deviceService.updateDeviceAlertStatus(device.id, {
          humidityAlert: true,
        });
        break;
    }

    return this.getAlert(newAlert.id);
  }

  async getAlerts(query: PaginationQueryDto): Promise<Result<Alert>> {
    const { page, limit } = query;
    return this.alertModel.paginate(
      {},
      {
        page,
        limit,
        projection: '-createdAt',
        populate: [
          {
            path: 'device',
            select: 'name',
          },
        ],
      },
    );
  }

  async getAlertsStats() {
    const alerts = await this.alertModel.find({}).select('name active');

    const activeAlerts = alerts.filter((alert) => alert.active);
    const nonActiveAlerts = alerts.filter((alert) => !alert.active);

    return {
      totalActiveAlerts: activeAlerts.length,
      totalNonActiveAlerts: nonActiveAlerts.length,
      activeAlerts: activeAlerts.map((alert) => alert.name),
    };
  }

  async getAlert(id: string): Promise<Alert> {
    const alert = await this.alertModel.findById(id, '-createdAt', {
      populate: {
        path: 'device',
        select: 'name lastUpdated temperature relativeHumidity pressure',
      },
    });
    if (!alert) {
      throw new NotFoundException(`Alert #${id} not found`);
    }
    return alert;
  }

  async updateAlert(
    id: string,
    updateAlertDto: UpdateAlertDto,
  ): Promise<Alert> {
    const updatedAlert = await this.alertModel.findByIdAndUpdate(
      id,
      updateAlertDto,
      {
        new: true,
        projection: '-createdAt',
        populate: {
          path: 'device',
          select: 'name lastUpdated temperature relativeHumidity pressure',
        },
      },
    );
    if (!updatedAlert) {
      throw new NotFoundException(`Alert #${id} not found`);
    }
    return updatedAlert;
  }

  async removeAlert(id: string): Promise<void> {
    const alert = await this.alertModel.findById(id);

    if (!alert) {
      throw new NotFoundException(`Alert #${id} not found`);
    }

    const device = await this.deviceService.getDeviceById(alert.device);

    if (!device) {
      throw new NotFoundException(`Device #${alert.device} not found`);
    }

    switch (alert.trigger.field) {
      case Field.PRESSURE:
        if (device.pressureAlert) {
          await this.deviceService.updateDeviceAlertStatus(device.id, {
            pressureAlert: false,
          });
        }
        break;
      case Field.TEMPERATURE:
        if (device.temperatureAlert) {
          await this.deviceService.updateDeviceAlertStatus(device.id, {
            temperatureAlert: false,
          });
        }
        break;
      case Field.RELATIVE_HUMIDITY:
        if (device.humidityAlert) {
          await this.deviceService.updateDeviceAlertStatus(device.id, {
            humidityAlert: false,
          });
        }
        break;
    }

    await this.alertModel.deleteOne({ _id: id });
  }
}
