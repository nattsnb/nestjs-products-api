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

  @IsString()
  @IsNotEmpty()
  priceInPLNgr: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isInStock: boolean;
}
