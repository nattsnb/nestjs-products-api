import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProfileImagesService } from './profileImages.service';
import { ProfileImagesController } from './profileImages.controller';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [DatabaseModule],
  providers: [ProfileImagesService, UsersService, PrismaService],
  controllers: [ProfileImagesController],
})
export class ProfileImagesModule {}
