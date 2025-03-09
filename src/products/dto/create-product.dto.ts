import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CanBeUndefinied } from '../../Utilities/can-be-undefinied';

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

  @IsString()
  @IsNotEmpty()
  description: string;

  @CanBeUndefinied()
  @IsNumber({}, { each: true })
  categoryIds: number[];
}
