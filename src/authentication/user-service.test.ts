import { UsersService } from '../users/users.service';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserDto } from '../users/user.dto';
import { Prisma, User } from '@prisma/client';
import { PrismaError } from '../database/prisma-error.enum';

describe('The UserService', () => {
  let userService: UsersService;
  let findUniqueMock: jest.Mock;
  let createMock: jest.Mock;
  beforeEach(async () => {
    findUniqueMock = jest.fn();
    createMock = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: findUniqueMock,
              create: createMock,
            },
          },
        },
      ],
    }).compile();

    userService = await module.get(UsersService);
  });
  describe('when the getById function id called', () => {
    describe('and the findUnique method returns the user', () => {
      let user: User;
      beforeEach(() => {
        user = {
          id: 1,
          email: 'john.smith@gmail.com',
          name: 'John',
          password: 'strongPassword123',
          addressId: null,
          phoneNumber: null,
          profileImageId: null,
        };
        findUniqueMock.mockResolvedValue(user);
      });
      it('should return the user', async () => {
        const result = await userService.getById(user.id);
        expect(result).toBe(user);
      });
    });
    describe('and the findUnique method does not return the user', () => {
      beforeEach(() => {
        findUniqueMock.mockResolvedValue(undefined);
      });
      it('should throw NotFoundException', () => {
        return expect(async () => {
          await userService.getById(1);
        }).rejects.toThrow(NotFoundException);
      });
    });
  });
  describe('when the getByEmail function is called', () => {
    describe('and the findUnique method returns the user', () => {
      let user: User;
      beforeEach(() => {
        user = {
          id: 1,
          email: 'john.smith@gmail.com',
          name: 'John',
          password: 'strongPassword123',
          addressId: null,
          phoneNumber: null,
          profileImageId: null,
        };
        findUniqueMock.mockResolvedValue(user);
      });
      it('should return the user', async () => {
        const result = await userService.getByEmail(user.email);
        expect(result).toBe(user);
      });
    });
    describe('and the findUnique method does not return the user', () => {
      beforeEach(() => {
        findUniqueMock.mockResolvedValue(undefined);
      });
      it('should throw NotFoundException', () => {
        return expect(async () => {
          await userService.getByEmail('john.smith@gmail.com');
        }).rejects.toThrow(NotFoundException);
      });
    });
  });
  describe('when the create function is called with valid data', () => {
    let userData: UserDto;
    beforeEach(() => {
      userData = {
        email: 'john.smith@gmail.com',
        name: 'John',
        password: 'strongPassword123',
      };
    });
    describe('and the user.create returns a valid user', () => {
      let user: User;
      beforeEach(() => {
        user = {
          id: 1,
          email: 'john.smith@gmail.com',
          name: 'John',
          password: 'strongPassword123',
          addressId: null,
          phoneNumber: null,
          profileImageId: null,
        };
        createMock.mockResolvedValue(user);
      });
      it('should return the created user', async () => {
        const result = await userService.create(userData);
        expect(result).toBe(user);
      });
    });
    describe('and the user.create causes the UniqueConstraintViolated error', () => {
      beforeEach(() => {
        createMock.mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: PrismaError.UniqueConstraintViolated,
            clientVersion: Prisma.prismaVersion.client,
          }),
        );
      });
      it('should throw the ConflictException error', () => {
        return expect(async () => {
          await userService.create(userData);
        }).rejects.toThrow(ConflictException);
      });
    });
  });
});
