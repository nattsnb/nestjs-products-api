import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';
import { ProductNotFoundException } from './product-not-found-exception';
import { ProductAlreadyExistsException } from './product-already-exists-exception';
import { PrismaError } from '../database/prisma-error.enum';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

describe('The ProductsService', () => {
  let productsService: ProductsService;
  let prismaServiceMock: {
    product: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  beforeEach(async () => {
    prismaServiceMock = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaServiceMock)),
    };
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();
    productsService = module.get(ProductsService);
  });
  describe('when getAllProducts is called', () => {
    it('should return a list of products', async () => {
      const products = [{ id: 1, name: 'Test Product' }];
      prismaServiceMock.product.findMany.mockResolvedValue(products);
      const result = await productsService.getAllProducts();
      expect(result).toEqual(products);
    });
  });
  describe('when getOne is called', () => {
    it('should return the product if found', async () => {
      const product = { id: 1, name: 'Test Product', user: {}, categories: [] };
      prismaServiceMock.product.findUnique.mockResolvedValue(product);
      const result = await productsService.getOne(1);
      expect(result).toEqual(product);
    });
    it('should throw ProductNotFoundException if not found', async () => {
      prismaServiceMock.product.findUnique.mockResolvedValue(null);
      await expect(productsService.getOne(1)).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });
  describe('when create is called', () => {
    it('should create a product', async () => {
      const productDto: CreateProductDto = {
        name: 'New Product',
        priceInPLNgr: '1000',
        isInStock: true,
        description: 'A test product',
        categoryIds: [1, 2],
      };
      const createdProduct = { id: 1, ...productDto };
      prismaServiceMock.product.create.mockResolvedValue(createdProduct);
      const result = await productsService.create(productDto, 1);
      expect(result).toEqual(createdProduct);
    });
    it('should throw ProductAlreadyExistsException if name already exists', async () => {
      prismaServiceMock.product.create.mockRejectedValue({
        code: PrismaError.UniqueConstraintViolated,
      });
      await expect(
        productsService.create({ name: 'Duplicate' } as CreateProductDto, 1),
      ).rejects.toThrow(ProductAlreadyExistsException);
    });
  });
  describe('when delete is called', () => {
    it('should delete a product', async () => {
      prismaServiceMock.product.delete.mockResolvedValue({ id: 1 });
      const result = await productsService.delete(1);
      expect(result).toEqual({ id: 1 });
    });
    it('should throw ProductNotFoundException if product does not exist', async () => {
      prismaServiceMock.product.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Record to delete does not exist.',
          {
            code: 'P2025',
            clientVersion: '6.4.1',
          },
        ),
      );
      await expect(productsService.delete(1)).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });
  describe('when update is called', () => {
    it('should update a product', async () => {
      const productDto: UpdateProductDto = { name: 'Updated Product' };
      const updatedProduct = { id: 1, ...productDto };
      prismaServiceMock.product.update.mockResolvedValue(updatedProduct);
      const result = await productsService.update(1, productDto);
      expect(result).toEqual(updatedProduct);
    });
    it('should throw ProductNotFoundException if product does not exist', async () => {
      prismaServiceMock.product.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Record to delete does not exist.',
          {
            code: 'P2025',
            clientVersion: '6.4.1',
          },
        ),
      );
      await expect(productsService.delete(1)).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });
  describe('when upvote is called', () => {
    it('should increment the upvotes', async () => {
      const updatedProduct = { id: 1, upvotes: 10 };
      prismaServiceMock.product.update.mockResolvedValue(updatedProduct);
      const result = await productsService.upvote(1);
      expect(result.upvotes).toBe(10);
    });
  });
  describe('when downvote is called', () => {
    it('should decrement the upvotes', async () => {
      const updatedProduct = { id: 1, upvotes: 8 };
      prismaServiceMock.product.update.mockResolvedValue(updatedProduct);
      const result = await productsService.downvote(1);
      expect(result.upvotes).toBe(8);
    });
  });
  describe('when deleteAllArticlesWithUpvoteLowerThan is called', () => {
    it('should delete products with upvotes lower than threshold', async () => {
      prismaServiceMock.product.deleteMany.mockResolvedValue({ count: 3 });
      const result =
        await productsService.deleteAllArticlesWithUpvoteLowerThan(5);
      expect(result).toBe('Deleted 3 products.');
    });
  });
});
