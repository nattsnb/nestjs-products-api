import { Injectable, NotFoundException } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { UserService } from '../user/user.service';
import { compare, hash } from 'bcrypt';
import { LogInDto } from './dto/log-in.dto';
import { WrongCredentialsException } from './wrong-credentials-exception';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './token-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(singUpData: SignUpDto) {
    const hashedPassword = await hash(singUpData.password, 10);
    return this.userService.create({
      email: singUpData.email,
      name: singUpData.name,
      password: hashedPassword,
      phoneNumber: singUpData.phoneNumber,
    });
  }

  private async getUserByEmail(email: string) {
    try {
      return await this.userService.getByEmail(email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new WrongCredentialsException();
      }
      throw error;
    }
  }

  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ) {
    const isPasswordMatching = await compare(plainTextPassword, hashedPassword);
    if (!isPasswordMatching) {
      throw new WrongCredentialsException();
    }
  }

  async getAuthenticatedUser(logInData: LogInDto) {
    const user = await this.getUserByEmail(logInData.email);
    await this.verifyPassword(logInData.password, user.password);
    return user;
  }

  getCookieWithJwtToken(userId: number) {
    const payload: TokenPayload = { userId };
    const token = this.jwtService.sign(payload);
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_EXPIRATION_TIME',
    )}`;
  }

  getCookieForLogOut() {
    return `Authentication=; HttpOnly; Path=/; Max-Age=0`;
  }
}
