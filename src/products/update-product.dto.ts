import {IsInt, IsNotEmpty, IsOptional, IsString} from "class-validator";

export class Product {
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