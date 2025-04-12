import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BookDto } from './book.dto';
import { UpdateBookDto } from './update-book.dto';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../database/prisma-error.enum';

@Injectable()
export class BooksService {
  constructor(private readonly prismaService: PrismaService) {}

  getAll() {
    return this.prismaService.book.findMany();
  }

  async getById(id: number) {
    const book = await this.prismaService.book.findUnique({
      where: {
        id,
      },
      include: {
        authors: true,
      },
    });
    if (!book) {
      throw new NotFoundException();
    }
    return book;
  }

  async updateBook(id: number, book: UpdateBookDto) {
    try {
      return await this.prismaService.book.update({
        where: {
          id,
        },
        data: book,
        include: {
          authors: true,
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

  async deleteBook(id: number) {
    try {
      return await this.prismaService.book.delete({
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

  async createBook(book: BookDto) {
    const authors = book.authorIds.map((id) => ({ id }));
    try {
      return await this.prismaService.book.create({
        data: {
          title: book.title,
          priceInPLNgr: book.priceInPLNgr,
          authors: {
            connect: authors,
          },
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
}
