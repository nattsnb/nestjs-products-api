import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CategoriesServices } from './categories.services';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [DatabaseModule],
  providers: [CategoriesServices],
  controllers: [CategoriesController],
})
export class CategoriesModule {}
