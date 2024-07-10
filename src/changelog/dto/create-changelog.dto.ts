import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChangeLogDto {
  @IsString()
  @IsNotEmpty()
  version: string;

  @IsString()
  @IsNotEmpty()
  change: string;
}
