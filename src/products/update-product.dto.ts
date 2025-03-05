import {IsInt, IsNotEmpty, IsOptional, IsString, Max, Min} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsInt()
  @Max(2147483647)
  @Min(0)
  priceInPLNgr?: number;

  @IsOptional()
  @IsInt()
  @Max(2147483647)
  @Min(0)
  quantity?: number;
}
