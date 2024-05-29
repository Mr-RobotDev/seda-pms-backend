import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Role, RoleValues } from '../../common/enums/role.enum';
import { Organization, OrganizationValues } from '../enums/organization.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(RoleValues)
  @IsString()
  role: Role;

  @IsIn(OrganizationValues)
  @IsString()
  @IsNotEmpty()
  organization: Organization;
}
