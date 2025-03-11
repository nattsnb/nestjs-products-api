import { AuthenticationService } from './authentication.service';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {JwtModule, JwtService} from '@nestjs/jwt';
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
  let jwtServiceMock: JwtService;
  let configServiceMock: ConfigService;
  let getBtyEmailMock: jest.Mock;
  beforeEach(async () => {
    password = 'strongPassword123';
    const hashedPassword = await hash(password, 10);
    getBtyEmailMock = jest.fn();
    jwtServiceMock = new JwtService({ secret: 'secret key' });
    configServiceMock = new ConfigService();
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
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
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
  describe('when the get getCookieWithJwtToken method is called', () => {
    describe('and a valid userId is provided', () => {
      let userId: number;
      let token: string;
      beforeEach(() => {
        userId = 1;
        token = 'mockedJwtToken';
        jwtServiceMock.sign = jest.fn().mockReturnValue(token);
        configServiceMock.get = jest.fn().mockReturnValue(43200);
      });
      it('should return a valid authentication cookie', () => {
        const cookie = authenticationService.getCookieWithJwtToken(userId);
        expect(cookie).toContain(`Authentication=${token}`);
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('Path=/');
        expect(cookie).toContain('Max-Age=43200');
      })
    });
  })
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
