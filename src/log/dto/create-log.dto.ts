import { IsIn, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Action, ActionValues } from '../enums/action.enum';
import { Page, PageValues } from '../enums/page.enum';

export class CreateLogDto {
  @IsIn(ActionValues)
  @IsString()
  @IsNotEmpty()
  action: Action;

  @IsIn(PageValues)
  @IsString()
  page?: Page;

  @IsMongoId()
  dashboard?: string;

  @IsMongoId()
  device?: string;

  @IsString()
  userAgent?: string;
}
