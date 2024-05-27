import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { GetDevicesQueryDto } from './dto/get-devices.dto';
import { Device } from './schema/device.schema';
import { PaginatedModel } from '../common/interfaces/paginated-model.interface';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: PaginatedModel<Device>,
  ) {}

  createDevice(createDeviceDto: CreateDeviceDto) {
    return this.deviceModel.create(createDeviceDto);
  }

  devices(query: GetDevicesQueryDto) {
    const { type, page, limit } = query;
    return this.deviceModel.paginate(
      {
        ...(type && { type }),
      },
      { page, limit },
    );
  }

  async device(id: string) {
    const device = await this.deviceModel.findById(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    return device;
  }

  async deviceStats() {
    const [stats] = await this.deviceModel.aggregate([
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          highestTemperature: { $max: '$temperature' },
          highestRelativeHumidity: { $max: '$relativeHumidity' },
        },
      },
      {
        $project: {
          _id: 0,
          totalDevices: 1,
          highestTemperature: 1,
          highestRelativeHumidity: 1,
        },
      },
    ]);
    return stats;
  }

  async updateDevice(id: string, updateDeviceDto: UpdateDeviceDto) {
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
    return device;
  }

  async updateDeviceByOem(
    oem: string,
    temperature: number,
    relativeHumidity: number,
    updateTime: Date,
  ) {
    return this.deviceModel.findOneAndUpdate(
      {
        oem,
      },
      {
        temperature,
        relativeHumidity,
        updatedAt: updateTime,
      },
      {
        new: true,
      },
    );
  }

  async removeDevice(id: string) {
    const device = await this.deviceModel.findByIdAndDelete(id);
    if (!device) {
      throw new NotFoundException(`Device #${id} not found`);
    }
    return device;
  }
}
