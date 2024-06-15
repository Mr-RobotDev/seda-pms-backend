import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  Min,
  ValidateNested,
} from 'class-validator';
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

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  duration: number;
}
