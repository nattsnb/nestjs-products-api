import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { UpdateCommentDto } from './update-comment.dto';
import { RequestWithUser } from '../authentication/request-with-user';
import { CommentDto } from './comment.dto';
import { JwtAuthenticationGuard } from '../authentication/jwt-authentication.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  getAll() {
    return this.commentsService.getAll();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() comment: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(id, comment);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.deleteComment(id);
  }

  @Post()
  @UseGuards(JwtAuthenticationGuard)
  createComment(@Req() req: RequestWithUser, @Body() comment: CommentDto) {
    return this.commentsService.createComment(req.user.id, comment);
  }
}
