import { IsDate, IsNotEmpty } from 'class-validator';
import { ToDate } from '../../common/transformers/to-date.transformer';

export class GetChangeLogsQueryDto {
  @IsDate()
  @ToDate()
  @IsNotEmpty()
  from?: Date;

  @IsDate()
  @ToDate()
  @IsNotEmpty()
  to?: Date;
}
