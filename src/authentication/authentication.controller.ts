import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SignInDto } from './dto/sign-in.dto';
import { LogInDto } from './dto/log-in.dto';

@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('sign-up')
  async signIn(@Body() signInData: SignInDto) {
    return await this.authenticationService.signIn(signInData);
  }

  @HttpCode(200)
  @Post('log-in')
  async logIn(@Body() logInData: LogInDto) {
    return await this.authenticationService.getAuthenticatedUser(logInData);
  }
}
