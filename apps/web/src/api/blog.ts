const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');

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

export async function getPublishedArticles(page = 1) {
  return requestBlog<BlogArticleListResponse>(`/api/v1/blog/articles?page=${page}`);
}

export async function getPublishedArticle(slug: string) {
  return requestBlog<BlogArticle>(`/api/v1/blog/articles/${encodeURIComponent(slug)}`);
}

async function requestBlog<T>(path: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Website API URL is not configured.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`);

  if (response.status === 404) {
    throw new Error('Article not found.');
  }

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}
