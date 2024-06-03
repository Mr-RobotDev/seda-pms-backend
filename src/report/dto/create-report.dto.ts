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
import { WeekDay } from '../enums/week-day.enum';
import { TimeFrame } from '../enums/timeframe.enum';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TimeFrame)
  @IsNotEmpty()
  timeframe: TimeFrame;

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
  @IsEnum(WeekDay, { each: true })
  weekdays: WeekDay[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsMilitaryTime({ each: true })
  times: string[];
}
