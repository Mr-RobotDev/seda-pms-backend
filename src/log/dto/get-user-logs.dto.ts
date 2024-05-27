import { IsMongoId, IsNotEmpty } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class GetUserLogsQueryDto extends PaginationQueryDto {
  @IsMongoId()
  @IsNotEmpty()
  user: string;
}
