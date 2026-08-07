import type { BlogArticle, BlogArticleStatus } from '../../api/blog'

export const ARTICLE_FIELD_LIMITS = {
  title: 180,
  slug: 160,
  excerpt: 500,
  bodyMarkdown: 50000,
  seoTitle: 120,
  seoDescription: 180,
} as const

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type ArticleDisplayStatus = 'Draft' | 'Scheduled' | 'Published' | 'Unpublished'

export function slugifyTitle(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, ARTICLE_FIELD_LIMITS.slug)
}

export function normalizeSlugInput(slug: string) {
  return slugifyTitle(slug)
}

export function applyTitleChange<T extends { slug: string; title: string }>(
  form: T,
  title: string,
  options: { hasEditedSlug: boolean; isNewArticle: boolean },
): T {
  return {
    ...form,
    title,
    slug:
      options.isNewArticle && !options.hasEditedSlug
        ? slugifyTitle(title)
        : form.slug,
  }
}

export function isValidSlug(slug: string) {
  return slugPattern.test(slug)
}

export function deriveArticleDisplayStatus(input: {
  publishedAt: string | null
  status: BlogArticleStatus
}, now = new Date()): ArticleDisplayStatus {
  if (input.status === 'draft') {
    return 'Draft'
  }

  if (input.status === 'unpublished') {
    return 'Unpublished'
  }

  if (input.publishedAt && new Date(input.publishedAt).getTime() > now.getTime()) {
    return 'Scheduled'
  }

  return 'Published'
}

export function formatAdminDateTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '-'
}

export function toDatetimeLocalParts(value: string | null) {
  if (!value) {
    return { date: '', time: '' }
  }

  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  }
}

export function localDateTimePartsToIso(date: string, time: string) {
  if (!date || !time) {
    return null
  }

  return new Date(`${date}T${time}`).toISOString()
}

export function validateArticleFields(input: {
  bodyMarkdown: string
  excerpt: string
  seoDescription: string
  seoTitle: string
  slug: string
  title: string
}) {
  const errors: string[] = []

  if (input.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters.')
  }

  if (!isValidSlug(input.slug)) {
    errors.push('Slug must use lowercase letters, numbers, and hyphens only.')
  }

  for (const [fieldName, limit] of Object.entries(ARTICLE_FIELD_LIMITS)) {
    const value = input[fieldName as keyof typeof ARTICLE_FIELD_LIMITS]
    if (value.length > limit) {
      errors.push(`${getFieldLabel(fieldName)} must be ${limit} characters or fewer.`)
    }
  }

  return errors
}

export function validateSchedule(date: string, time: string, now = new Date()) {
  if (!date || !time) {
    return 'Publish Date and Publish Time are required when scheduling.'
  }

  const scheduledAt = new Date(`${date}T${time}`)

  if (Number.isNaN(scheduledAt.getTime())) {
    return 'Choose a valid Publish Date and Publish Time.'
  }

  if (scheduledAt.getTime() <= now.getTime()) {
    return 'Schedule for Later requires a future date and time.'
  }

  return null
}

export function hasSlugChangedForPublishedArticle(article: BlogArticle | null, slug: string) {
  if (!article || article.status !== 'published') {
    return false
  }

  return article.slug !== slug
}

function getFieldLabel(fieldName: string) {
  switch (fieldName) {
    case 'bodyMarkdown':
      return 'Article Content'
    case 'excerpt':
      return 'Short Summary'
    case 'seoDescription':
      return 'SEO Description'
    case 'seoTitle':
      return 'SEO Title'
    default:
      return fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  }
}
