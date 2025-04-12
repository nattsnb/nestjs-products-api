import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../database/prisma.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  providers: [ProductsService, PrismaService],
  controllers: [ProductsController],
  imports: [DatabaseModule],
  exports: [ProductsService],
})
export class ProductsModule {}
