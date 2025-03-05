import {IsInt, IsNotEmpty, IsString} from "class-validator";

export class Product {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  priceInPLNgr: number;

  @IsInt()
  @IsNotEmpty()
  quantity: number;
}