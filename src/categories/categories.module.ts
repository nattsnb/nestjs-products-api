import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CategoriesServices } from './categories.services';
import { CategoriesController } from './categories.controller';
import { ProductsService } from '../products/products.service';

@Module({
  imports: [DatabaseModule],
  providers: [CategoriesServices, ProductsService],
  controllers: [CategoriesController],
})
export class CategoriesModule {}
