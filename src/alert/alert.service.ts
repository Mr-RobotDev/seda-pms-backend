import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { format } from 'date-fns';
import { Alert } from './schema/alert.schema';
import { Trigger } from './schema/trigger.schema';
import { DeviceService } from '../device/device.service';
import { MailService } from '../common/services/mail.service';
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
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AlertService {
  constructor(
    @InjectModel(Alert.name)
    private readonly alertModel: PaginatedModel<Alert>,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Europe/London' })
  async resetAlerts() {
    await this.alertModel.updateMany({}, { numSent: 0 });
  }

  @Cron(CronExpression.EVERY_5_MINUTES, { timeZone: 'Europe/London' })
  async sendActiveAlerts() {
    const alerts = await this.alertModel.find({ active: true });

    const alertPromises = alerts.map(async (alert) => {
      const device = await this.deviceService.getDeviceById(alert.device);
      const field = alert.trigger.field;
      const value = device[field];

      const startTime = new Date(alert.conditionStartTime);
      const now = new Date();
      const duration = (now.getTime() - startTime.getTime()) / 1000 / 60;

      if (duration >= alert.trigger.duration && alert.numSent < 3) {
        await this.sendAlertEmail(
          alert,
          device.name,
          device.lastUpdated,
          field,
          value,
        );
        await this.incrementAlertSent(alert.id);
        await this.resetAlertCondition(alert.id);
      }
    });

    await Promise.all(alertPromises);
  }

  async handleUpdateChange(change: any) {
    const device = change.documentKey._id;
    const updatedFields = change.updateDescription.updatedFields;

    const field = this.getFieldType(updatedFields);
    if (field) {
      const alerts = await this.filterAlerts(device.toString(), field);

      const currentDay = format(new Date(), 'EEEE').toLowerCase() as WeekDay;
      await this.processAlerts(alerts, updatedFields, currentDay);
    }
  }

  async filterAlerts(device: string, field: Field): Promise<Alert[]> {
    return this.alertModel.find({
      device,
      enabled: true,
      'trigger.field': field,
    });
  }

  private async processAlerts(
    alerts: Alert[],
    updatedFields: any,
    currentDay: WeekDay,
  ) {
    const value = this.getUpdatedValue(updatedFields);
    const alertPromises = alerts.map(async (alert) => {
      await this.activateAlert(alert, currentDay, value);
    });

    await Promise.all(alertPromises);
  }

  private async activateAlert(
    alert: Alert,
    currentDay: WeekDay,
    value: number,
  ): Promise<void> {
    if (
      this.isScheduleMatched(alert, currentDay) &&
      this.isConditionMet(alert.trigger, value)
    ) {
      if (alert.conditionStartTime === null) {
        await this.setAlertCondition(alert.id);
      }
    } else {
      if (alert.conditionStartTime) {
        await this.resetAlertCondition(alert.id);
      }
    }
  }

  private async setAlertCondition(alert: string) {
    await this.alertModel.findByIdAndUpdate(alert, {
      conditionStartTime: new Date(),
      active: true,
    });
  }

  private async resetAlertCondition(alert: string) {
    await this.alertModel.findByIdAndUpdate(alert, {
      conditionStartTime: null,
      active: false,
    });
  }

  private async incrementAlertSent(alert: string) {
    await this.alertModel.findByIdAndUpdate(alert, {
      $inc: { numSent: 1 },
    });
  }

  private async sendAlertEmail(
    alert: Alert,
    deviceName: string,
    lastUpdated: Date,
    field: Field,
    value: number,
  ) {
    try {
      const unit = this.getFieldUnit(field);
      const updated = format(lastUpdated, 'dd/MM/yyyy HH:mm:ss');
      await this.mailService.sendDeviceAlert(
        alert.recipients,
        deviceName,
        field,
        value,
        unit,
        updated,
      );
    } catch (error) {
      console.error('Failed to send alert email:', error);
    }
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

  private isConditionMet(trigger: Trigger, value: number): boolean {
    switch (trigger.range.type) {
      case RangeType.INSIDE:
        return value >= trigger.range.lower && value <= trigger.range.upper;
      case RangeType.OUTSIDE:
        return value < trigger.range.lower || value > trigger.range.upper;
      case RangeType.LOWER:
        return value < trigger.range.lower;
      case RangeType.UPPER:
        return value > trigger.range.upper;
      default:
        return false;
    }
  }

  private getFieldType(updatedFields: any): Field | null {
    if (updatedFields.temperature) return Field.TEMPERATURE;
    if (updatedFields.relativeHumidity) return Field.RELATIVE_HUMIDITY;
    if (updatedFields.pressure) return Field.PRESSURE;
    return null;
  }

  private getUpdatedValue(updatedFields: any): number {
    return (
      updatedFields.temperature ||
      updatedFields.relativeHumidity ||
      updatedFields.pressure
    );
  }

  private getFieldUnit(field: Field): string {
    switch (field) {
      case Field.TEMPERATURE:
        return '°C';
      case Field.RELATIVE_HUMIDITY:
        return '%';
      case Field.PRESSURE:
        return 'Pa';
      default:
        return '';
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
        projection: '-createdAt -conditionStartTime',
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
    const alert = await this.alertModel.findById(
      id,
      '-createdAt -conditionStartTime',
      {
        populate: {
          path: 'device',
          select: 'name lastUpdated temperature relativeHumidity pressure',
        },
      },
    );
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
        projection: '-createdAt -conditionStartTime',
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
