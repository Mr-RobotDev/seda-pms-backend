import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { format } from 'date-fns';
import { Device } from './schema/device.schema';
import { Alert } from '../alert/schema/alert.schema';
import { LogService } from '../log/log.service';
import { AlertService } from '../alert/alert.service';
import { MailService } from '../common/services/mail.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { GetDevicesQueryDto } from './dto/get-devices.dto';
import { UpdateDeviceByOem } from './dto/update-device-by-oem.dto';
import { Action } from '../log/enums/action.enum';
import { Page } from '../log/enums/page.enum';
import { Field } from '../common/enums/field.enum';
import { WeekDay } from '../common/enums/week-day.enum';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: PaginatedModel<Device>,
    private readonly logService: LogService,
    private readonly alertService: AlertService,
    private readonly mailService: MailService,
  ) {
    this.getEventStream();
  }

  getEventStream() {
    const changeStream = this.deviceModel.watch();
    changeStream.on('change', async (change) => {
      if (change.operationType === 'update') {
        await this.handleUpdateChange(change);
      }
    });
  }

  private async handleUpdateChange(change: any) {
    const deviceId = change.documentKey._id;
    const updatedFields = change.updateDescription.updatedFields;

    const field = this.getFieldType(updatedFields);
    if (field) {
      const alerts = await this.alertService.filterAlerts(
        deviceId.toString(),
        field,
      );

      const currentDay = format(new Date(), 'EEEE').toLowerCase() as WeekDay;
      await this.processAlerts(alerts, updatedFields, currentDay);
    }
  }

  private getFieldType(updatedFields: any): Field | null {
    if (updatedFields.temperature) return Field.TEMPERATURE;
    if (updatedFields.relativeHumidity) return Field.RELATIVE_HUMIDITY;
    if (updatedFields.pressure) return Field.PRESSURE;
    return null;
  }

  private async processAlerts(
    alerts: Alert[],
    updatedFields: any,
    currentDay: WeekDay,
  ) {
    const fieldType = this.getFieldType(updatedFields);
    const updatedValue = this.getUpdatedValue(updatedFields);

    const alertPromises = alerts.map((alert) => {
      if (this.alertService.shouldSendAlert(alert, currentDay, updatedValue)) {
        return this.sendAlertEmail(alert, fieldType, updatedValue);
      }
    });

    await Promise.all(alertPromises);
  }

  private async sendAlertEmail(
    alert: Alert,
    field: Field,
    updatedValue: number,
  ) {
    try {
      const unit = this.getFieldUnit(field);
      const updated = format(alert.device.lastUpdated, 'dd/MM/yyyy HH:mm:ss');
      await this.mailService.sendDeviceAlert(
        alert.recipients,
        alert.device.name,
        field,
        updatedValue,
        unit,
        updated,
      );
    } catch (error) {
      console.error('Failed to send alert email:', error);
    }
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

  async getDeviceById(device: string): Promise<Device> {
    return this.deviceModel.findById(device);
  }

  async getDeviceBySlug(slug: string): Promise<Device> {
    return this.deviceModel.findOne({ slug });
  }

  async updateDeviceBySlug(
    slug: string,
    pressure: number,
    lastUpdated?: Date,
  ): Promise<Device> {
    return this.deviceModel.findOneAndUpdate(
      { slug },
      { pressure, ...(lastUpdated && { lastUpdated }) },
      { new: true },
    );
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { timeZone: 'Europe/London' })
  async updateDeviceStatus(): Promise<void> {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    await this.deviceModel.updateMany(
      { lastUpdated: { $lt: twelveHoursAgo } },
      { isOffline: true },
    );

    await this.deviceModel.updateMany(
      { lastUpdated: { $gte: twelveHoursAgo } },
      { isOffline: false },
    );
  }

  async createDevice(
    user: string,
    createDeviceDto: CreateDeviceDto,
  ): Promise<Device> {
    const device = await this.deviceModel.create(createDeviceDto);
    await this.logService.createLog(user, {
      action: Action.CREATED,
      page: Page.DEVICE,
      device: device.id,
    });
    return device;
  }

  async devices(
    user: string,
    query: GetDevicesQueryDto,
  ): Promise<Result<Device>> {
    const { type, search, page, limit } = query;
    await this.logService.createLog(user, {
      action: Action.VIEWED,
      page: Page.DEVICES,
    });

    const types = Array.isArray(type) ? type : [type];

    return this.deviceModel.paginate(
      {
        ...(type && { type: { $in: types } }),
        ...(search && {
          $or: [
            { oem: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
          ],
        }),
      },
      {
        page,
        limit,
        sortBy: 'name',
        projection: '-createdAt -slug',
      },
    );
  }

  async deviceStats(user: string): Promise<{
    totalDevices: number;
    highestTemperature: number;
    highestRelativeHumidity: number;
    online: number;
    offline: number;
  }> {
    const [stats] = await this.deviceModel.aggregate([
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          highestTemperature: { $max: '$temperature' },
          highestRelativeHumidity: { $max: '$relativeHumidity' },
          highestPressure: { $max: '$pressure' },
          online: {
            $sum: {
              $cond: [{ $eq: ['$isOffline', false] }, 1, 0],
            },
          },
          offline: {
            $sum: {
              $cond: [{ $eq: ['$isOffline', true] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalDevices: 1,
          highestTemperature: 1,
          highestRelativeHumidity: 1,
          highestPressure: 1,
          online: 1,
          offline: 1,
        },
      },
    ]);
    await this.logService.createLog(user, {
      action: Action.VIEWED,
      page: Page.FLOOR_PLAN,
    });

    return stats;
  }

  async device(user: string, id: string): Promise<Device> {
    const device = await this.deviceModel.findById(id, '-createdAt -slug');
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    const alert = await this.alertService.getAlertByDevice(id);
    await this.logService.createLog(user, {
      action: Action.VIEWED,
      page: Page.DEVICE,
      device: id,
    });

    return {
      ...device.toJSON(),
      ...(alert && {
        alert: {
          field: alert.trigger.field,
          range: alert.trigger.range,
        },
      }),
    };
  }

  async deviceInfo(oem: string): Promise<Device> {
    const device = await this.deviceModel.findOne(
      { oem },
      '-createdAt -slug -location -lastUpdated -isOffline -signalStrength',
    );
    if (!device) {
      throw new NotFoundException(`Device #${oem} not found`);
    }
    return device;
  }

  async updateDevice(
    user: string,
    id: string,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<Device> {
    const device = await this.deviceModel.findByIdAndUpdate(
      id,
      updateDeviceDto,
      {
        new: true,
        projection: '-createdAt -slug',
      },
    );
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    await this.logService.createLog(user, {
      action: Action.UPDATED,
      page: Page.DEVICE,
      device: id,
    });
    return device;
  }

  async removeDevice(user: string, id: string): Promise<Device> {
    const device = await this.deviceModel.findByIdAndDelete(id, {
      projection: '-createdAt -slug',
    });
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    await this.logService.createLog(user, {
      action: Action.DELETED,
      page: Page.DEVICE,
      device: id,
    });
    return device;
  }

  async updateDeviceByOem(
    oem: string,
    updateDeviceByOem: UpdateDeviceByOem,
  ): Promise<Device> {
    return this.deviceModel.findOneAndUpdate(
      {
        oem,
      },
      updateDeviceByOem,
      {
        new: true,
      },
    );
  }
}
