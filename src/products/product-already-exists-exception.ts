import {ConflictException} from "@nestjs/common";
import {ProductDto} from "./product.dto";

export class ProductAlreadyExistsException extends ConflictException {
  constructor(product: ProductDto) {
    super(`Product with ${product.name} already exists.`);
  }
}