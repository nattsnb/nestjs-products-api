import { AuthenticationService } from './authentication.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { Test } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import { hash } from 'bcrypt';
import { WrongCredentialsException } from './wrong-credentials-exception';
import { NotFoundException } from '@nestjs/common';

describe('The AuthenticationService', () => {
  let userData: User;
  let password: string;
  let authenticationService: AuthenticationService;
  let getBtyEmailMock: jest.Mock;
  beforeEach(async () => {
    password = 'strongPassword123';
    const hashedPassword = await hash(password, 10);
    getBtyEmailMock = jest.fn();
    userData = {
      id: 1,
      email: 'john.smith@gmail.com',
      name: 'John',
      password: hashedPassword,
      addressId: null,
      phoneNumber: null,
      profileImageId: null,
    };
    const module = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: UsersService,
          useValue: {
            getByEmail: getBtyEmailMock,
          },
        },
      ],
      imports: [
        DatabaseModule,
        UsersModule,
        ConfigModule.forRoot(),
        JwtModule.register({
          secret: 'Secret key',
        }),
      ],
    }).compile();

    authenticationService = await module.get(AuthenticationService);
  });
  describe('when the getCookieForLogOut method is called', () => {
    it('should return a cookie with empty Authentication token', () => {
      const cookie = authenticationService.getCookieForLogOut();

      const containsAuthenticationToken = cookie.includes('Authentication=;');

      expect(containsAuthenticationToken).toBe(true);
    });
    it('should return a cookie marked with HttpOnly', () => {
      const cookie = authenticationService.getCookieForLogOut();

      const containsHttpOnlyHeader = cookie.includes('HttpOnly;');

      expect(containsHttpOnlyHeader).toBe(true);
    });
  });
  describe('when the getAuthenticatedUser method is called', () => {
    describe('and a valid email and password are provided', () => {
      beforeEach(() => {
        getBtyEmailMock.mockResolvedValue(userData);
      });
      it('should return the new user', async () => {
        const result = await authenticationService.getAuthenticatedUser({
          email: userData.email,
          password,
        });
        expect(result).toBe(userData);
      });
    });
    describe('an invalid email is provided', () => {
      beforeEach(() => {
        getBtyEmailMock.mockRejectedValue(new NotFoundException());
      });
      it('should throw the BadRequestException', async () => {
        return expect(async () => {
          await authenticationService.getAuthenticatedUser({
            email: 'john.smith@gmail.com',
            password,
          });
        }).rejects.toThrow(WrongCredentialsException);
      });
    });
  });
});
