import { clearStoredToken, readStoredToken } from '../auth/session'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

export type BlogArticleStatus = 'draft' | 'published' | 'unpublished'

export type BlogCategory = {
  id: number
  name: string
  slug: string
  description: string
  seoTitle: string | null
  seoDescription: string | null
  createdAt: string
  updatedAt: string
}

export type BlogArticle = {
  id: number
  title: string
  slug: string
  excerpt: string
  bodyMarkdown: string
  status: BlogArticleStatus
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  categories: BlogCategory[]
}

export type BlogArticleInput = {
  title: string
  slug: string
  excerpt: string
  bodyMarkdown: string
  seoTitle?: string | null
  seoDescription?: string | null
  publishedAt?: string | null
  categoryIds?: number[]
}

export type BlogCategoryInput = {
  name: string
  slug: string
  description?: string
  seoTitle?: string | null
  seoDescription?: string | null
}

export function getAdminArticles() {
  return requestBlog<BlogArticle[]>('/api/v1/admin/blog/articles')
}

export function getAdminArticle(id: number) {
  return requestBlog<BlogArticle>(`/api/v1/admin/blog/articles/${id}`)
}

export function createArticle(input: BlogArticleInput) {
  return requestBlog<BlogArticle>('/api/v1/admin/blog/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, status: 'draft' }),
  })
}

export function updateArticle(id: number, input: Partial<BlogArticleInput>) {
  return requestBlog<BlogArticle>(`/api/v1/admin/blog/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function publishArticle(id: number) {
  return requestBlog<BlogArticle>(`/api/v1/admin/blog/articles/${id}/publish`, {
    method: 'POST',
  })
}

export function unpublishArticle(id: number) {
  return requestBlog<BlogArticle>(`/api/v1/admin/blog/articles/${id}/unpublish`, {
    method: 'POST',
  })
}

export function getAdminCategories() {
  return requestBlog<BlogCategory[]>('/api/v1/admin/blog/categories')
}

export function createCategory(input: BlogCategoryInput) {
  return requestBlog<BlogCategory>('/api/v1/admin/blog/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updateCategory(id: number, input: BlogCategoryInput) {
  return requestBlog<BlogCategory>(`/api/v1/admin/blog/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

async function requestBlog<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('Admin API URL is not configured.')
  }

  const headers = new Headers(options?.headers)
  const token = readStoredToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    clearStoredToken()
    throw new Error('Your session has expired. Please sign in again.')
  }

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new Error(message ?? `Request failed with status ${response.status}.`)
  }

  return response.json() as Promise<T>
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    return Array.isArray(body.message) ? body.message.join(' ') : body.message
  } catch {
    return null
  }
}
