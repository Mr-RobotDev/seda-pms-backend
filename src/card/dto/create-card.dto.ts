import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  EventDataType,
  EventDataTypeValues,
} from '../../event/enums/event-data-type.enum';

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

  @IsIn(EventDataTypeValues)
  @IsString()
  @IsNotEmpty()
  eventDataType: EventDataType;

  @IsArray()
  @ArrayNotEmpty()
  devices: string[];
}
