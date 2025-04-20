import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { RequestWithUser } from '../authentication/request-with-user';
import { EditPhoneNumberDto } from './edit-phone-number.dto';
import { TransformPlainToInstance } from 'class-transformer';
import { AuthenticationResponseDto } from '../authentication/dto/authentication-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @UseGuards(JwtAuthenticationGuard)
  @Patch('phone')
  @TransformPlainToInstance(AuthenticationResponseDto)
  editPhoneNumber(
    @Req() req: RequestWithUser,
    @Body() phoneNumberObject: EditPhoneNumberDto,
  ) {
    return this.userService.editPhoneNumber(
      req.user.id,
      phoneNumberObject.phoneNumber,
    );
  }
}
