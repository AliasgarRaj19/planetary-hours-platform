import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { BlogService } from './blog.service';
import { CreateBlogArticleDto } from './dto/create-blog-article.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogArticleDto } from './dto/update-blog-article.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';

@Controller('admin/blog')
@UseGuards(AdminJwtGuard)
export class AdminBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('articles')
  getAdminArticles() {
    return this.blogService.getAdminArticles();
  }

  @Post('articles')
  createArticle(@Body() dto: CreateBlogArticleDto) {
    return this.blogService.createArticle(dto);
  }

  @Get('articles/:id')
  getAdminArticleById(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.getAdminArticleById(id);
  }

  @Put('articles/:id')
  updateArticle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogArticleDto,
  ) {
    return this.blogService.updateArticle(id, dto);
  }

  @Post('articles/:id/publish')
  publishArticle(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.publishArticle(id);
  }

  @Post('articles/:id/unpublish')
  unpublishArticle(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.unpublishArticle(id);
  }

  @Get('categories')
  getAdminCategories() {
    return this.blogService.getAdminCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateBlogCategoryDto) {
    return this.blogService.createCategory(dto);
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogCategoryDto,
  ) {
    return this.blogService.updateCategory(id, dto);
  }
}
