import { ConflictException } from '@nestjs/common';
import { ProductDto } from './product.dto';
import { Product } from './product';

export class ProductAlreadyExistsException extends ConflictException {
  constructor() {
    super(`Product with this name already exists.`);
  }
}
