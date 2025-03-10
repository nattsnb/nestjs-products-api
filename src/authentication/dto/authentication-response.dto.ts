import { Address, ProfileImage, User } from '@prisma/client';
import { Exclude, Transform } from 'class-transformer';

export class AuthenticationResponseDto implements User {
  id: number;
  name: string;
  email: string;
  addressId: number;
  address: Address;
  profileImage: ProfileImage;
  profileImageId: number;

  @Transform(({ value: phoneNumber }) => {
    if (!phoneNumber) {
      return null;
    }
    const numberLength = phoneNumber.length;
    const visiblePart = phoneNumber.substring(numberLength - 3, numberLength);
    return `${'*'.repeat(numberLength - 3)}${visiblePart}`;
  })
  phoneNumber: string | null;

  @Exclude()
  password: string;
}
