import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { CategoriesController } from './categories.controller';
import { Category } from '@prisma/client';
import * as request from 'supertest';
import { CategoriesService } from './categories.service';
import { ProductsService } from '../products/products.service';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategoryDto } from './update-category.dto';
import { prismaRecordNotFoundError } from '../Utilities/prismaRecordNotFoundError';

describe('The CategoriesController', () => {
  let app: INestApplication;
  let findUniqueMock: jest.Mock;
  let createMock: jest.Mock;
  let findManyMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;
  let categoriesArray: Category[];
  beforeEach(async () => {
    findUniqueMock = jest.fn();
    createMock = jest.fn();
    findManyMock = jest.fn();
    updateMock = jest.fn();
    deleteMock = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findUnique: findUniqueMock,
              create: createMock,
              findMany: findManyMock,
              update: updateMock,
              delete: deleteMock,
            },
            $transaction: (callback: any) =>
              callback({
                category: {
                  findUnique: findUniqueMock,
                  delete: deleteMock,
                },
                product: {
                  deleteMany: jest.fn(),
                },
              }),
          },
        },
        {
          provide: ProductsService,
          useValue: {},
        },
      ],
      controllers: [CategoriesController],
      imports: [],
    })
      .overrideGuard(JwtAuthenticationGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 1,
            name: 'John Smith',
          };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });
  describe('The CategoriesController', () => {
    beforeEach(() => {
      categoriesArray = [
        {
          id: 1,
          name: 'My category',
        },
        {
          id: 2,
          name: 'My other category',
        },
      ];
    });
    describe('when the GET /categories/:id endpoint is called', () => {
      beforeEach(() => {
        findUniqueMock.mockImplementation((args: { where: { id: number } }) => {
          if (args.where.id === categoriesArray[0].id) {
            return Promise.resolve(categoriesArray[0]);
          }
          return Promise.resolve(undefined);
        });
      });
      describe('and the category with a given id exists', () => {
        it('should respond with the category', () => {
          return request(app.getHttpServer())
            .get(`/categories/${categoriesArray[0].id}`)
            .expect(categoriesArray[0]);
        });
      });
      describe('and the category with a given id does not exist', () => {
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer()).get('/categories/3').expect(404);
        });
      });
    });

    describe('and the POST /categories endpoint is called', () => {
      describe('and the correct data is provided', () => {
        let newCategoryData: CreateCategoryDto;
        beforeEach(() => {
          newCategoryData = {
            name: categoriesArray[0].name,
          };
          createMock.mockResolvedValue(categoriesArray[0]);
        });
        it('should respond with the new category', () => {
          return request(app.getHttpServer())
            .post('/categories')
            .send(newCategoryData)
            .expect(categoriesArray[0]);
        });
      });
      describe('and wrong data is provided', () => {
        it('should respond with the 400 status', () => {
          return request(app.getHttpServer())
            .post('/categories')
            .send({})
            .expect(400);
        });
      });
    });

    describe('when the GET /categories/ endpoint is called', () => {
      beforeEach(() => {
        findManyMock.mockImplementation(() => {
          return Promise.resolve(categoriesArray);
        });
      });

      it('should respond with the categoriesArray', () => {
        return request(app.getHttpServer())
          .get('/categories')
          .expect(categoriesArray);
      });

      describe('and the categoriesArray is empty', () => {
        beforeEach(() => {
          findManyMock.mockResolvedValue([]);
        });
        it('should respond with the empty array', () => {
          return request(app.getHttpServer()).get('/categories').expect([]);
        });
      });
    });

    describe('and the UPDATE /categories endpoint is called', () => {
      describe('and the correct data is provided', () => {
        let updateCategoryData: UpdateCategoryDto;
        let updatedCategory: Category;
        beforeEach(() => {
          const updatedName = 'New category';
          updateCategoryData = {
            name: updatedName,
          };
          updatedCategory = {
            id: categoriesArray[0].id,
            name: updatedName,
          };
          updateMock.mockImplementation((args: { where: { id: number } }) => {
            if (args.where.id === categoriesArray[0].id) {
              return Promise.resolve(updatedCategory);
            }
          });
        });
        it('should respond with the updated category', () => {
          return request(app.getHttpServer())
            .patch(`/categories/${categoriesArray[0].id}`)
            .send(updateCategoryData)
            .expect(updatedCategory);
        });
      });
      describe('and the category with a given id does not exist', () => {
        beforeEach(() => {
          updateMock.mockImplementation((args: { where: { id: number } }) => {
            throw prismaRecordNotFoundError();
          });
        });
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer())
            .patch(`/categories/3`)
            .send({})
            .expect(404);
        });
      });
    });

    describe('when the DELETE /categories/:id endpoint is called', () => {
      beforeEach(() => {
        findUniqueMock.mockImplementation((args: { where: { id: number } }) => {
          if (args.where.id === categoriesArray[0].id) {
            return Promise.resolve({
              id: categoriesArray[0].id,
              name: categoriesArray[0].name,
              products: [],
            });
          }
          return Promise.resolve(undefined);
        });

        deleteMock.mockImplementation((args: { where: { id: number } }) => {
          if (args.where.id === categoriesArray[0].id) {
            return Promise.resolve();
          }
          throw prismaRecordNotFoundError();
        });
      });
      describe('and the category with a given id exists', () => {
        it('should respond with 204', () => {
          return request(app.getHttpServer())
            .delete(`/categories/${categoriesArray[0].id}`)
            .expect(200);
        });
      });

      describe('and the category with a given id does not exist', () => {
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer())
            .delete('/categories/3')
            .expect(404);
        });
      });
    });
  });
});
