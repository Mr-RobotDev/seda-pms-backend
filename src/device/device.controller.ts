import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller({
  path: 'devices',
  version: '1',
})
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Roles(Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.OK)
  createDevice(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.createDevice(createDeviceDto);
  }

  @Get()
  devices(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
  ) {
    return this.deviceService.devices(page, limit, type);
  }

  @Get('stats')
  deviceStats() {
    return this.deviceService.deviceStats();
  }

  @Get(':device')
  device(@Param('device') device: string) {
    return this.deviceService.device(device);
  }

  @Roles(Role.ADMIN)
  @Patch(':device')
  updateDevice(
    @Param('device') device: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.deviceService.updateDevice(device, updateDeviceDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':device')
  removeDevice(@Param('device') device: string) {
    return this.deviceService.removeDevice(device);
  }
}
