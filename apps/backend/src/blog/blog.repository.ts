import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  BLOG_PUBLISHED_STATUS,
  type BlogArticleStatusValue,
} from './blog.constants';

type ArticleInput = {
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  status?: BlogArticleStatusValue;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: Date | null;
  categoryIds?: number[];
};

type CategoryInput = {
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

const articleInclude = {
  categories: {
    include: {
      category: true,
    },
    orderBy: {
      category: {
        name: 'asc' as const,
      },
    },
  },
};

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedArticles(input: {
    now: Date;
    skip: number;
    take: number;
    category?: string;
  }) {
    return this.prisma.blogArticle.findMany({
      where: {
        status: BLOG_PUBLISHED_STATUS,
        AND: [
          { publishedAt: { not: null } },
          { publishedAt: { lte: input.now } },
        ],
        ...(input.category
          ? {
              categories: {
                some: {
                  category: {
                    slug: input.category,
                  },
                },
              },
            }
          : {}),
      },
      include: articleInclude,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      skip: input.skip,
      take: input.take,
    });
  }

  countPublishedArticles(input: { now: Date; category?: string }) {
    return this.prisma.blogArticle.count({
      where: {
        status: BLOG_PUBLISHED_STATUS,
        AND: [
          { publishedAt: { not: null } },
          { publishedAt: { lte: input.now } },
        ],
        ...(input.category
          ? {
              categories: {
                some: {
                  category: {
                    slug: input.category,
                  },
                },
              },
            }
          : {}),
      },
    });
  }

  findPublishedArticleBySlug(slug: string, now: Date) {
    return this.prisma.blogArticle.findFirst({
      where: {
        slug,
        status: BLOG_PUBLISHED_STATUS,
        AND: [{ publishedAt: { not: null } }, { publishedAt: { lte: now } }],
      },
      include: articleInclude,
    });
  }

  findPublishedCategories(now: Date) {
    return this.prisma.blogCategory.findMany({
      where: {
        articles: {
          some: {
            article: {
              status: BLOG_PUBLISHED_STATUS,
              AND: [
                { publishedAt: { not: null } },
                { publishedAt: { lte: now } },
              ],
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  findPublishedArticlesForSitemap(now: Date) {
    return this.prisma.blogArticle.findMany({
      where: {
        status: BLOG_PUBLISHED_STATUS,
        AND: [{ publishedAt: { not: null } }, { publishedAt: { lte: now } }],
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });
  }

  findAllAdminArticles() {
    return this.prisma.blogArticle.findMany({
      include: articleInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
  }

  findAdminArticleById(id: number) {
    return this.prisma.blogArticle.findUnique({
      where: { id },
      include: articleInclude,
    });
  }

  createArticle(input: ArticleInput) {
    const { categoryIds = [], ...articleData } = input;

    return this.prisma.blogArticle.create({
      data: {
        ...articleData,
        categories: {
          create: categoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
      },
      include: articleInclude,
    });
  }

  async updateArticle(id: number, input: Partial<ArticleInput>) {
    const { categoryIds, ...articleData } = input;

    if (categoryIds) {
      await this.prisma.blogArticleCategory.deleteMany({
        where: { articleId: id },
      });
    }

    return this.prisma.blogArticle.update({
      where: { id },
      data: {
        ...articleData,
        ...(categoryIds
          ? {
              categories: {
                create: categoryIds.map((categoryId) => ({
                  categoryId,
                })),
              },
            }
          : {}),
      },
      include: articleInclude,
    });
  }

  findCategoriesByIds(ids: number[]) {
    return this.prisma.blogCategory.findMany({
      where: { id: { in: ids } },
    });
  }

  findAllAdminCategories() {
    return this.prisma.blogCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  createCategory(input: CategoryInput) {
    return this.prisma.blogCategory.create({ data: input });
  }

  updateCategory(id: number, input: Partial<CategoryInput>) {
    return this.prisma.blogCategory.update({
      where: { id },
      data: input,
    });
  }
}
