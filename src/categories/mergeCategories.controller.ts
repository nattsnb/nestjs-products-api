import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesServices } from './categories.services';
import { CreateCategoryDto } from './create-category.dto';
import { UpdateCategoryDto } from './update-category.dto';

@Controller('merge-categories')
export class MergeCategoriesController {
  constructor(private readonly categoryService: CategoriesServices) {}

  @Patch()
  mergeCategories() {
    return this.categoryService.mergeCategories();
  }
}
