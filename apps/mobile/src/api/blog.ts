export type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  status: 'draft' | 'published' | 'unpublished';
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categories: BlogCategory[];
};

export type BlogArticleListResponse = {
  items: BlogArticle[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

export async function getBlogCategories(signal?: AbortSignal) {
  return requestBlog<BlogCategory[]>('/api/v1/blog/categories', signal);
}

export async function getBlogArticles(category?: string, signal?: AbortSignal) {
  const searchParams = new URLSearchParams({ page: '1' });

  if (category) {
    searchParams.set('category', category);
  }

  return requestBlog<BlogArticleListResponse>(
    `/api/v1/blog/articles?${searchParams.toString()}`,
    signal,
  );
}

export async function getBlogArticle(slug: string, signal?: AbortSignal) {
  return requestBlog<BlogArticle>(
    `/api/v1/blog/articles/${encodeURIComponent(slug)}`,
    signal,
  );
}

async function requestBlog<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Mobile API URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { signal });

  if (response.status === 404) {
    throw new Error('Article not found.');
  }

  if (!response.ok) {
    throw new Error(`Unable to load blog content: ${response.status}`);
  }

  return (await response.json()) as T;
}
