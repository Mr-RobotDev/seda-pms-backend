import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { format } from 'date-fns';
import { Device } from './schema/device.schema';
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
        const deviceId = change.documentKey._id;
        const updatedFields = change.updateDescription.updatedFields;

        if (updatedFields.temperature || updatedFields.relativeHumidity) {
          const alerts = await this.alertService.filterAlerts(
            deviceId.toString(),
            updatedFields.temperature
              ? Field.TEMPERATURE
              : Field.RELATIVE_HUMIDITY,
          );

          const currentDay = format(
            new Date(),
            'EEEE',
          ).toLowerCase() as WeekDay;

          for (const alert of alerts) {
            if (
              this.alertService.shouldSendAlert(
                alert,
                currentDay,
                updatedFields.temperature || updatedFields.relativeHumidity,
              )
            ) {
              await this.mailService.sendDeviceAlert(
                alert.recipients,
                alert.device.name,
                Field.TEMPERATURE,
                updatedFields.temperature || updatedFields.relativeHumidity,
                updatedFields.temperature ? '°C' : '%',
                format(alert.device.lastUpdated, 'dd/MM/yyyy HH:mm:ss'),
              );
            }
          }
        }
      }
    });
  }

  async getDeviceById(device: string): Promise<Device> {
    return this.deviceModel.findById(device);
  }

  async updateDeviceBySlug(slug: string, pressure: number): Promise<Device> {
    return this.deviceModel.findOneAndUpdate(
      { slug },
      { pressure, lastUpdated: new Date() },
      { new: true },
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
    return this.deviceModel.paginate(
      {
        ...(type && { type }),
        ...(search && {
          $or: [
            { oem: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } },
          ],
        }),
      },
      { page, limit, projection: '-createdAt' },
    );
  }

  async device(user: string, id: string): Promise<Device> {
    const device = await this.deviceModel.findById(id, '-createdAt');
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    await this.logService.createLog(user, {
      action: Action.VIEWED,
      page: Page.DEVICE,
      device: id,
    });
    return device;
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
    const device = await this.deviceModel.findByIdAndDelete(id);
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
