import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  frequency: number;
}
