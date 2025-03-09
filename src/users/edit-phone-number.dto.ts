import { IsPhoneNumber } from 'class-validator';

export class EditPhoneNumberDto {
  @IsPhoneNumber()
  phoneNumber: string;
}
