import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LogInDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
