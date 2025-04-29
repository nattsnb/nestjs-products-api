import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CommentDto } from './comment.dto';
import { UpdateCommentDto } from './update-comment.dto';
import { Prisma } from '@prisma/client';
import { PrismaError } from '../database/prisma-error.enum';

@Injectable()
export class CommentsService {
  constructor(private readonly prismaService: PrismaService) {}

  getAll() {
    return this.prismaService.comment.findMany();
  }

  async getById(id: number) {
    const comment = await this.prismaService.comment.findUnique({
      where: {
        id,
      },
    });
    if (!comment) {
      throw new NotFoundException();
    }
    return comment;
  }

  async updateComment(id: number, comment: UpdateCommentDto) {
    try {
      return await this.prismaService.comment.update({
        where: {
          id,
        },
        data: comment,
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

  async deleteComment(id: number) {
    try {
      return await this.prismaService.comment.delete({
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

  createComment(id: number, comment: CommentDto) {
    return this.prismaService.comment.create({
      data: {
        text: comment.text,
        user: {
          connect: {
            id,
          },
        },
      },
    });
  }
}
