import { IsInt, IsNotEmpty } from 'class-validator';

export class AxisDto {
  @IsInt()
  @IsNotEmpty()
  x: number;

  @IsInt()
  @IsNotEmpty()
  y: number;
}
