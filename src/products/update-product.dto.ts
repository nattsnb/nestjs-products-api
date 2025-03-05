import {IsInt, IsNotEmpty, IsOptional, IsString} from "class-validator";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  priceInPLNgr: number;

  @IsOptional()
  @IsInt()
  @IsNotEmpty()
  quantity: number;
}