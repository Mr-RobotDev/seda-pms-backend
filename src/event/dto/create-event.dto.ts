import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateEventDto {
  @IsMongoId()
  @IsNotEmpty()
  device: string;

  @IsString()
  oem?: string;

  @IsNumber()
  temperature?: number;

  @IsNumber()
  relativeHumidity?: number;

  @IsNumber()
  pressure?: number;
}
