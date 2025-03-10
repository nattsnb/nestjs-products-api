import { ProfileImage } from '@prisma/client';

export class UserDto {
  email: string;
  name: string;
  password: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    country: string;
  };
  profileImage?: {
    url: string;
  };
}
