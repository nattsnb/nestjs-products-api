import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NextFunction, Request, Response } from 'express';
import { prismaRecordNotFoundError } from '../Utilities/prismaRecordNotFoundError';

describe('The UsersController', () => {
  let app: INestApplication;
  let usersService: {
    editPhoneNumber: jest.Mock;
    deleteUser: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      editPhoneNumber: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
      controllers: [UsersController],
      imports: [],
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
  });

  describe('when the PATCH /users/phone endpoint is called', () => {
    it('should call editPhoneNumber and return updated user', () => {
      const updatedUser = { id: 1, phoneNumber: '*********789' };
      usersService.editPhoneNumber.mockResolvedValue(updatedUser);

      return request(app.getHttpServer())
        .patch('/users/phone')
        .send({ phoneNumber: '+48123456789' })
        .expect(200)
        .expect(updatedUser);
    });

    it('should return 400 Bad Request if phoneNumber is missing', () => {
      return request(app.getHttpServer())
        .patch('/users/phone')
        .send({})
        .expect(400);
    });

    it('should return 500', () => {
      usersService.editPhoneNumber.mockRejectedValue(
        prismaRecordNotFoundError(),
      );

      return request(app.getHttpServer())
        .patch('/users/phone')
        .send({ phoneNumber: '+48123456789' })
        .expect(500);
    });
  });

  describe('when the DELETE /users endpoint is called', () => {
    it('should call deleteUser without newAuthor', () => {
      usersService.deleteUser.mockResolvedValue({});

      return request(app.getHttpServer())
        .delete('/users')
        .expect(200)
        .then(() => {
          expect(usersService.deleteUser).toHaveBeenCalledWith(1, undefined);
        });
    });

    it('should call deleteUser with newAuthor', () => {
      usersService.deleteUser.mockResolvedValue({});

      return request(app.getHttpServer())
        .delete('/users?newAuthor=2')
        .expect(200)
        .then(() => {
          expect(usersService.deleteUser).toHaveBeenCalledWith(1, 2);
        });
    });

    it('should return 500 if user not found when deleting', () => {
      usersService.deleteUser.mockRejectedValue(prismaRecordNotFoundError());

      return request(app.getHttpServer()).delete('/users').expect(500);
    });
  });
});
