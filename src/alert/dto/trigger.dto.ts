import { IsEnum, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Field, FieldValues } from '../../common/enums/field.enum';
import { RangeDto } from './range.dto';

export class TriggerDto {
  @IsEnum(FieldValues)
  @IsNotEmpty()
  field: Field;

  @ValidateNested()
  @Type(() => RangeDto)
  range: RangeDto;

  @IsNumber()
  @IsNotEmpty()
  triggerCount?: number = 0;
}
