import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CanBeUndefinied } from '../Utilities/can-be-undefinied';

export class UpdateBookDto {
  @CanBeUndefinied()
  @IsString()
  @IsNotEmpty()
  title: string;

  @CanBeUndefinied()
  @IsString()
  @IsNotEmpty()
  priceInPLNgr: string;

  @CanBeUndefinied()
  @IsNumber({}, { each: true })
  authorIds: number[];
}
