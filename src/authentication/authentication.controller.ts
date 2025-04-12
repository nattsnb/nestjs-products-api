import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SignUpDto } from './dto/sign-up.dto';
import { LogInDto } from './dto/log-in.dto';
import { Response } from 'express';
import { JwtAuthenticationGuard } from './jwt-authentication.guard';
import { RequestWithUser } from './request-with-user';
import { TransformPlainToInstance } from 'class-transformer';
import { AuthenticationResponseDto } from './dto/authentication-response.dto';
import { UsersService } from '../users/users.service';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly usersService: UsersService,
  ) {}

  @Post('sign-up')
  @TransformPlainToInstance(AuthenticationResponseDto)
  async signUp(@Body() signUpData: SignUpDto) {
    return await this.authenticationService.signUp(signUpData);
  }

  @HttpCode(200)
  @Post('log-in')
  @TransformPlainToInstance(AuthenticationResponseDto)
  async logIn(
    @Body() logInData: LogInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user =
      await this.authenticationService.getAuthenticatedUser(logInData);
    const cookie = this.authenticationService.getCookieWithJwtToken(user.id);
    response.setHeader('Set-Cookie', cookie);
    return user;
  }

  @HttpCode(200)
  @Post('log-out')
  async logOut(@Res({ passthrough: true }) response: Response) {
    const cookie = this.authenticationService.getCookieForLogOut();
    response.setHeader('Set-Cookie', cookie);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Get()
  @TransformPlainToInstance(AuthenticationResponseDto)
  async authenticate(@Req() request: RequestWithUser) {
    return this.usersService.getById(request.user.id);
  }
}
