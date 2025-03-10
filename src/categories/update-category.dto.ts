import { IsNotEmpty, IsString } from 'class-validator';
import { CanBeUndefinied } from '../Utilities/can-be-undefinied';

export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @CanBeUndefinied()
  name: string;
}
