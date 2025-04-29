import { Address, ProfileImage, User } from '@prisma/client';
import { Exclude, Transform } from 'class-transformer';
import { TransformPhoneNumberToDisplay } from '../../Utilities/transform-phone-number-to-display';

export class AuthenticationResponseDto implements User {
  id: number;
  name: string;
  email: string;
  addressId: number;
  address: Address;
  profileImage: ProfileImage;
  profileImageId: number;

  @TransformPhoneNumberToDisplay()
  phoneNumber: string | null;

  @Exclude()
  password: string;
}
