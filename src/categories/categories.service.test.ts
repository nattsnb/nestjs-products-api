import { Test } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { CategoriesService } from './categories.service';
import { Category, Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CreateCategoryDto } from './create-category.dto';
import { PrismaError } from '../database/prisma-error.enum';

describe('The ProductsService', () => {
  let categoriesService: CategoriesService;
  let findUniqueMock: jest.Mock;
  let findManyMock: jest.Mock;
  let deleteMock: jest.Mock;
  let updateMock: jest.Mock;
  let createMock: jest.Mock;
  let deleteManyMock: jest.Mock;
  let categoriesArray: Category[];
  let categoriesWithProductsArray: {
    id: number;
    name: string;
    products: { id: number; name: string }[];
  }[];
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
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
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
        {
          provide: ProductsService,
          useValue: {},
        },
      ],
    }).compile();
    categoriesService = await module.get(CategoriesService);

    categoriesArray = [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Home & Garden' },
      { id: 3, name: 'Clothing' },
    ];

    categoriesWithProductsArray = [
      {
        id: 1,
        name: 'Electronics',
        products: [
          { id: 101, name: 'Laptop' },
          { id: 102, name: 'Smartphone' },
        ],
      },
      {
        id: 2,
        name: 'Home & Garden',
        products: [
          { id: 201, name: 'Vacuum Cleaner' },
          { id: 202, name: 'Garden Chair' },
        ],
      },
      {
        id: 3,
        name: 'Clothing',
        products: [
          { id: 301, name: 'T-shirt' },
          { id: 302, name: 'Jeans' },
        ],
      },
    ];
  });

  describe('when the getById function is called', () => {
    describe('and the findUnique method returns the category', () => {
      beforeEach(() => {
        findUniqueMock.mockResolvedValue(categoriesArray[0]);
      });
      it('should return the category', async () => {
        const result = await categoriesService.getById(categoriesArray[0].id);
        expect(result).toBe(categoriesArray[0]);
      });
    });
    describe('and the findUnique method does not return the product', () => {
      beforeEach(() => {
        findUniqueMock.mockResolvedValue(undefined);
      });
      it('should throw NotFoundException', async () => {
        return expect(async () => {
          await categoriesService.getById(categoriesArray[0].id);
        }).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('when the getAll function is called', () => {
    describe('and the findMany method returns categories', () => {
      beforeEach(() => {
        findManyMock.mockResolvedValue(categoriesArray);
      });
      it('should return all categories', async () => {
        const result = await categoriesService.getAll();
        expect(result).toBe(categoriesArray);
      });
    });
    describe('and the findMany method returns empty array', () => {
      beforeEach(() => {
        findManyMock.mockResolvedValue([]);
      });
      it('should return empty array', async () => {
        const result = await categoriesService.getAll();
        expect(result).toEqual([]);
      });
    });
    describe('and the findMany method throws an error', () => {
      beforeEach(() => {
        findManyMock.mockRejectedValue(new Error('Database error'));
      });
      it('should throw an error', async () => {
        await expect(categoriesService.getAll()).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('when the create function is called', () => {
    let createDetails: CreateCategoryDto;
    beforeEach(() => {
      createMock.mockResolvedValue(categoriesArray[0]);
      createDetails = {
        name: categoriesArray[0].name,
      };
    });
    describe('and the create method returns the category', () => {
      it('should return the category', async () => {
        const result = await categoriesService.create(createDetails);
        expect(result).toBe(categoriesArray[0]);
      });
    });
  });

  describe('when the deleteCategory function is called', () => {
    describe('and product with given id exists', () => {
      beforeEach(() => {
        deleteMock.mockResolvedValue(categoriesArray[0]);
      });
      it('should delete the product', async () => {
        const result = await categoriesService.deleteCategory(
          categoriesArray[0].id,
        );
        expect(result).toBe(categoriesArray[0]);
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
          await categoriesService.deleteCategory(categoriesArray[0].id);
        }).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('when the updateCategory function is called', () => {
    let updateDetails: CreateCategoryDto;
    const newName = 'New Category Name';
    beforeEach(() => {
      updateDetails = {
        name: newName,
      };
    });
    describe('and category with given id exists', () => {
      let updateResult: Category;
      beforeEach(() => {
        updateResult = {
          id: categoriesArray[0].id,
          name: newName,
        };
        updateMock.mockResolvedValue(updateResult);
      });
      it('should return updated category', async () => {
        const result = await categoriesService.updateCategory(
          categoriesArray[0].id,
          updateDetails,
        );
        expect(result).toBe(updateResult);
      });
    });
    describe('and category with given id does not exist', () => {
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
          await categoriesService.updateCategory(
            categoriesArray[0].id,
            updateDetails,
          );
        }).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('when the deleteCategoryWihProducts function is called', () => {
    describe('and category exists', () => {
      beforeEach(() => {
        (
          categoriesService['prismaService'].$transaction as jest.Mock
        ).mockImplementation(async (cb) => {
          return cb({
            category: {
              findUnique: jest
                .fn()
                .mockResolvedValue(categoriesWithProductsArray[0]),
              delete: jest.fn().mockResolvedValue({}),
            },
            product: {
              deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          });
        });
      });
      it('should complete successfully when category and all products are deleted', async () => {
        await expect(
          categoriesService.deleteCategoryWithProducts(
            categoriesWithProductsArray[0].id,
          ),
        ).resolves.not.toThrow();
      });
    });
    describe('and category does not exist', () => {
      beforeEach(() => {
        (
          categoriesService['prismaService'].$transaction as jest.Mock
        ).mockImplementation(async (cb) => {
          return cb({
            category: {
              findUnique: jest.fn().mockResolvedValue(undefined),
              delete: jest.fn().mockResolvedValue({}),
            },
            product: {
              deleteMany: jest.fn(),
            },
          });
        });
      });
      it('should throw NotFoundException', async () => {
        await expect(
          categoriesService.deleteCategoryWithProducts(
            categoriesWithProductsArray[0].id,
          ),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
