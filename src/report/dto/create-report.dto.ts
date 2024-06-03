import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsMilitaryTime,
  ValidateIf,
} from 'class-validator';
import { ScheduleType } from '../enums/schedule-type.enum';
import { CustomDay } from '../enums/custom-day.enum';
import { TimeFrame } from '../enums/timeframe.enum';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TimeFrame)
  @IsNotEmpty()
  timeFrame: TimeFrame;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsEnum(ScheduleType)
  @IsNotEmpty()
  scheduleType: ScheduleType;

  @ValidateIf((o) => o.scheduleType === ScheduleType.CUSTOM)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(CustomDay, { each: true })
  customDays: CustomDay[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsMilitaryTime({ each: true })
  times: string[];
}
