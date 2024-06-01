import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Field } from '../../common/enums/field.enum';
import { IsField } from '../validators/is-field.validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  x: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  y: number;

  @IsInt()
  @IsNotEmpty()
  @Min(2)
  @Max(4)
  rows: number;

  @IsInt()
  @IsNotEmpty()
  @Min(2)
  @Max(4)
  cols: number;

  @IsField()
  @IsString()
  @IsNotEmpty()
  field: Field;

  @IsArray()
  @ArrayNotEmpty()
  devices: string[];
}
