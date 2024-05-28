import { IsBoolean, IsDate, IsNumber, IsOptional } from 'class-validator';

export class UpdateDeviceByOem {
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @IsOptional()
  relativeHumidity?: number;

  @IsNumber()
  @IsOptional()
  signalStrength?: number;

  @IsBoolean()
  @IsOptional()
  isOffline?: boolean;

  @IsDate()
  @IsOptional()
  lastUpdated?: Date;
}
