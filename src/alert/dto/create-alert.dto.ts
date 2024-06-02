import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TriggerDto } from './trigger.dto';

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  devices: string[];

  @ValidateNested()
  @Type(() => TriggerDto)
  trigger: TriggerDto;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipients: string[];
}
