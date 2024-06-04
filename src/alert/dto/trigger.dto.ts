import { IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Field } from '../../common/enums/field.enum';
import { RangeDto } from './range.dto';

export class TriggerDto {
  @IsEnum(Field)
  @IsNotEmpty()
  field: Field;

  @ValidateNested()
  @Type(() => RangeDto)
  range: RangeDto;
}
