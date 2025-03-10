import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';
import { TransformPlainToInstance } from 'class-transformer';
import { ProductsListResponseDto } from './dto/products-list-response.dto';
import { ProductsDetailsResponseDto } from './dto/products-details-response.dto';
import { RequestWithUser } from '../authentication/request-with-user';

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
  createProduct(
    @Body() product: CreateProductDto,
    @Req() request: RequestWithUser,
  ) {
    return this.productsService.create(product, request.user.id);
  }

  @Patch('changeOwnership/:oldUserId/:newUserId')
  changeOwnership(
    @Param('oldUserId', ParseIntPipe) oldUserId: number,
    @Param('newUserId', ParseIntPipe) newUserId: number,
  ) {
    return this.productsService.changeOwnership(oldUserId, newUserId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthenticationGuard)
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() product: UpdateProductDto,
  ) {
    return this.productsService.update(id, product);
  }
  @Patch(':id/downvote')
  downProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.downvote(id);
  }

  @Patch(':id/upvote')
  upvoteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.upvote(id);
  }

  @Delete('filter')
  @UseGuards(JwtAuthenticationGuard)
  deleteFilteredProducts(
    @Query('upvotesFewerThan', ParseIntPipe) upvotesFewerThan: number,
  ) {
    return this.productsService.deleteAllArticlesWithUpvoteLowerThan(
      upvotesFewerThan,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthenticationGuard)
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.delete(id);
  }
}
