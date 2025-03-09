import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserDto } from './user.dto';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../database/prisma-error.enum';
import { UserNotFoundException } from './user-not-found-exception';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(user: UserDto) {
    try {
      return await this.prismaService.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: user.password,
          phoneNumber: user.phoneNumber,
          address: {
            create: user.address,
          },
        },
        include: {
          address: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintViolated
      ) {
        throw new ConflictException('User with this email already exists.');
      }
    }
  }

  async getByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      include: {
        address: true,
        products: true,
      },
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  async getById(id: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
      include: {
        address: true,
        products: true,
      },
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  async editPhoneNumber(id: number, phoneNumber: string) {
    try {
      await this.prismaService.user.update({
        data: {
          phoneNumber: {
            set: phoneNumber,
          },
        },
        where: {
          id,
        },
      });
    } catch (error) {
      throw error;
    }
    return this.getById(id);
  }
}
