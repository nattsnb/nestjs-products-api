import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { ProductsService } from '../products/products.service';
import { MergeCategoriesController } from './mergeCategories.controller';

@Module({
  imports: [DatabaseModule],
  providers: [CategoriesService, ProductsService],
  controllers: [CategoriesController, MergeCategoriesController],
})
export class CategoriesModule {}
