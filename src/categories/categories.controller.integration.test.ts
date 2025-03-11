import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProductsService } from '../products/products.service';
import * as request from 'supertest';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { Prisma } from '@prisma/client';

describe('The CategoriesController', () => {
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
        CategoriesService,
        { provide: ProductsService, useValue: {} },
        {
          provide: PrismaService,
          useValue: {
            category: {
              findUnique: findUniqueMock,
              findMany: findManyMock,
              create: createMock,
              update: updateMock,
              delete: deleteMock,
            },
            $transaction: jest.fn(async (callback) =>
              callback({
                category: {
                  findUnique: findUniqueMock,
                  findMany: findManyMock,
                  create: createMock,
                  update: updateMock,
                  delete: deleteMock,
                },
                product: {
                  deleteMany: jest.fn(),
                },
              }),
            ),
          },
        },
      ],
      controllers: [CategoriesController],
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
    await app.init();
  });
  describe('GET /categories', () => {
    it('should return a list of categories', async () => {
      findManyMock.mockResolvedValue([{ id: 1, name: 'Category 1' }]);
      return request(app.getHttpServer())
        .get('/categories')
        .expect(200)
        .expect([{ id: 1, name: 'Category 1' }]);
    });
  });
  describe('GET /categories/:id', () => {
    it('should return the category if found', async () => {
      findUniqueMock.mockResolvedValue({ id: 1, name: 'Category' });
      return request(app.getHttpServer())
        .get('/categories/1')
        .expect(200)
        .expect({ id: 1, name: 'Category' });
    });
    it('should return 404 if category does not exist', async () => {
      findUniqueMock.mockResolvedValue(null);
      return request(app.getHttpServer()).get('/categories/999').expect(404);
    });
  });
  describe('POST /categories', () => {
    it('should create a category', async () => {
      createMock.mockResolvedValue({ id: 1, name: 'New Category' });
      return request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'New Category' })
        .expect(201)
        .expect({ id: 1, name: 'New Category' });
    });
  });
  describe('PATCH /categories/:id', () => {
    it('should return 404 if category does not exist', async () => {
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
        .patch('/categories/999')
        .send({ name: 'Does not exist' })
        .expect(404);
    });
  });
  describe('DELETE /categories/:id', () => {
    it('should delete the category if it exists', async () => {
      findUniqueMock.mockResolvedValue({
        id: 1,
        name: 'Category',
        products: [],
      });
      deleteMock.mockResolvedValue({ id: 1 });
      return request(app.getHttpServer()).delete('/categories/1').expect(200);
    });
    it('should return 404 if category does not exist', async () => {
      findUniqueMock.mockResolvedValue(null);
      deleteMock.mockRejectedValue({ code: 'P2025' });
      return request(app.getHttpServer()).delete('/categories/999').expect(404);
    });
  });
});
