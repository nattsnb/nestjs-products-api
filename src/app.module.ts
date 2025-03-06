import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ProductsModule } from './products/products.module';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
  imports: [
    ProductsModule,
    AuthenticationModule,
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}
