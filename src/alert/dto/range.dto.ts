import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { RangeType, RangeTypeValues } from '../enums/range-type.enum';

export class RangeDto {
  @IsNumber()
  @IsNotEmpty()
  lower: number;

  @IsNumber()
  @IsNotEmpty()
  upper: number;

  @IsEnum(RangeTypeValues)
  @IsNotEmpty()
  type: RangeType;
}
