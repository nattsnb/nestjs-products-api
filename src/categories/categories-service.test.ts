import { Test } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../database/prisma.service';
import { ProductsService } from '../products/products.service';
import { NotFoundException } from '@nestjs/common';
import { PrismaError } from '../database/prisma-error.enum';
import { Prisma } from '@prisma/client';

describe('The CategoriesServices', () => {
  let categoriesService: CategoriesService;
  let prismaServiceMock: {
    category: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let productsServiceMock: Partial<ProductsService>;
  beforeEach(async () => {
    prismaServiceMock = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaServiceMock)),
    };
    productsServiceMock = {
      getAllProducts: jest.fn(),
      getOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: ProductsService, useValue: productsServiceMock },
      ],
    }).compile();
    categoriesService = module.get(CategoriesService);
  });
  describe('when getAll is called', () => {
    it('should return a list of categories', async () => {
      const categories = [{ id: 1, name: 'Test Category' }];
      prismaServiceMock.category.findMany.mockResolvedValue(categories);
      const result = await categoriesService.getAll();
      expect(result).toEqual(categories);
    });
  });
  describe('when getById is called', () => {
    it('should return a category if found', async () => {
      const category = { id: 1, name: 'Test Category', products: [] };
      prismaServiceMock.category.findUnique.mockResolvedValue(category);
      const result = await categoriesService.getById(1);
      expect(result).toEqual(category);
    });
    it('should throw NotFoundException if category is not found', async () => {
      prismaServiceMock.category.findUnique.mockResolvedValue(null);
      await expect(categoriesService.getById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('when create is called', () => {
    it('should create a category', async () => {
      const categoryDto = { name: 'New Category' };
      const createdCategory = { id: 1, ...categoryDto };
      prismaServiceMock.category.create.mockResolvedValue(createdCategory);
      const result = await categoriesService.create(categoryDto);
      expect(result).toEqual(createdCategory);
    });
  });
  describe('when updateCategory is called', () => {
    it('should update a category', async () => {
      const updatedCategory = { id: 1, name: 'Updated Category' };
      prismaServiceMock.category.update.mockResolvedValue(updatedCategory);
      const result = await categoriesService.updateCategory(1, {
        name: 'Updated Category',
      });
      expect(result).toEqual(updatedCategory);
    });
    it('should throw NotFoundException if category does not exist', async () => {
      prismaServiceMock.category.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record does not exist.', {
          code: PrismaError.RecordDoesNotExist,
          clientVersion: '6.4.1',
        }),
      );
      await expect(
        categoriesService.updateCategory(1, { name: 'Invalid' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
  describe('when deleteCategory is called', () => {
    it('should delete a category', async () => {
      prismaServiceMock.category.delete.mockResolvedValue({ id: 1 });
      const result = await categoriesService.deleteCategory(1);
      expect(result).toEqual({ id: 1 });
    });
    it('should throw NotFoundException if category does not exist', async () => {
      prismaServiceMock.category.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record does not exist.', {
          code: PrismaError.RecordDoesNotExist,
          clientVersion: '6.4.1',
        }),
      );
      await expect(categoriesService.deleteCategory(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
