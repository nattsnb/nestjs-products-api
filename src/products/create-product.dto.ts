import {IsInt, IsNotEmpty, IsString, Max, Min} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()

  @Max(2147483647)
  @Min(0)
  priceInPLNgr: number;

  @IsInt()
  @Max(2147483647)
  @Min(0)
  quantity: number;
}
