import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Address } from '@prisma/client';
import { CanBeUndefinied } from '../../Utilities/can-be-undefinied';
import { Type } from 'class-transformer';
import { AddressDto } from './address.dto';

export class SignUpDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber: string;

  @CanBeUndefinied()
  @Type(() => AddressDto)
  @IsObject()
  @ValidateNested()
  address?: Address;
}
