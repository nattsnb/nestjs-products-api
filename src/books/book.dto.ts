import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CanBeUndefinied } from '../Utilities/can-be-undefinied';

export class BookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  priceInPLNgr: string;

  @CanBeUndefinied()
  @IsNumber({}, { each: true })
  authorIds: number[];
}
