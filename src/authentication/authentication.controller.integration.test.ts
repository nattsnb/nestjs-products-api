import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { UsersService } from '../users/users.service';
import { JwtAuthenticationGuard } from './jwt-authentication.guard';
import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

describe('The AuthenticationController', () => {
  let app: INestApplication;
  let authenticationService: {
    signUp: jest.Mock;
    getAuthenticatedUser: jest.Mock;
    getCookieWithJwtToken: jest.Mock;
    getCookieForLogOut: jest.Mock;
  };
  let usersService: {
    getById: jest.Mock;
  };
  let mockUser: User;

  beforeEach(async () => {
    authenticationService = {
      signUp: jest.fn(),
      getAuthenticatedUser: jest.fn(),
      getCookieWithJwtToken: jest.fn(),
      getCookieForLogOut: jest.fn(),
    };

    usersService = {
      getById: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        { provide: AuthenticationService, useValue: authenticationService },
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: {} },
        { provide: JwtService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthenticationGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 1, name: 'John Smith' };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = { id: 1, name: 'John Smith' };
      next();
    });
    await app.init();

    mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'John Smith',
      phoneNumber: '123456789',
      addressId: 1,
      profileImageId: 1,
    } as User;
  });

  describe('POST /authentication/sign-up', () => {
    it('should sign up a user', () => {
      authenticationService.signUp.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/authentication/sign-up')
        .send({
          email: 'test@example.com',
          name: 'John Smith',
          password: 'Password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              email: 'test@example.com',
              name: 'John Smith',
            }),
          );
        });
    });
  });

  describe('POST /authentication/log-in', () => {
    it('should log in a user and set cookie', () => {
      authenticationService.getAuthenticatedUser.mockResolvedValue(mockUser);
      authenticationService.getCookieWithJwtToken.mockReturnValue(
        'Authentication=token;',
      );

      return request(app.getHttpServer())
        .post('/authentication/log-in')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        })
        .expect(200)
        .expect('Set-Cookie', /Authentication=token/)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              email: 'test@example.com',
              name: 'John Smith',
            }),
          );
        });
    });
  });

  describe('POST /authentication/log-out', () => {
    it('should log out a user and clear cookie', () => {
      authenticationService.getCookieForLogOut.mockReturnValue(
        'Authentication=; Max-Age=0',
      );

      return request(app.getHttpServer())
        .post('/authentication/log-out')
        .expect(200)
        .expect('Set-Cookie', /Authentication=;/);
    });
  });

  describe('GET /authentication', () => {
    it('should authenticate a user', () => {
      usersService.getById.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .get('/authentication')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              email: 'test@example.com',
              name: 'John Smith',
            }),
          );
        });
    });
  });
});
