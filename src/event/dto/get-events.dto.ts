import { IsOptional, IsDate } from 'class-validator';
import { ToDate } from '../transformers/to-date.transformer';

export class GetEventsQueryDto {
  @IsOptional()
  @IsDate()
  @ToDate()
  from?: Date;

  @IsOptional()
  @IsDate()
  @ToDate()
  to?: Date;

  @IsOptional()
  oem?: string;
}
