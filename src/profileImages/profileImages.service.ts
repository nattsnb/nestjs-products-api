import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProfileImageDto } from './profile-image.dto';
import { UpdateProfileImageDto } from './update-profile-image.dto';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../database/prisma-error.enum';
import { ProfileImageAlreadyExistsException } from './profile-image-already-exists-exception';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProfileImagesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersServices: UsersService,
  ) {}

  getAll() {
    return this.prismaService.profileImage.findMany();
  }

  async getById(id: number) {
    const profileImage = await this.prismaService.profileImage.findUnique({
      where: {
        id,
      },
    });
    if (!profileImage) {
      throw new NotFoundException();
    }
    return profileImage;
  }

  async updateProfileImage(id: number, profileImage: UpdateProfileImageDto) {
    try {
      return await this.prismaService.profileImage.update({
        where: {
          id,
        },
        data: profileImage,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new NotFoundException();
      }
      throw error;
    }
  }

  async deleteProfileImage(id: number) {
    try {
      return await this.prismaService.category.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new NotFoundException();
      }
      throw error;
    }
  }

  async createProfileImage(id: number, profileImage: ProfileImageDto) {
    const user = await this.usersServices.getById(id);
    if (user.profileImageId) {
      throw new ProfileImageAlreadyExistsException();
    }

    return this.prismaService.profileImage.create({
      data: {
        url: profileImage.url,
        user: {
          connect: {
            id,
          },
        },
      },
    });
  }
}
