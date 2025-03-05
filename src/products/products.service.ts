import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProductNotFoundException } from './product-not-found-exception';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../database/prisma-error.enum';
import { UpdateProductDto } from './update-product.dto';
import { CreateProductDto } from './create-product.dto';
import { ProductAlreadyExistsException } from './product-already-exists-exception';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  getAllProducts() {
    return this.prismaService.product.findMany();
  }

  async getOne(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id,
      },
    });
    if (!product) {
      throw new ProductNotFoundException(id);
    }
    return product;
  }

  async create(product: CreateProductDto) {
    try {
      return await this.prismaService.product.create({
        data: product,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.UniqueConstraintViolated
      ) {
        throw new ProductAlreadyExistsException();
      }
      throw error;
    }
  }

  async delete(id: number) {
    try {
      return await this.prismaService.product.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new ProductNotFoundException(id);
      }
      throw error;
    }
  }

  async update(id: number, product: UpdateProductDto) {
    try {
      return this.prismaService.product.update({
        data: {
          ...product,
          id: undefined,
        },
        where: {
          id,
        },
      });
    } catch (error) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === PrismaError.RecordDoesNotExist) {
        throw new ProductNotFoundException(id);
      }
      if (prismaError.code === PrismaError.UniqueConstraintViolated) {
        throw new ProductAlreadyExistsException();
      }
      throw error;
    }
  }
}
