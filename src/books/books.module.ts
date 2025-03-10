import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [DatabaseModule],
  providers: [BooksService, PrismaService],
  controllers: [BooksController],
})
export class BooksModule {}
