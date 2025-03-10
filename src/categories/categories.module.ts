import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CategoriesServices } from './categories.services';
import { CategoriesController } from './categories.controller';
import { ProductsService } from '../products/products.service';
import { MergeCategoriesController } from './mergeCategories.controller';

@Module({
  imports: [DatabaseModule],
  providers: [CategoriesServices, ProductsService],
  controllers: [CategoriesController, MergeCategoriesController],
})
export class CategoriesModule {}
