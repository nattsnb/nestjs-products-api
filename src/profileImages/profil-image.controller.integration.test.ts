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
import { ProfileImage } from '@prisma/client';
import { ProfileImagesService } from './profileImages.service';
import { ProfileImagesController } from './profileImages.controller';
import { ProfileImageDto } from './profile-image.dto';
import { UsersService } from '../users/users.service';
import { Request, Response, NextFunction } from 'express';

describe('The ProfileImageController', () => {
  let app: INestApplication;
  let findUniqueMock: jest.Mock;
  let createMock: jest.Mock;
  let findManyMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;
  let profileImageArray: ProfileImage[];
  beforeEach(async () => {
    findUniqueMock = jest.fn();
    createMock = jest.fn();
    findManyMock = jest.fn();
    updateMock = jest.fn();
    deleteMock = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        ProfileImagesService,
        {
          provide: UsersService,
          useValue: {
            getById: jest
              .fn()
              .mockResolvedValue({
                id: 1,
                name: 'John Smith',
                profileImageId: null,
              }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            profileImage: {
              findUnique: findUniqueMock,
              create: createMock,
              findMany: findManyMock,
              update: updateMock,
              delete: deleteMock,
            },
          },
        },
      ],
      controllers: [ProfileImagesController],
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
    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = { id: 1, name: 'John Smith' };
      next();
    });
    await app.init();
  });
  describe('The ProfileImageController', () => {
    beforeEach(() => {
      profileImageArray = [
        {
          id: 1,
          url: 'www.lalala.pl',
        },
        {
          id: 2,
          url: 'www.lalala.pl',
        },
        {
          id: 3,
          url: 'www.lalala.pl',
        },
      ];
    });
    describe('when the GET /profileImages/:id endpoint is called', () => {
      beforeEach(() => {
        findUniqueMock.mockImplementation((args: { where: { id: number } }) => {
          if (args.where.id === profileImageArray[0].id) {
            return Promise.resolve(profileImageArray[0]);
          }
          return Promise.resolve(undefined);
        });
      });
      describe('and the profileImage with a given id exists', () => {
        it('should respond with the profileImage', () => {
          return request(app.getHttpServer())
            .get(`/profileImages/${profileImageArray[0].id}`)
            .expect(profileImageArray[0]);
        });
      });
      describe('and the profileImage with a given id does not exist', () => {
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer())
            .get('/profileImages/4')
            .expect(404);
        });
      });
    });

    describe('and the POST /profileImages endpoint is called', () => {
      describe('and the correct data is provided', () => {
        let newProfileImagesData: ProfileImageDto;
        beforeEach(() => {
          newProfileImagesData = {
            url: profileImageArray[0].url,
          };
          createMock.mockResolvedValue(profileImageArray[0]);
        });
        it('should respond with the new profileImage', () => {
          return request(app.getHttpServer())
            .post('/profileImages')
            .send(newProfileImagesData)
            .expect(profileImageArray[0]);
        });
      });
      describe('and wrong data is provided', () => {
        it('should respond with the 400 status', () => {
          return request(app.getHttpServer())
            .post('/profileImages')
            .send({})
            .expect(400);
        });
      });
    });

    describe('when the GET /profileImages/ endpoint is called', () => {
      beforeEach(() => {
        findManyMock.mockImplementation(() => {
          return Promise.resolve(profileImageArray);
        });
      });

      it('should respond with the profileImagesArray', () => {
        return request(app.getHttpServer())
          .get('/profileImages')
          .expect(profileImageArray);
      });

      describe('and the profileImagesArray is empty', () => {
        beforeEach(() => {
          findManyMock.mockResolvedValue([]);
        });
        it('should respond with the empty array', () => {
          return request(app.getHttpServer()).get('/profileImages').expect([]);
        });
      });
    });

    describe('and the UPDATE /profileImages endpoint is called', () => {
      describe('and the correct data is provided', () => {
        let updateProfileImageData: ProfileImageDto;
        let updatedProfileImage: ProfileImage;
        beforeEach(() => {
          const updatedTitle = 'New title';
          updateProfileImageData = {
            url: updatedTitle,
          };
          updatedProfileImage = {
            url: updatedTitle,
            id: 1,
          };
          updateMock.mockImplementation((args: { where: { id: number } }) => {
            if (args.where.id === profileImageArray[0].id) {
              return Promise.resolve(updatedProfileImage);
            }
          });
        });
        it('should respond with the updated profileImage', () => {
          return request(app.getHttpServer())
            .patch(`/profileImages/${profileImageArray[0].id}`)
            .send(updateProfileImageData)
            .expect(updatedProfileImage);
        });
      });
      describe('and the profileImage with a given id does not exist', () => {
        beforeEach(() => {
          updateMock.mockImplementation((args: { where: { id: number } }) => {
            throw prismaRecordNotFoundError();
          });
        });
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer())
            .patch(`/profileImages/4`)
            .send({})
            .expect(404);
        });
      });
    });

    describe('when the DELETE /profileImages/:id endpoint is called', () => {
      beforeEach(() => {
        deleteMock.mockImplementation((args: { where: { id: number } }) => {
          if (args.where.id === profileImageArray[0].id) {
            return Promise.resolve();
          }
          throw prismaRecordNotFoundError();
        });
      });
      describe('and the profileImage with a given id exists', () => {
        it('should respond with 204', () => {
          return request(app.getHttpServer())
            .delete(`/profileImages/${profileImageArray[0].id}`)
            .expect(200);
        });
      });

      describe('and the profileImage with a given id does not exist', () => {
        it('should respond with the 404 status', () => {
          return request(app.getHttpServer())
            .delete('/profileImages/3')
            .expect(404);
        });
      });
    });
  });
});
