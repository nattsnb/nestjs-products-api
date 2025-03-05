import {Module} from "@nestjs/common";
import {ProductsService} from "./products.service";
import {ProductsController} from "./products.controller";

@Module({
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsModule],
})
export class ProductsModule {
}