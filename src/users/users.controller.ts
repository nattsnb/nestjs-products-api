import {
  Body,
  Controller,
  Delete,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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

  @Delete()
  @UseGuards(JwtAuthenticationGuard)
  deleteUser(
    @Req() req: RequestWithUser,
    @Query('newAuthor') newAuthor?: string,
  ) {
    const parsedNewAuthor = newAuthor ? parseInt(newAuthor) : undefined;

    // if (newAuthor && isNaN(parsedNewAuthor)) {
    //   throw new BadRequestException("Invalid newAuthor ID. Must be a number.");
    // }

    return this.userService.deleteUser(req.user.id, parsedNewAuthor);
  }
}
