import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ToDate } from '../../common/transformers/to-date.transformer';

export class GetEventsQueryDto {
  @IsDate()
  @ToDate()
  @IsNotEmpty()
  from?: Date;

  @IsDate()
  @ToDate()
  @IsNotEmpty()
  to?: Date;

  @IsString()
  @IsNotEmpty()
  oem?: string;

  @IsOptional()
  @IsString()
  eventTypes?: string;
}
