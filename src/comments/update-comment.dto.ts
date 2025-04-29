import { IsNotEmpty, IsString } from 'class-validator';
import { CanBeUndefinied } from '../Utilities/can-be-undefinied';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @CanBeUndefinied()
  text: string;
}
