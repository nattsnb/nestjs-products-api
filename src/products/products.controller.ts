import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { TransformPlainToInstance } from 'class-transformer';
import { ProductsListResponseDto } from './dto/products-list-response.dto';
import { ProductsDetailsResponseDto } from './dto/products-details-response.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @TransformPlainToInstance(ProductsListResponseDto)
  getAllProducts() {
    return this.productsService.getAllProducts();
  }

  @Get(':id')
  @TransformPlainToInstance(ProductsDetailsResponseDto)
  getOneProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getOne(id);
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  createProduct(@Body() product: CreateProductDto) {
    return this.productsService.create(product);
  }

  @Patch(':id')
  @UseGuards(JwtAuthenticationGuard)
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() product: UpdateProductDto,
  ) {
    return this.productsService.update(id, product);
  }

  @Delete(':id')
  @UseGuards(JwtAuthenticationGuard)
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.delete(id);
  }
}
