import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { UsersService } from '../users/users.service';
import { JwtAuthenticationGuard } from './jwt-authentication.guard';
import * as request from 'supertest';
import { Response } from 'express';

describe('The AuthenticationController', () => {
  let app: INestApplication;
  let signUpMock: jest.Mock;
  let logInMock: jest.Mock;
  let getAuthenticatedUserMock: jest.Mock;
  let getCookieWithJwtTokenMock: jest.Mock;
  let getCookieForLogOutMock: jest.Mock;
  let getByIdMock: jest.Mock;
  beforeEach(async () => {
    signUpMock = jest.fn();
    logInMock = jest.fn();
    getAuthenticatedUserMock = jest.fn();
    getCookieWithJwtTokenMock = jest.fn();
    getCookieForLogOutMock = jest.fn();
    getByIdMock = jest.fn();
    const module = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: {
            signUp: signUpMock,
            getAuthenticatedUser: getAuthenticatedUserMock,
            getCookieWithJwtToken: getCookieWithJwtTokenMock,
            getCookieForLogOut: getCookieForLogOutMock,
          },
        },
        {
          provide: UsersService,
          useValue: {
            getById: getByIdMock,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthenticationGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 1, name: 'John Doe' };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });
  describe('POST /authentication/sign-up', () => {
    it('should register a new user and return authentication response', async () => {
      const signUpData = { email: 'test@example.com', password: 'strongPass' };
      const authResponse = { id: 1, email: 'test@example.com' };
      signUpMock.mockResolvedValue(authResponse);
      return request(app.getHttpServer())
        .post('/authentication/sign-up')
        .send(signUpData)
        .expect(201)
        .expect(authResponse);
    });
  });
  describe('POST /authentication/log-in', () => {
    it('should log in a user and return authentication response', async () => {
      const logInData = { email: 'test@example.com', password: 'strongPass' };
      const user = { id: 1, email: 'test@example.com' };
      getAuthenticatedUserMock.mockResolvedValue(user);
      getCookieWithJwtTokenMock.mockReturnValue('jwt=mockedToken');
      return request(app.getHttpServer())
        .post('/authentication/log-in')
        .send(logInData)
        .expect(200)
        .expect('Set-Cookie', 'jwt=mockedToken')
        .expect(user);
    });
  });
  describe('POST /authentication/log-out', () => {
    it('should log out a user and clear the cookie', async () => {
      getCookieForLogOutMock.mockReturnValue('jwt=; HttpOnly');
      return request(app.getHttpServer())
        .post('/authentication/log-out')
        .expect(200)
        .expect('Set-Cookie', 'jwt=; HttpOnly');
    });
  });
  describe('GET /authentication', () => {
    it('should return the authenticated user', async () => {
      const user = { id: 1, email: 'test@example.com' };
      getByIdMock.mockResolvedValue(user);
      return request(app.getHttpServer())
        .get('/authentication')
        .expect(200)
        .expect(user);
    });
  });
});
