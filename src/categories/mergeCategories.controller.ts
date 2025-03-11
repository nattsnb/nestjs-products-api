import { Controller, Patch } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('merge-categories')
export class MergeCategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Patch()
  mergeCategories() {
    return this.categoryService.mergeCategories();
  }
}
