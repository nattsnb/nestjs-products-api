import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import * as request from 'supertest';
import { Prisma } from '@prisma/client';

describe('The BooksController', () => {
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
        BooksService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              findUnique: findUniqueMock,
              findMany: findManyMock,
              create: createMock,
              update: updateMock,
              delete: deleteMock,
            },
          },
        },
      ],
      controllers: [BooksController],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  describe('GET /books', () => {
    it('should return all books', async () => {
      findManyMock.mockResolvedValue([{ id: 1, title: 'Test book' }]);
      return request(app.getHttpServer())
        .get('/books')
        .expect(200)
        .expect([{ id: 1, title: 'Test book' }]);
    });
  });
  describe('GET /books/:id', () => {
    it('should return a book if it exists', async () => {
      findUniqueMock.mockResolvedValue({ id: 1, title: 'Test book' });
      return request(app.getHttpServer())
        .get('/books/1')
        .expect(200)
        .expect({ id: 1, title: 'Test book' });
    });
    it('should return 404 if book does not exist', async () => {
      findUniqueMock.mockResolvedValue(null);
      return request(app.getHttpServer()).get('/books/999').expect(404);
    });
  });
  describe('PATCH /books/:id', () => {
    it('should update the book if it exists', async () => {
      updateMock.mockResolvedValue({ id: 1, title: 'Updated book' });
      return request(app.getHttpServer())
        .patch('/books/1')
        .send({ title: 'Updated book' })
        .expect(200)
        .expect({ id: 1, title: 'Updated book' });
    });
    it('should return 404 if book does not exist', async () => {
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
        .patch('/books/999')
        .send({ title: 'Updated book' })
        .expect(404);
    });
  });
  describe('DELETE /books/:id', () => {
    it('should delete the book if it exists', async () => {
      findUniqueMock.mockResolvedValue({ id: 1, title: 'Test book' });
      deleteMock.mockResolvedValue({ id: 1 });
      return request(app.getHttpServer()).delete('/books/1').expect(200);
    });
    it('should return 404 if book does not exist', async () => {
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
      return request(app.getHttpServer()).delete('/books/999').expect(404);
    });
  });
  describe('POST /books', () => {
    it('should create a book', async () => {
      createMock.mockResolvedValue({
        id: 1,
        title: 'New book',
        authors: [],
      });
      return request(app.getHttpServer())
        .post('/books')
        .send({ title: 'New book', authors: [] })
        .expect(201)
        .expect({
          id: 1,
          title: 'New book',
          authors: [],
        });
    });
  });
});
