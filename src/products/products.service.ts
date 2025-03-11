import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProductNotFoundException } from './product-not-found-exception';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../database/prisma-error.enum';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
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
      include: {
        user: true,
        categories: true,
      },
    });
    if (!product) {
      throw new ProductNotFoundException(id);
    }
    return product;
  }

  async create(product: CreateProductDto, userId: number) {
    const categories = product.categoryIds?.map((id) => ({ id }));
    try {
      return await this.prismaService.product.create({
        data: {
          name: product.name,
          priceInPLNgr: product.priceInPLNgr,
          isInStock: product.isInStock,
          description: product.description,
          upvotes: 0,
          user: {
            connect: {
              id: userId,
            },
          },
          categories: {
            connect: categories,
          },
        },
        include: {
          categories: true,
        },
      });
    } catch (error) {
      const prismaError = error as Prisma.PrismaClientKnownRequestError;
      if (prismaError.code === PrismaError.UniqueConstraintViolated) {
        throw new ProductAlreadyExistsException();
      }
      if (prismaError.code === PrismaError.RecordDoesNotExist) {
        throw new BadRequestException('Wrong category id provided.');
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
      return await this.prismaService.product.update({
        data: {
          ...product,
          id: undefined,
        },
        where: {
          id,
        },
      });
    } catch (error) {
      console.error('Prisma update error:', error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      throw error;
    }
  }

  async deleteMultiple(productsIds: number[]) {
    return this.prismaService.$transaction(async (transactionClient) => {
      const deleteResponse = await this.prismaService.product.deleteMany({
        where: {
          id: {
            in: productsIds,
          },
        },
      });
      if (deleteResponse.count !== productsIds.length) {
        throw new NotFoundException();
      }
    });
  }

  async upvote(id: number) {
    return this.prismaService.product.update({
      where: {
        id,
      },
      data: {
        upvotes: {
          increment: 1,
        },
      },
    });
  }

  async downvote(id: number) {
    return this.prismaService.product.update({
      where: {
        id,
      },
      data: {
        upvotes: {
          decrement: 1,
        },
      },
    });
  }

  async deleteAllArticlesWithUpvoteLowerThan(threshold: number) {
    const deleteResponse = await this.prismaService.product.deleteMany({
      where: {
        upvotes: {
          lt: threshold,
        },
      },
    });

    if (deleteResponse.count === 0) {
      throw new NotFoundException('Not product matches criteria.');
    }

    return `Deleted ${deleteResponse.count} products.`;
  }

  async changeOwnership(oldUserId: number, newUserId: number) {
    return this.prismaService.$transaction(async (transactionClient) => {
      const oldUser = await transactionClient.user.findUnique({
        where: {
          id: oldUserId,
        },
        include: {
          products: true,
        },
      });
      const newUser = await transactionClient.user.findUnique({
        where: {
          id: newUserId,
        },
      });

      if (!oldUser || !newUser) {
        throw new NotFoundException("At least one of the users doesn't exist.");
      }

      const productIds = oldUser.products.map((product) => product.id);

      await transactionClient.product.updateMany({
        where: {
          id: {
            in: productIds,
          },
        },
        data: {
          userId: newUserId,
        },
      });
    });
  }
}
