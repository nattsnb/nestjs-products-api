import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Max(2147483647)
  @Min(0)
  priceInPLNgr: number;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isInStock: boolean;
}
