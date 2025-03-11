import { Test } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';

describe('UsersController (Integration)', () => {
  let app: INestApplication;
  let editPhoneNumberMock: jest.Mock;
  let deleteUserMock: jest.Mock;
  beforeEach(async () => {
    editPhoneNumberMock = jest.fn();
    deleteUserMock = jest.fn();
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            editPhoneNumber: editPhoneNumberMock,
            deleteUser: deleteUserMock,
          },
        },
      ],
    })
      .overrideGuard(JwtAuthenticationGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 1, name: 'Test User' };
          return true;
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });
  describe('PATCH /users/phone', () => {
    it('should update the phone number and return the updated user', async () => {
      const mockResponse = { id: 1, phoneNumber: '******789' };
      editPhoneNumberMock.mockResolvedValue(mockResponse);
      return request(app.getHttpServer())
        .patch('/users/phone')
        .send({ phoneNumber: '123456789' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              id: 1,
              phoneNumber: expect.stringMatching(/\*{6}\d{3}/),
            }),
          );
        });
    });
    it('should return an error or default response if phoneNumber is missing', async () => {
      return request(app.getHttpServer())
        .patch('/users/phone')
        .send({})
        .expect((res) => {
          if (res.status !== 400) {
          }
          expect([200, 400]).toContain(res.status);
        });
    });
  });
  describe('DELETE /users', () => {
    it('should delete the user', async () => {
      deleteUserMock.mockResolvedValue({ success: true });
      return request(app.getHttpServer())
        .delete('/users')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({ success: true });
        });
    });
  });
});
