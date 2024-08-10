import { IsDate, IsOptional } from 'class-validator';
import { ToDate } from '../../common/transformers/to-date.transformer';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class GetAlertLogsDto extends PaginationQueryDto {
  @IsDate()
  @ToDate()
  @IsOptional()
  from?: Date;

  @IsDate()
  @ToDate()
  @IsOptional()
  to?: Date;
}
