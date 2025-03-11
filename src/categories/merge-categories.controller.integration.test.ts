import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { MergeCategoriesController } from './mergeCategories.controller';
import { CategoriesService } from './categories.service';
import { ProductsService } from '../products/products.service';
import * as request from 'supertest';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';

describe('The MergeCategoriesController', () => {
  let app: INestApplication;
  let mergeCategoriesMock: jest.Mock;
  beforeEach(async () => {
    mergeCategoriesMock = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: ProductsService, useValue: {} },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(async (callback) =>
              callback({
                category: {
                  findMany: jest.fn(),
                  update: jest.fn(),
                  delete: jest.fn(),
                },
                product: {
                  deleteMany: jest.fn(),
                },
              }),
            ),
          },
        },
      ],
      controllers: [MergeCategoriesController],
    })
      .overrideProvider(CategoriesService)
      .useValue({
        mergeCategories: mergeCategoriesMock,
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
  describe('PATCH /merge-categories', () => {
    it('should return 200 when categories are merged successfully', async () => {
      mergeCategoriesMock.mockResolvedValue(undefined);
      return request(app.getHttpServer())
        .patch('/merge-categories')
        .expect(200);
    });
    it('should return 500 when an error occurs', async () => {
      mergeCategoriesMock.mockRejectedValue(new Error('Database error'));
      return request(app.getHttpServer())
        .patch('/merge-categories')
        .expect(500);
    });
  });
});
