import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategoryDto } from './update-category.dto';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../database/prisma-error.enum';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CategoriesServices {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  getAll() {
    return this.prismaService.category.findMany();
  }

  async getById(id: number) {
    const category = await this.prismaService.category.findUnique({
      where: {
        id,
      },
      include: {
        products: true,
      },
    });
    if (!category) {
      throw new NotFoundException();
    }
    return category;
  }

  create(category: CreateCategoryDto) {
    return this.prismaService.category.create({
      data: {
        name: category.name,
      },
    });
  }

  async updateCategory(id: number, category: UpdateCategoryDto) {
    try {
      return await this.prismaService.category.update({
        where: {
          id,
        },
        data: category,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new NotFoundException();
      }
      throw error;
    }
  }

  async deleteCategory(id: number) {
    try {
      return await this.prismaService.category.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PrismaError.RecordDoesNotExist
      ) {
        throw new NotFoundException();
      }
      throw error;
    }
  }

  async deleteCategoryWihProducts(categoryId: number) {
    return this.prismaService.$transaction(async (transactionClient) => {
      const category = await transactionClient.category.findUnique({
        where: {
          id: categoryId,
        },
        include: {
          products: true,
        },
      });
      if (!category) {
        throw new NotFoundException();
      }

      const productIds = category.products.map((product) => product.id);

      await transactionClient.product.deleteMany({
        where: {
          id: {
            in: productIds,
          },
        },
      });

      await transactionClient.category.delete({
        where: {
          id: categoryId,
        },
      });
    });
  }
}
