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
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from '@prisma/client';
import { CommentDto } from './comment.dto';

describe('The CommentsController', () => {
  let app: INestApplication;
  let findUniqueMock: jest.Mock;
  let createMock: jest.Mock;
  let findManyMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;
  let commentsArray: Comment[];
  beforeEach(async () => {
    findUniqueMock = jest.fn();
    createMock = jest.fn();
    findManyMock = jest.fn();
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
              create: createMock,
              findMany: findManyMock,
              update: updateMock,
              delete: deleteMock,
            },
          },
        },
      ],
      controllers: [CommentsController],
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
      commentsArray = [
        {
          id: 1,
          text: 'Comment one',
          userId: 1,
        },
        {
          id: 2,
          text: 'Comment two',
          userId: 1,
        },
        {
          id: 3,
          text: 'Comment three',
          userId: 2,
        },
      ];
    });
    describe('when the GET /comments/:id endpoint is called', () => {
      beforeEach(() => {
        findUniqueMock.mockImplementation((args: { where: { id: number } }) => {
          if (args.where.id === commentsArray[0].id) {
            return Promise.resolve(commentsArray[0]);
          }
          return Promise.resolve(undefined);
        });
      });
      describe('and the comment with a given id exists', () => {
        it('should respond with the comment', () => {
          return request(app.getHttpServer())
            .get(`/comments/${commentsArray[0].id}`)
            .expect(commentsArray[0]);
        });
      });
      describe('and the comment with a given id does not exist', () => {
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer()).get('/comments/4').expect(404);
        });
      });
    });

    describe('and the POST /comments endpoint is called', () => {
      describe('and the correct data is provided', () => {
        let newCommentData: CommentDto;
        beforeEach(() => {
          newCommentData = {
            text: commentsArray[0].text,
          };
          createMock.mockResolvedValue(commentsArray[0]);
        });
        it('should respond with the new category', () => {
          return request(app.getHttpServer())
            .post('/comments')
            .send(newCommentData)
            .expect(commentsArray[0]);
        });
      });
      describe('and wrong data is provided', () => {
        it('should respond with the 400 status', () => {
          return request(app.getHttpServer())
            .post('/comments')
            .send({})
            .expect(400);
        });
      });
    });

    describe('when the GET /comments/ endpoint is called', () => {
      beforeEach(() => {
        findManyMock.mockImplementation(() => {
          return Promise.resolve(commentsArray);
        });
      });

      it('should respond with the commentsArray', () => {
        return request(app.getHttpServer())
          .get('/comments')
          .expect(commentsArray);
      });

      describe('and the commentsArray is empty', () => {
        beforeEach(() => {
          findManyMock.mockResolvedValue([]);
        });
        it('should respond with the empty array', () => {
          return request(app.getHttpServer()).get('/comments').expect([]);
        });
      });
    });

    describe('and the UPDATE /comments endpoint is called', () => {
      describe('and the correct data is provided', () => {
        let updateCommentsData: CommentDto;
        let updatedComment: Comment;
        beforeEach(() => {
          const updatedName = 'New category';
          updateCommentsData = {
            text: updatedName,
          };
          updatedComment = {
            id: commentsArray[0].id,
            text: updatedName,
            userId: commentsArray[0].userId,
          };
          updateMock.mockImplementation((args: { where: { id: number } }) => {
            if (args.where.id === commentsArray[0].id) {
              return Promise.resolve(updatedComment);
            }
          });
        });
        it('should respond with the updated comment', () => {
          return request(app.getHttpServer())
            .patch(`/comments/${commentsArray[0].id}`)
            .send(updateCommentsData)
            .expect(updatedComment);
        });
      });
      describe('and the comments with a given id does not exist', () => {
        beforeEach(() => {
          updateMock.mockImplementation((args: { where: { id: number } }) => {
            throw prismaRecordNotFoundError();
          });
        });
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer())
            .patch(`/comments/4`)
            .send({})
            .expect(404);
        });
      });
    });

    describe('when the DELETE /comments/:id endpoint is called', () => {
      beforeEach(() => {
        deleteMock.mockImplementation((args: { where: { id: number } }) => {
          if (args.where.id === commentsArray[0].id) {
            return Promise.resolve();
          }
          throw prismaRecordNotFoundError();
        });
      });
      describe('and the category with a given id exists', () => {
        it('should respond with 204', () => {
          return request(app.getHttpServer())
            .delete(`/comments/${commentsArray[0].id}`)
            .expect(200);
        });
      });

      describe('and the category with a given id does not exist', () => {
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer()).delete('/comments/3').expect(404);
        });
      });
    });
  });
});
