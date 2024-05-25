import { IsInt, IsNotEmpty } from 'class-validator';

export class LocationDto {
  @IsInt()
  @IsNotEmpty()
  lat: number;

  @IsInt()
  @IsNotEmpty()
  long: number;
}
