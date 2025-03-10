import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ProductsModule } from './products/products.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { CategoriesModule } from './categories/categories.module';
import { ProfileImagesModule } from './profileImages/profileImages.module';
import { CommentsModule } from './comments/comments.module';
import { BooksModule } from './books/books.module';

@Module({
  imports: [
    ProductsModule,
    AuthenticationModule,
    CategoriesModule,
    ProfileImagesModule,
    CommentsModule,
    BooksModule,
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
