import { IsNotEmpty, IsString } from 'class-validator';
import { CanBeUndefinied } from '../Utilities/can-be-undefinied';

export class UpdateProfileImageDto {
  @IsString()
  @IsNotEmpty()
  @CanBeUndefinied()
  url: string;
}
