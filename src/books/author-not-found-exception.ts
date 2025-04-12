import { NotFoundException } from '@nestjs/common';

export class AuthorNotFoundException extends NotFoundException {
  constructor() {
    super("Author with provided id doesn't exist.");
  }
}
