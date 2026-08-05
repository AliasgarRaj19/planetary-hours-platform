import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogArticleQueryDto } from './dto/blog-query.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('articles')
  getPublishedArticles(@Query() query: BlogArticleQueryDto) {
    return this.blogService.getPublishedArticles(query);
  }

  @Get('articles/:slug')
  getPublishedArticleBySlug(@Param('slug') slug: string) {
    return this.blogService.getPublishedArticleBySlug(slug);
  }

  @Get('categories')
  getPublishedCategories() {
    return this.blogService.getPublishedCategories();
  }
}
