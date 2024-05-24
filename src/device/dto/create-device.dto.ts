import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { AxisDto } from './axis.dto';
import { Type } from 'class-transformer';

export class CreateDeviceDto {
  @IsString()
  oem?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  temperature?: number;

  @IsNumber()
  relativeHumidity?: number;

  @Type(() => AxisDto)
  @IsNotEmpty()
  axis: AxisDto;
}
