import { IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateEventDto {
  @IsMongoId()
  @IsNotEmpty()
  device: string;

  @IsNumber()
  temperature?: number;

  @IsNumber()
  relativeHumidity?: number;

  @IsNumber()
  pressure?: number;
}
