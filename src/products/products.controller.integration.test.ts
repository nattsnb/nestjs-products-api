import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import * as request from 'supertest';
import { Prisma } from '@prisma/client';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';

describe('The ProductsController', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
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
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: findUniqueMock,
              findMany: findManyMock,
              create: createMock,
              update: updateMock,
              delete: deleteMock,
            },
          },
        },
      ],
      controllers: [ProductsController],
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
    prismaService = module.get<PrismaService>(PrismaService);
    await app.init();
    await prismaService.product.create({
      data: {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        priceInPLNgr: '1000',
        isInStock: true,
        upvotes: 0,
        userId: 1,
        categories: { connect: [] },
      },
    });
  });
  afterEach(async () => {
    await app.close();
  });
  describe('GET /products', () => {
    it('should return all products', async () => {
      findManyMock.mockResolvedValue([
        { id: 1, name: 'Test Product', description: 'Test Description' },
      ]);
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(Number),
                name: expect.any(String),
                description: expect.any(String),
              }),
            ]),
          );
        });
    });
  });
  describe('GET /products/:id', () => {
    it('should return a product if it exists', async () => {
      findUniqueMock.mockResolvedValue({
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
      });
      return request(app.getHttpServer())
        .get('/products/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              description: expect.any(String),
            }),
          );
        });
    });
    it('should return 404 if product does not exist', async () => {
      findUniqueMock.mockResolvedValue(null);
      return request(app.getHttpServer()).get('/products/999').expect(404);
    });
  });
  describe('PATCH /products/:id', () => {
    it('should return 404 if product does not exist', async () => {
      findUniqueMock.mockResolvedValue(null);
      updateMock.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Record to update not found.',
          {
            code: 'P2025',
            clientVersion: '6.5.0',
          },
        ),
      );
      return request(app.getHttpServer())
        .patch('/products/999')
        .send({ name: 'Updated Product' })
        .expect(404);
    });
    it('should update the product if it exists', async () => {
      findUniqueMock.mockResolvedValue({
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
      });
      updateMock.mockResolvedValue({
        id: 1,
        name: 'Updated Product',
        description: 'Updated Description',
      });
      return request(app.getHttpServer())
        .patch('/products/1')
        .send({ name: 'Updated Product', description: 'Updated Description' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              id: 1,
              name: 'Updated Product',
              description: 'Updated Description',
            }),
          );
        });
    });
  });
  describe('DELETE /products/:id', () => {
    it('should delete the product if it exists', async () => {
      findUniqueMock.mockResolvedValue({ id: 1, name: 'Test Product' });
      deleteMock.mockResolvedValue({ id: 1 });
      return request(app.getHttpServer()).delete('/products/1').expect(200);
    });
    it('should return 404 if product does not exist', async () => {
      findUniqueMock.mockResolvedValue(null);
      deleteMock.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Record to delete not found.',
          {
            code: 'P2025',
            clientVersion: '6.5.0',
          },
        ),
      );
      return request(app.getHttpServer()).delete('/products/999').expect(404);
    });
  });
  describe('POST /products', () => {
    it('should create a product', async () => {
      findUniqueMock.mockResolvedValue(null);
      createMock.mockResolvedValue({
        id: 1,
        name: 'New Product',
        description: 'Test Description',
        userId: 1,
      });
      return request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'New Product',
          description: 'Test Description',
          userId: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              description: expect.any(String),
            }),
          );
        });
    });
  });
});
