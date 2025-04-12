import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import * as request from 'supertest';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { prismaRecordNotFoundError } from '../Utilities/prismaRecordNotFoundError';
import { Book } from '@prisma/client';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { BookDto } from './book.dto';

describe('The BooksController', () => {
  let app: INestApplication;
  let findUniqueMock: jest.Mock;
  let createMock: jest.Mock;
  let findManyMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;
  let booksArray: Book[];
  beforeEach(async () => {
    findUniqueMock = jest.fn();
    createMock = jest.fn();
    findManyMock = jest.fn();
    updateMock = jest.fn();
    deleteMock = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              findUnique: findUniqueMock,
              create: createMock,
              findMany: findManyMock,
              update: updateMock,
              delete: deleteMock,
            },
          },
        },
      ],
      controllers: [BooksController],
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
  describe('The CommentsController', () => {
    beforeEach(() => {
      booksArray = [
        {
          id: 1,
          title: 'Tittle one',
          priceInPLNgr: '2345',
        },
        {
          id: 2,
          title: 'Tittle two',
          priceInPLNgr: '2345',
        },
        {
          id: 3,
          title: 'Tittle three',
          priceInPLNgr: '2345',
        },
      ];
    });
    describe('when the GET /books/:id endpoint is called', () => {
      beforeEach(() => {
        findUniqueMock.mockImplementation((args: { where: { id: number } }) => {
          if (args.where.id === booksArray[0].id) {
            return Promise.resolve(booksArray[0]);
          }
          return Promise.resolve(undefined);
        });
      });
      describe('and the book with a given id exists', () => {
        it('should respond with the book', () => {
          return request(app.getHttpServer())
            .get(`/books/${booksArray[0].id}`)
            .expect(booksArray[0]);
        });
      });
      describe('and the book with a given id does not exist', () => {
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer()).get('/books/4').expect(404);
        });
      });
    });

    describe('and the POST /books endpoint is called', () => {
      describe('and the correct data is provided', () => {
        let newBookData: BookDto;
        beforeEach(() => {
          newBookData = {
            title: booksArray[0].title,
            priceInPLNgr: booksArray[0].priceInPLNgr,
            authorIds: [1],
          };
          createMock.mockResolvedValue(booksArray[0]);
        });
        it('should respond with the new book', () => {
          return request(app.getHttpServer())
            .post('/books')
            .send(newBookData)
            .expect(booksArray[0]);
        });
      });
      describe('and wrong data is provided', () => {
        it('should respond with the 400 status', () => {
          return request(app.getHttpServer())
            .post('/books')
            .send({})
            .expect(400);
        });
      });
    });

    describe('when the GET /books/ endpoint is called', () => {
      beforeEach(() => {
        findManyMock.mockImplementation(() => {
          return Promise.resolve(booksArray);
        });
      });

      it('should respond with the booksArray', () => {
        return request(app.getHttpServer()).get('/books').expect(booksArray);
      });

      describe('and the booksArray is empty', () => {
        beforeEach(() => {
          findManyMock.mockResolvedValue([]);
        });
        it('should respond with the empty array', () => {
          return request(app.getHttpServer()).get('/books').expect([]);
        });
      });
    });

    describe('and the UPDATE /books endpoint is called', () => {
      describe('and the correct data is provided', () => {
        let updateBookData: BookDto;
        let updatedBook: Book;
        beforeEach(() => {
          const updatedTitle = 'New title';
          updateBookData = {
            title: updatedTitle,
            priceInPLNgr: booksArray[0].priceInPLNgr,
            authorIds: [1],
          };
          updatedBook = {
            title: updatedTitle,
            priceInPLNgr: booksArray[0].priceInPLNgr,
            id: booksArray[0].id,
          };
          updateMock.mockImplementation((args: { where: { id: number } }) => {
            if (args.where.id === booksArray[0].id) {
              return Promise.resolve(updatedBook);
            }
          });
        });
        it('should respond with the updated book', () => {
          return request(app.getHttpServer())
            .patch(`/books/${booksArray[0].id}`)
            .send(updateBookData)
            .expect(updatedBook);
        });
      });
      describe('and the book with a given id does not exist', () => {
        beforeEach(() => {
          updateMock.mockImplementation((args: { where: { id: number } }) => {
            throw prismaRecordNotFoundError();
          });
        });
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer())
            .patch(`/books/4`)
            .send({})
            .expect(404);
        });
      });
    });

    describe('when the DELETE /books/:id endpoint is called', () => {
      beforeEach(() => {
        deleteMock.mockImplementation((args: { where: { id: number } }) => {
          if (args.where.id === booksArray[0].id) {
            return Promise.resolve();
          }
          throw prismaRecordNotFoundError();
        });
      });
      describe('and the book with a given id exists', () => {
        it('should respond with 204', () => {
          return request(app.getHttpServer())
            .delete(`/books/${booksArray[0].id}`)
            .expect(200);
        });
      });

      describe('and the book with a given id does not exist', () => {
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer()).delete('/books/3').expect(404);
        });
      });
    });
  });
});
