import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  BLOG_DRAFT_STATUS,
  BLOG_PUBLISHED_STATUS,
  BLOG_UNPUBLISHED_STATUS,
  DEFAULT_BLOG_PAGE_SIZE,
  MAX_BLOG_PAGE_SIZE,
} from './blog.constants';
import { BlogRepository } from './blog.repository';
import type { BlogArticleQueryDto } from './dto/blog-query.dto';
import type { CreateBlogArticleDto } from './dto/create-blog-article.dto';
import type { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import type { UpdateBlogArticleDto } from './dto/update-blog-article.dto';
import type { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';

@Injectable()
export class BlogService {
  constructor(private readonly repository: BlogRepository) {}

  async getPublishedArticles(query: BlogArticleQueryDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(
      query.pageSize ?? DEFAULT_BLOG_PAGE_SIZE,
      MAX_BLOG_PAGE_SIZE,
    );
    const now = new Date();
    const [items, total] = await Promise.all([
      this.repository.findPublishedArticles({
        now,
        skip: (page - 1) * pageSize,
        take: pageSize,
        category: query.category,
      }),
      this.repository.countPublishedArticles({
        now,
        category: query.category,
      }),
    ]);

    return {
      items: items.map(toArticleResponse),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getPublishedArticleBySlug(slug: string) {
    const article = await this.repository.findPublishedArticleBySlug(
      slug,
      new Date(),
    );

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return toArticleResponse(article);
  }

  async getPublishedCategories() {
    const categories = await this.repository.findPublishedCategories(
      new Date(),
    );
    return categories.map(toCategoryResponse);
  }

  async getAdminArticles() {
    const articles = await this.repository.findAllAdminArticles();
    return articles.map(toArticleResponse);
  }

  async getAdminArticleById(id: number) {
    const article = await this.repository.findAdminArticleById(id);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return toArticleResponse(article);
  }

  async createArticle(dto: CreateBlogArticleDto) {
    await this.assertCategoriesExist(dto.categoryIds ?? []);

    try {
      const article = await this.repository.createArticle({
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        bodyMarkdown: dto.bodyMarkdown,
        status: dto.status ?? BLOG_DRAFT_STATUS,
        seoTitle: normalizeNullableString(dto.seoTitle),
        seoDescription: normalizeNullableString(dto.seoDescription),
        publishedAt: parseNullableDate(dto.publishedAt),
        categoryIds: dto.categoryIds ?? [],
      });
      return toArticleResponse(article);
    } catch (error) {
      throwDuplicateSlugAsBadRequest(error);
    }
  }

  async updateArticle(id: number, dto: UpdateBlogArticleDto) {
    await this.getAdminArticleById(id);

    if (dto.categoryIds) {
      await this.assertCategoriesExist(dto.categoryIds);
    }

    try {
      const article = await this.repository.updateArticle(id, {
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        bodyMarkdown: dto.bodyMarkdown,
        status: dto.status,
        seoTitle:
          dto.seoTitle === undefined
            ? undefined
            : normalizeNullableString(dto.seoTitle),
        seoDescription:
          dto.seoDescription === undefined
            ? undefined
            : normalizeNullableString(dto.seoDescription),
        publishedAt:
          dto.publishedAt === undefined
            ? undefined
            : parseNullableDate(dto.publishedAt),
        categoryIds: dto.categoryIds,
      });
      return toArticleResponse(article);
    } catch (error) {
      throwDuplicateSlugAsBadRequest(error);
    }
  }

  async publishArticle(id: number) {
    await this.getAdminArticleById(id);
    const article = await this.repository.updateArticle(id, {
      status: BLOG_PUBLISHED_STATUS,
      publishedAt: new Date(),
    });
    return toArticleResponse(article);
  }

  async unpublishArticle(id: number) {
    await this.getAdminArticleById(id);
    const article = await this.repository.updateArticle(id, {
      status: BLOG_UNPUBLISHED_STATUS,
    });
    return toArticleResponse(article);
  }

  async getAdminCategories() {
    const categories = await this.repository.findAllAdminCategories();
    return categories.map(toCategoryResponse);
  }

  async createCategory(dto: CreateBlogCategoryDto) {
    try {
      const category = await this.repository.createCategory({
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? '',
        seoTitle: normalizeNullableString(dto.seoTitle),
        seoDescription: normalizeNullableString(dto.seoDescription),
      });
      return toCategoryResponse(category);
    } catch (error) {
      throwDuplicateSlugAsBadRequest(error);
    }
  }

  async updateCategory(id: number, dto: UpdateBlogCategoryDto) {
    try {
      const category = await this.repository.updateCategory(id, {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        seoTitle:
          dto.seoTitle === undefined
            ? undefined
            : normalizeNullableString(dto.seoTitle),
        seoDescription:
          dto.seoDescription === undefined
            ? undefined
            : normalizeNullableString(dto.seoDescription),
      });
      return toCategoryResponse(category);
    } catch (error) {
      throwDuplicateSlugAsBadRequest(error);
    }
  }

  async getSitemapArticles() {
    return this.repository.findPublishedArticlesForSitemap(new Date());
  }

  private async assertCategoriesExist(categoryIds: number[]) {
    if (categoryIds.length === 0) {
      return;
    }

    const categories = await this.repository.findCategoriesByIds(categoryIds);

    if (categories.length !== new Set(categoryIds).size) {
      throw new BadRequestException('One or more categories do not exist');
    }
  }
}

type ArticleWithCategories = Awaited<
  ReturnType<BlogRepository['findAllAdminArticles']>
>[number];

type CategoryRecord = Awaited<
  ReturnType<BlogRepository['findAllAdminCategories']>
>[number];

function toArticleResponse(article: ArticleWithCategories) {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    bodyMarkdown: article.bodyMarkdown,
    status: article.status,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    publishedAt: article.publishedAt,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    categories: article.categories.map((item) =>
      toCategoryResponse(item.category),
    ),
  };
}

function toCategoryResponse(category: CategoryRecord) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    seoTitle: category.seoTitle,
    seoDescription: category.seoDescription,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function normalizeNullableString(value: string | null | undefined) {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return value.trim() || null;
}

function parseNullableDate(value: string | null | undefined) {
  if (value === null) {
    return null;
  }

  if (!value) {
    return undefined;
  }

  return new Date(value);
}

function throwDuplicateSlugAsBadRequest(error: unknown): never {
  if (
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002') ||
    (isPrismaCodeError(error) && error.code === 'P2002')
  ) {
    throw new BadRequestException('Slug is already in use');
  }

  throw error;
}

function isPrismaCodeError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}
