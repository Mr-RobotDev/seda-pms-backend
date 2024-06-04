import { IsEnum, IsNotEmpty, IsNumber, ValidateIf } from 'class-validator';
import { RangeType } from '../enums/range-type.enum';

export class RangeDto {
  @ValidateIf(
    (o) =>
      o.type === RangeType.OUTSIDE ||
      o.type === RangeType.INSIDE ||
      o.type === RangeType.LOWER,
  )
  @IsNumber()
  @IsNotEmpty()
  lower: number;

  @ValidateIf(
    (o) =>
      o.type === RangeType.OUTSIDE ||
      o.type === RangeType.INSIDE ||
      o.type === RangeType.UPPER,
  )
  @IsNumber()
  @IsNotEmpty()
  upper: number;

  @IsEnum(RangeType)
  @IsNotEmpty()
  type: RangeType;
}
