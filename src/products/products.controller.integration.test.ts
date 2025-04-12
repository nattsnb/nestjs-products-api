import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { prismaRecordNotFoundError } from '../Utilities/prismaRecordNotFoundError';
import { Request, Response, NextFunction } from 'express';
import { Product } from '@prisma/client';

describe('The ProductsController', () => {
  let app: INestApplication;
  let productsService: {
    getAllProducts: jest.Mock;
    getOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    changeOwnership: jest.Mock;
    downvote: jest.Mock;
    upvote: jest.Mock;
    delete: jest.Mock;
    deleteAllArticlesWithUpvoteLowerThan: jest.Mock;
  };
  let products: Product[];

  beforeEach(async () => {
    productsService = {
      getAllProducts: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      changeOwnership: jest.fn(),
      downvote: jest.fn(),
      upvote: jest.fn(),
      delete: jest.fn(),
      deleteAllArticlesWithUpvoteLowerThan: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: ProductsService,
          useValue: productsService,
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = { id: 1, name: 'John Smith' };
      next();
    });
    await app.init();

    products = [
      {
        name: 'Product2',
        description: 'Desc',
        priceInPLNgr: '100',
        isInStock: true,
        upvotes: 0,
        userId: 2,
        id: 2,
      },
      {
        name: 'Product1',
        description: 'Desc',
        priceInPLNgr: '100',
        isInStock: true,
        upvotes: 0,
        userId: 1,
        id: 1,
      },
    ];
  });

  describe('when the GET /products endpoint is called', () => {
    it('should return all products', () => {
      productsService.getAllProducts.mockResolvedValue(products);
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                name: 'Product1',
                description: 'Desc',
                priceInPLNgr: '100',
                isInStock: true,
              }),
              expect.objectContaining({
                name: 'Product2',
                description: 'Desc',
                priceInPLNgr: '100',
                isInStock: true,
              }),
            ]),
          );
        });
    });

    it('should return 500 on error', () => {
      productsService.getAllProducts.mockRejectedValue(new Error());
      return request(app.getHttpServer()).get('/products').expect(500);
    });
  });

  describe('when the GET /products/:id endpoint is called', () => {
    it('should return one product', () => {
      productsService.getOne.mockResolvedValue(products[0]);
      return request(app.getHttpServer())
        .get('/products/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(products[0]);
        });
    });

    it('should return 500 if product not found', () => {
      productsService.getOne.mockRejectedValue(new Error());
      return request(app.getHttpServer()).get('/products/999').expect(500);
    });
  });

  describe('when the POST /products endpoint is called', () => {
    it('should create a product', () => {
      const newProductData = {
        name: 'New Product',
        description: 'Desc', // ← tutaj wielka litera
        priceInPLNgr: '100',
        isInStock: true,
      };
      const newProduct = {
        name: newProductData.name,
        description: newProductData.description,
        priceInPLNgr: newProductData.priceInPLNgr,
        isInStock: newProductData.isInStock,
      };
      productsService.create.mockResolvedValue(newProduct);

      return request(app.getHttpServer())
        .post('/products')
        .send(newProductData)
        .expect(201)
        .expect(newProduct);
    });

    it('should return 400 Bad Request on invalid data', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({})
        .expect(400);
    });
  });

  describe('when the PATCH /products/:id endpoint is called', () => {
    it('should update a product', () => {
      const updatedProduct = { name: 'Updated Product' };
      productsService.update.mockResolvedValue(updatedProduct);
      return request(app.getHttpServer())
        .patch('/products/1')
        .send(updatedProduct)
        .expect(200)
        .expect(updatedProduct);
    });

    it('should return 500 if product not found', () => {
      productsService.update.mockRejectedValue(new Error());
      return request(app.getHttpServer())
        .patch('/products/999')
        .send({})
        .expect(500);
    });
  });

  describe('when the PATCH /products/:id/upvote endpoint is called', () => {
    it('should upvote a product', () => {
      productsService.upvote.mockResolvedValue({});
      return request(app.getHttpServer())
        .patch('/products/1/upvote')
        .expect(200);
    });
  });

  describe('PATCH /products/:id/downvote', () => {
    it('should downvote a product', () => {
      productsService.downvote.mockResolvedValue({});
      return request(app.getHttpServer())
        .patch('/products/1/downvote')
        .expect(200);
    });
  });

  describe('when the PATCH /products endpoint is called', () => {
    it('should change ownership', () => {
      productsService.changeOwnership.mockResolvedValue({});
      return request(app.getHttpServer())
        .patch('/products?previousAuthor=1&newAuthor=2')
        .expect(200);
    });
  });

  describe('when the DELETE /products/:id endpoint is called', () => {
    it('should delete a product', () => {
      productsService.delete.mockResolvedValue({});
      return request(app.getHttpServer()).delete('/products/1').expect(200);
    });

    it('should return 500 if product not found', () => {
      productsService.delete.mockRejectedValue(new Error());
      return request(app.getHttpServer()).delete('/products/999').expect(500);
    });
  });

  describe('when the DELETE /products/filter endpoint is called', () => {
    it('should delete filtered products', () => {
      productsService.deleteAllArticlesWithUpvoteLowerThan.mockResolvedValue(
        'Deleted 3 products.',
      );
      return request(app.getHttpServer())
        .delete('/products/filter?upvotesFewerThan=5')
        .expect(200);
    });

    it('should return 500 if no products match filter', () => {
      productsService.deleteAllArticlesWithUpvoteLowerThan.mockRejectedValue(
        new Error(),
      );
      return request(app.getHttpServer())
        .delete('/products/filter?upvotesFewerThan=0')
        .expect(500);
    });
  });
});
