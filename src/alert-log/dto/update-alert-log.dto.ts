import { IsOptional, IsString } from 'class-validator';

export class UpdateAlertLogDto {
  @IsString()
  @IsOptional()
  notes: boolean;
}
