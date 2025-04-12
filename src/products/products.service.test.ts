import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { ProductsService } from './products.service';
import { Prisma, Product } from '@prisma/client';
import { ProductNotFoundException } from './product-not-found-exception';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductAlreadyExistsException } from './product-already-exists-exception';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaError } from '../database/prisma-error.enum';
import { UpdateProductDto } from './dto/update-product.dto';

describe('The ProductsService', () => {
  let productsService: ProductsService;
  let findUniqueMock: jest.Mock;
  let findManyMock: jest.Mock;
  let deleteMock: jest.Mock;
  let updateMock: jest.Mock;
  let createMock: jest.Mock;
  let deleteManyMock: jest.Mock;
  let productsArray: Product[];
  beforeEach(async () => {
    findUniqueMock = jest.fn();
    createMock = jest.fn();
    findManyMock = jest.fn();
    deleteMock = jest.fn();
    updateMock = jest.fn();
    createMock = jest.fn();
    deleteManyMock = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findUnique: findUniqueMock,
              findMany: findManyMock,
              delete: deleteMock,
              update: updateMock,
              create: createMock,
              deleteMany: deleteManyMock,
            },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();
    productsService = await module.get(ProductsService);

    productsArray = [
      {
        id: 1,
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with USB receiver.',
        priceInPLNgr: '4999',
        isInStock: true,
        userId: 101,
        upvotes: 5,
      },
      {
        id: 2,
        name: 'Gaming Keyboard',
        description: 'Mechanical keyboard with RGB lighting.',
        priceInPLNgr: '8999',
        isInStock: true,
        userId: 102,
        upvotes: 12,
      },
      {
        id: 3,
        name: 'Noise Cancelling Headphones',
        description: 'Wireless headphones with active noise cancellation.',
        priceInPLNgr: '19999',
        isInStock: true,
        userId: 103,
        upvotes: 30,
      },
    ];
  });

  describe('when the getOne function is called', () => {
    describe('and the findUnique method returns the product', () => {
      beforeEach(() => {
        findUniqueMock.mockResolvedValue(productsArray[0]);
      });
      it('should return the product', async () => {
        const result = await productsService.getOne(productsArray[0].id);
        expect(result).toBe(productsArray[0]);
      });
    });
    describe('and the findUnique method does not return the product', () => {
      beforeEach(() => {
        findUniqueMock.mockResolvedValue(undefined);
      });
      it('should throw the error with correct message', async () => {
        return expect(async () => {
          await productsService.getOne(productsArray[0].id);
        }).rejects.toThrow(ProductNotFoundException);
      });
    });
  });

  describe('when the create function is called', () => {
    let createDetails: CreateProductDto;
    beforeEach(() => {
      createMock.mockResolvedValue(productsArray[0]);
      createDetails = {
        name: productsArray[0].name,
        priceInPLNgr: productsArray[0].priceInPLNgr,
        isInStock: productsArray[0].isInStock,
        description: productsArray[0].description,
        categoryIds: [],
      };
    });
    describe('and the create method returns the product', () => {
      it('should return the product', async () => {
        const result = await productsService.create(
          createDetails,
          productsArray[0].userId,
        );
        expect(result).toBe(productsArray[0]);
      });
    });
    describe('and the create method does not return the product', () => {
      describe('and the prisma throws UniqueConstraintViolated', () => {
        beforeEach(() => {
          createMock.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError(
              'Unique constraint failed',
              {
                code: PrismaError.UniqueConstraintViolated,
                clientVersion: 'prisma-client',
              },
            ),
          );
        });
        it('should throw ProductAlreadyExistsException', async () => {
          return expect(async () => {
            await productsService.create(
              createDetails,
              productsArray[0].userId,
            );
          }).rejects.toThrow(ProductAlreadyExistsException);
        });
      });
      describe('and the prisma throws RecordDoesNotExist', () => {
        beforeEach(() => {
          createMock.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError('Record does not exist', {
              code: PrismaError.RecordDoesNotExist,
              clientVersion: 'prisma-client',
            }),
          );
        });
        it('should throw BadRequestException', async () => {
          return expect(async () => {
            await productsService.create(
              createDetails,
              productsArray[0].userId,
            );
          }).rejects.toThrow(BadRequestException);
        });
      });
    });
  });

  describe('when the delete function is called', () => {
    describe('and product with given id exists', () => {
      beforeEach(() => {
        deleteMock.mockResolvedValue(productsArray[0]);
      });
      it('should delete the product', async () => {
        const result = await productsService.delete(productsArray[0].id);
        expect(result).toBe(productsArray[0]);
      });
    });
    describe('and product with given id does not exist', () => {
      beforeEach(() => {
        deleteMock.mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Record does not exist', {
            code: PrismaError.RecordDoesNotExist,
            clientVersion: 'prisma-client',
          }),
        );
      });
      it('should throw ProductNotFoundException error.', async () => {
        return expect(async () => {
          await productsService.delete(productsArray[0].id);
        }).rejects.toThrow(ProductNotFoundException);
      });
    });
  });

  describe('when the update function is called', () => {
    let updateDetails: UpdateProductDto;
    const newName = 'New Product Name';
    beforeEach(() => {
      updateDetails = {
        name: newName,
        priceInPLNgr: productsArray[0].priceInPLNgr,
        isInStock: productsArray[0].isInStock,
      };
    });
    describe('and product with given id exists', () => {
      let updateResult: Product;
      beforeEach(() => {
        updateResult = {
          id: productsArray[0].id,
          name: newName,
          description: productsArray[0].description,
          priceInPLNgr: productsArray[0].priceInPLNgr,
          isInStock: productsArray[0].isInStock,
          userId: productsArray[0].userId,
          upvotes: productsArray[0].upvotes,
        };
        updateMock.mockResolvedValue(updateResult);
      });
      it('should return the product', async () => {
        const result = await productsService.update(
          productsArray[0].id,
          updateDetails,
        );
        expect(result).toBe(updateResult);
      });
    });
    describe('and product with given id does not exist', () => {
      beforeEach(() => {
        updateMock.mockImplementation(() => {
          throw new Prisma.PrismaClientKnownRequestError(
            'Record does not exist',
            {
              code: PrismaError.RecordDoesNotExist,
              clientVersion: 'prisma-client',
            },
          );
        });
      });
      it('should throw ProductNotFoundException error.', async () => {
        return expect(async () => {
          await productsService.update(productsArray[0].id, updateDetails);
        }).rejects.toThrow(ProductNotFoundException);
      });
    });
    describe('and the prisma throws UniqueConstraintViolated', () => {
      beforeEach(() => {
        updateMock.mockImplementation(() => {
          throw new Prisma.PrismaClientKnownRequestError(
            'Unique constraint failed',
            {
              // ✅
              code: PrismaError.UniqueConstraintViolated, // ✅
              clientVersion: 'prisma-client',
            },
          );
        });
      });
      it('should throw ProductAlreadyExistsException', async () => {
        return expect(async () => {
          await productsService.update(productsArray[0].id, updateDetails);
        }).rejects.toThrow(ProductAlreadyExistsException);
      });
    });
  });

  describe('when the deleteMultiple function is called', () => {
    describe('and all products exist', () => {
      beforeEach(() => {
        (
          productsService['prismaService'].$transaction as jest.Mock
        ).mockImplementation(async (cb) => {
          return cb({
            product: {
              deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          });
        });
      });
      it('should complete successfully when all products are deleted', async () => {
        await expect(
          productsService.deleteMultiple([1, 2]),
        ).resolves.not.toThrow();
      });
    });
    describe('and not all products exist', () => {
      beforeEach(() => {
        (
          productsService['prismaService'].$transaction as jest.Mock
        ).mockImplementation(async (cb) => {
          return cb({
            product: {
              deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          });
        });
      });
      it('should throw NotFoundException', async () => {
        await expect(productsService.deleteMultiple([1, 2])).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('when the upvote function is called', () => {
    let upvoteResult: Product;
    beforeEach(() => {
      upvoteResult = {
        id: productsArray[0].id,
        name: productsArray[0].name,
        description: productsArray[0].description,
        priceInPLNgr: productsArray[0].priceInPLNgr,
        isInStock: productsArray[0].isInStock,
        userId: productsArray[0].userId,
        upvotes: productsArray[0].upvotes + 1,
      };
      updateMock.mockResolvedValue(upvoteResult);
    });
    it('should return product with incremented upvote', async () => {
      const result = await productsService.upvote(productsArray[0].id);
      expect(result).toBe(upvoteResult);
    });
  });

  describe('when the downvote function is called', () => {
    let downvoteResult: Product;
    beforeEach(() => {
      downvoteResult = {
        id: productsArray[0].id,
        name: productsArray[0].name,
        description: productsArray[0].description,
        priceInPLNgr: productsArray[0].priceInPLNgr,
        isInStock: productsArray[0].isInStock,
        userId: productsArray[0].userId,
        upvotes: productsArray[0].upvotes - 1,
      };
      updateMock.mockResolvedValue(downvoteResult);
    });
    it('should return product with decremented upvote', async () => {
      const result = await productsService.upvote(productsArray[0].id);
      expect(result).toBe(downvoteResult);
    });
  });

  describe('when the deleteAllArticlesWithUpvoteLowerThan function is called', () => {
    describe('and at least one product is deleted', () => {
      beforeEach(() => {
        deleteManyMock.mockResolvedValue({ count: 2 });
      });
      it('should return a success message', async () => {
        const result =
          await productsService.deleteAllArticlesWithUpvoteLowerThan(10);
        expect(result).toBe('Deleted 2 products.');
      });
    });

    describe('and no products are deleted', () => {
      beforeEach(() => {
        deleteManyMock.mockResolvedValue({ count: 0 });
      });
      it('should throw NotFoundException', async () => {
        await expect(
          productsService.deleteAllArticlesWithUpvoteLowerThan(10),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('when the changeOwnership function is called', () => {
    beforeEach(() => {
      (
        productsService['prismaService'].$transaction as jest.Mock
      ).mockImplementation(async (cb) => {
        const transactionClient = {
          user: {
            findUnique: jest
              .fn()
              .mockImplementationOnce(async () => ({
                id: 1,
                products: [{ id: 10 }, { id: 20 }],
              }))
              .mockImplementationOnce(async () => ({
                id: 2,
              })),
          },
          product: {
            updateMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return cb(transactionClient);
      });
    });
    it('should complete successfully when all products are deleted', async () => {
      await expect(
        productsService.changeOwnership(
          productsArray[0].userId,
          productsArray[1].userId,
        ),
      ).resolves.not.toThrow();
    });
  });
});
