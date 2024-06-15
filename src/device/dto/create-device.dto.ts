import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { LocationDto } from './location.dto';
import { Type } from 'class-transformer';
import { DeviceType } from '../enums/device-type.enum';

export class CreateDeviceDto {
  @ValidateIf((o) => o.type !== DeviceType.PRESSURE)
  @IsString()
  @IsNotEmpty()
  oem?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsEnum(DeviceType)
  @IsNotEmpty()
  type: DeviceType;

  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;
}
