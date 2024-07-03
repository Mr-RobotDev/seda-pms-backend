import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class GetDevicesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ each: true })
  type?: string[];

  @IsOptional()
  @IsString()
  search?: string;
}
