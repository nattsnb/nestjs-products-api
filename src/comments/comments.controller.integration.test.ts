import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import * as request from 'supertest';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { RequestWithUser } from '../authentication/request-with-user';
import { Prisma } from '@prisma/client';

describe('The CommentsController', () => {
  let app: INestApplication;
  let findUniqueMock: jest.Mock;
  let findManyMock: jest.Mock;
  let createMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;
  beforeEach(async () => {
    findUniqueMock = jest.fn();
    findManyMock = jest.fn();
    createMock = jest.fn();
    updateMock = jest.fn();
    deleteMock = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: {
            comment: {
              findUnique: findUniqueMock,
              findMany: findManyMock,
              create: createMock,
              update: updateMock,
              delete: deleteMock,
            },
          },
        },
      ],
      controllers: [CommentsController],
    })
      .overrideGuard(JwtAuthenticationGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<RequestWithUser>();
          req.user = {
            id: 1,
            name: 'John Smith',
            email: 'john@example.com',
            password: 'hashedpassword',
            phoneNumber: null,
            addressId: null,
            profileImageId: null,
          };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  describe('GET /comments', () => {
    it('should return all comments', async () => {
      findManyMock.mockResolvedValue([{ id: 1, content: 'Test comment' }]);
      return request(app.getHttpServer())
        .get('/comments')
        .expect(200)
        .expect([{ id: 1, content: 'Test comment' }]);
    });
  });
  describe('GET /comments/:id', () => {
    it('should return a comment if it exists', async () => {
      findUniqueMock.mockResolvedValue({ id: 1, content: 'Test comment' });
      return request(app.getHttpServer())
        .get('/comments/1')
        .expect(200)
        .expect({ id: 1, content: 'Test comment' });
    });
    it('should return 404 if comment does not exist', async () => {
      findUniqueMock.mockResolvedValue(null);
      return request(app.getHttpServer()).get('/comments/999').expect(404);
    });
  });
  describe('PATCH /comments/:id', () => {
    it('should update the comment if it exists', async () => {
      updateMock.mockResolvedValue({ id: 1, content: 'Updated comment' });
      return request(app.getHttpServer())
        .patch('/comments/1')
        .send({ content: 'Updated comment' })
        .expect(200)
        .expect({ id: 1, content: 'Updated comment' });
    });
    it('should return 404 if comment does not exist', async () => {
      updateMock.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Record to update not found.',
          {
            code: 'P2025',
            clientVersion: '6.4.1',
          },
        ),
      );
      return request(app.getHttpServer())
        .patch('/comments/999')
        .send({ content: 'Updated comment' })
        .expect(404);
    });
  });
  describe('DELETE /comments/:id', () => {
    it('should delete the comment if it exists', async () => {
      findUniqueMock.mockResolvedValue({ id: 1, content: 'Test comment' });
      deleteMock.mockResolvedValue({ id: 1 });
      return request(app.getHttpServer()).delete('/comments/1').expect(200);
    });
    it('should return 404 if comment does not exist', async () => {
      findUniqueMock.mockResolvedValue(null);
      deleteMock.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Record to delete not found.',
          {
            code: 'P2025',
            clientVersion: '6.4.1',
          },
        ),
      );
      return request(app.getHttpServer()).delete('/comments/999').expect(404);
    });
  });
  describe('POST /comments', () => {
    it('should create a comment when authenticated', async () => {
      createMock.mockResolvedValue({ id: 1, content: 'New comment' });
      return request(app.getHttpServer())
        .post('/comments')
        .send({ content: 'New comment' })
        .expect(201)
        .expect({ id: 1, content: 'New comment' });
    });
  });
});
