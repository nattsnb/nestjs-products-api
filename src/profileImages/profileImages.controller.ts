import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfileImagesService } from './profileImages.service';
import { UpdateProfileImageDto } from './update-profile-image.dto';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { RequestWithUser } from '../authentication/request-with-user';
import { ProfileImageDto } from './profile-image.dto';

@Controller('profileImages')
export class ProfileImagesController {
  constructor(private readonly profileImagesService: ProfileImagesService) {}

  @Get()
  getAll() {
    return this.profileImagesService.getAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.profileImagesService.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() profileImage: UpdateProfileImageDto,
  ) {
    return this.profileImagesService.updateProfileImage(id, profileImage);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.profileImagesService.deleteProfileImage(id);
  }

  @UseGuards(JwtAuthenticationGuard)
  @Post('')
  createUserImage(
    @Req() req: RequestWithUser,
    @Body() profileImage: ProfileImageDto,
  ) {
    return this.profileImagesService.createProfileImage(
      req.user.id,
      profileImage,
    );
  }
}
