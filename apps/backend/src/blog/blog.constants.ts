export const BLOG_DRAFT_STATUS = 'draft';
export const BLOG_PUBLISHED_STATUS = 'published';
export const BLOG_UNPUBLISHED_STATUS = 'unpublished';

export const blogArticleStatuses = [
  BLOG_DRAFT_STATUS,
  BLOG_PUBLISHED_STATUS,
  BLOG_UNPUBLISHED_STATUS,
] as const;

export type BlogArticleStatusValue = (typeof blogArticleStatuses)[number];

export const blogSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DEFAULT_BLOG_PAGE_SIZE = 10;
export const MAX_BLOG_PAGE_SIZE = 50;
