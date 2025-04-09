import { AuthenticationService } from './authentication.service';
import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { hash } from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WrongCredentialsException } from './wrong-credentials-exception';
import { UserDto } from '../users/user.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { PrismaError } from '../database/prisma-error.enum';

describe('The AuthenticationService', () => {
  let getByEmailMock: jest.Mock;
  let createMock: jest.Mock;
  let authenticationService: AuthenticationService;
  let password: string;
  let userData: User;

  beforeEach(async () => {
    getByEmailMock = jest.fn();
    createMock = jest.fn();

    const jwtSignMock = jest.fn().mockReturnValue('mocked-token');
    const configGetMock = jest.fn().mockReturnValue('43200');

    const module = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: UsersService,
          useValue: {
            getByEmail: getByEmailMock,
            create: createMock,
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jwtSignMock,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: configGetMock,
          },
        },
      ],
      imports: [
        ConfigModule.forRoot(),
        JwtModule.register({
          secretOrPrivateKey: 'Secret key',
        }),
      ],
    }).compile();
    authenticationService = await module.get(AuthenticationService);

    password = 'strongPassword123';
    const hashedPassword = await hash(password, 10);
    userData = {
      id: 1,
      email: 'john@smith.com',
      name: 'John',
      password: hashedPassword,
      addressId: null,
      phoneNumber: '123456789',
      profileImageId: null,
    };
  });

  describe('when the getCookieForLogOut method is called', () => {
    it('should return a correct string', () => {
      const result = authenticationService.getCookieForLogOut();
      expect(result).toBe('Authentication=; HttpOnly; Path=/; Max-Age=0');
    });
  });

  describe('when the getAuthenticatedUser method is called', () => {
    describe('and a valid email and password are provided', () => {
      beforeEach(async () => {
        getByEmailMock.mockResolvedValue(userData);
      });
      it('should return the new user', async () => {
        const result = await authenticationService.getAuthenticatedUser({
          email: userData.email!,
          password,
        });
        expect(result).toBe(userData);
      });
    });
    describe('and an invalid email is provided', () => {
      beforeEach(() => {
        getByEmailMock.mockRejectedValue(new NotFoundException());
      });
      it('should throw the BadRequestException', () => {
        return expect(async () => {
          await authenticationService.getAuthenticatedUser({
            email: 'john@smith.com',
            password,
          });
        }).rejects.toThrow(WrongCredentialsException);
      });
    });
  });

  describe('when the signUp function is called', () => {
    let signUpData: SignUpDto;
    beforeEach(() => {
      signUpData = {
        email: userData.email,
        name: userData.name,
        password: userData.password,
        phoneNumber: userData.phoneNumber ?? undefined,
        address: {
          id: 1,
          street: 'street',
          city: 'city',
          country: 'country',
        },
        profileImage: {
          id: 1,
          url: 'www.example.url.pl',
        },
      };
      createMock.mockResolvedValue(userData);
    });
    describe('and valid data is provided', () => {
      beforeEach(() => {
        createMock.mockResolvedValue(userData);
      });
      it('should return valid user with hashed password.', async () => {
        const result = await authenticationService.signUp(signUpData);
        expect(result).toBe(userData);
      });
    });
    describe('and the prisma.create causes the UniqueConstraintViolated error', () => {
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
          await authenticationService.signUp(signUpData);
        }).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
      });
    });
  });

  describe('when the getCookieWithJwtToken function is called', () => {
    it('should return a string with correct JWT Token and expiration date.', () => {
      const result = authenticationService.getCookieWithJwtToken(userData.id);
      expect(result).toBe(
        'Authentication=mocked-token; HttpOnly; Path=/; Max-Age=43200',
      );
    });
  });
});
