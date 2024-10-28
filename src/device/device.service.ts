import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Device } from './schema/device.schema';
import { LogService } from '../log/log.service';
import { AlertService } from '../alert/alert.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { GetDevicesQueryDto } from './dto/get-devices.dto';
import { UpdateDeviceByOem } from './dto/update-device-by-oem.dto';
import { UpdateDeviceAlertStatus } from './dto/update-device-alert-status.dto';
import { Action } from '../log/enums/action.enum';
import { Page } from '../log/enums/page.enum';
import { DeviceType } from './enums/device-type.enum';
import { DeviceResponse } from './interfaces/device-response.interface';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';
import { Result } from '../common/interfaces/result.interface';
import { TIMEZONE } from '../common/constants/timezone.constant';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: PaginatedModel<Device>,
    private readonly logService: LogService,
    private readonly alertService: AlertService,
  ) {
    this.getEventStream();
  }

  getEventStream() {
    const changeStream = this.deviceModel.watch();
    changeStream.on('change', async (change) => {
      if (change.operationType === 'update') {
        await this.alertService.handleUpdateChange(change);
      }
    });
  }

  @Cron(CronExpression.EVERY_10_SECONDS, { timeZone: TIMEZONE })
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
    highestPressure: number;
    online: number;
    offline: number;
  }> {
    const [stats] = await this.deviceModel.aggregate([
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          highestTemperature: {
            $max: {
              $cond: [
                { $in: ['$type', [DeviceType.HUMIDITY, DeviceType.PRESSURE]] },
                '$temperature',
                null,
              ],
            },
          },
          highestRelativeHumidity: {
            $max: {
              $cond: [
                { $in: ['$type', [DeviceType.HUMIDITY, DeviceType.PRESSURE]] },
                '$relativeHumidity',
                null,
              ],
            },
          },
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

  async device(user: string, id: string): Promise<DeviceResponse> {
    const device = await this.deviceModel.findById(id, '-createdAt -slug');
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    const alerts = await this.alertService.getAlertsByDevice(id);
    await this.logService.createLog(user, {
      action: Action.VIEWED,
      page: Page.DEVICE,
      device: id,
    });

    return {
      device,
      alerts: alerts.map((alert) => ({
        field: alert.trigger.field,
        range: alert.trigger.range,
      })),
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

  async getDeviceById(device: string | Device): Promise<Device> {
    return this.deviceModel.findById(device);
  }

  async getDeviceBySlug(slug: string): Promise<Device> {
    return this.deviceModel.findOne({ slug });
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

  async updateDeviceBySlug(
    slug: string,
    pressure: number,
    lastUpdated: Date,
  ): Promise<Device> {
    return this.deviceModel.findOneAndUpdate(
      { slug },
      { pressure, lastUpdated },
      { new: true },
    );
  }

  async updateDeviceAlertStatus(
    id: string,
    updateDeviceAlertStatus: UpdateDeviceAlertStatus,
  ): Promise<void> {
    await this.deviceModel.findByIdAndUpdate(id, updateDeviceAlertStatus, {
      new: true,
    });
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
}
