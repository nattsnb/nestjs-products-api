import { ConflictException } from '@nestjs/common';

export class ProductAlreadyExistsException extends ConflictException {
  constructor() {
    super(`Product with this name already exists.`);
  }
}
