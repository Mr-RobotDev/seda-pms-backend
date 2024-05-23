import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsNotEmpty()
  temperature: number;

  @IsNumber()
  @IsNotEmpty()
  relativeHumidity: number;

  @IsString()
  @IsNotEmpty()
  oem: string;
}
