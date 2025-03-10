import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [DatabaseModule],
  providers: [CommentsService, PrismaService],
  controllers: [CommentsController],
})
export class CommentsModule {}
