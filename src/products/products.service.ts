import {Injectable} from "@nestjs/common";

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: ProductsService) {}

  
}