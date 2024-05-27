import { IsIn, IsString } from 'class-validator';
import { Role, RoleValues } from '../../common/enums/role.enum';

export class UpdateUserRoleDto {
  @IsIn(RoleValues)
  @IsString()
  role: Role;
}
