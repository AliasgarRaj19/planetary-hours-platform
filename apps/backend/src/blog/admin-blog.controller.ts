import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { getAuditContextFromRequest } from '../audit/types/audit-context';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import {
  BLOG_PUBLISHED_STATUS,
  BLOG_UNPUBLISHED_STATUS,
} from './blog.constants';
import { BlogService } from './blog.service';
import { CreateBlogArticleDto } from './dto/create-blog-article.dto';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogArticleDto } from './dto/update-blog-article.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';

@Controller('admin/blog')
@UseGuards(AdminJwtGuard)
export class AdminBlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly auditService: AuditService,
  ) {}

  @Get('articles')
  getAdminArticles() {
    return this.blogService.getAdminArticles();
  }

  @Post('articles')
  async createArticle(
    @Body() dto: CreateBlogArticleDto,
    @Req() request: Request,
  ) {
    const article = await this.blogService.createArticle(dto);

    await this.auditService.record({
      action: getArticleMutationAction('blog.article.create', article),
      module: 'blog',
      resourceType: 'blog_article',
      resourceId: article.id,
      resourceDisplayName: article.title,
      description: `Blog article "${article.title}" was created.`,
      context: getAuditContextFromRequest(request),
      metadata: {
        slug: article.slug,
        status: article.status,
        publishedAt: article.publishedAt,
        categoryIds: dto.categoryIds ?? [],
      },
    });

    return article;
  }

  @Get('articles/:id')
  getAdminArticleById(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.getAdminArticleById(id);
  }

  @Put('articles/:id')
  updateArticle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogArticleDto,
    @Req() request: Request,
  ) {
    return this.blogService.updateArticle(id, dto).then(async (article) => {
      await this.auditService.record({
        action: getArticleMutationAction('blog.article.update', article),
        module: 'blog',
        resourceType: 'blog_article',
        resourceId: article.id,
        resourceDisplayName: article.title,
        description: `Blog article "${article.title}" was updated.`,
        context: getAuditContextFromRequest(request),
        metadata: {
          slug: article.slug,
          changedFields: Object.keys(dto),
          status: article.status,
          publishedAt: article.publishedAt,
        },
      });

      return article;
    });
  }

  @Post('articles/:id/publish')
  async publishArticle(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    const article = await this.blogService.publishArticle(id);

    await this.auditService.record({
      action: 'blog.article.publish',
      module: 'blog',
      resourceType: 'blog_article',
      resourceId: article.id,
      resourceDisplayName: article.title,
      description: `Blog article "${article.title}" was published.`,
      context: getAuditContextFromRequest(request),
      metadata: {
        slug: article.slug,
        publishedAt: article.publishedAt,
      },
    });

    return article;
  }

  @Post('articles/:id/unpublish')
  async unpublishArticle(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request,
  ) {
    const article = await this.blogService.unpublishArticle(id);

    await this.auditService.record({
      action: 'blog.article.unpublish',
      module: 'blog',
      resourceType: 'blog_article',
      resourceId: article.id,
      resourceDisplayName: article.title,
      description: `Blog article "${article.title}" was unpublished.`,
      context: getAuditContextFromRequest(request),
      metadata: {
        slug: article.slug,
        status: article.status,
      },
    });

    return article;
  }

  @Get('categories')
  getAdminCategories() {
    return this.blogService.getAdminCategories();
  }

  @Post('categories')
  async createCategory(
    @Body() dto: CreateBlogCategoryDto,
    @Req() request: Request,
  ) {
    const category = await this.blogService.createCategory(dto);

    await this.auditService.record({
      action: 'blog.category.create',
      module: 'blog',
      resourceType: 'blog_category',
      resourceId: category.id,
      resourceDisplayName: category.name,
      description: `Blog category "${category.name}" was created.`,
      context: getAuditContextFromRequest(request),
      metadata: {
        slug: category.slug,
      },
    });

    return category;
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogCategoryDto,
    @Req() request: Request,
  ) {
    const category = await this.blogService.updateCategory(id, dto);

    await this.auditService.record({
      action: 'blog.category.update',
      module: 'blog',
      resourceType: 'blog_category',
      resourceId: category.id,
      resourceDisplayName: category.name,
      description: `Blog category "${category.name}" was updated.`,
      context: getAuditContextFromRequest(request),
      metadata: {
        slug: category.slug,
        changedFields: Object.keys(dto),
      },
    });

    return category;
  }
}

function getArticleMutationAction(
  fallbackAction: 'blog.article.create' | 'blog.article.update',
  article: { status: string; publishedAt: Date | string | null },
) {
  if (
    article.status === BLOG_PUBLISHED_STATUS &&
    article.publishedAt &&
    new Date(article.publishedAt).getTime() > Date.now()
  ) {
    return 'blog.article.schedule';
  }

  if (article.status === BLOG_UNPUBLISHED_STATUS) {
    return 'blog.article.unpublish';
  }

  return fallbackAction;
}
