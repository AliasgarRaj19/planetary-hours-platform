import { describe, expect, it } from 'vitest'
import {
  ARTICLE_FIELD_LIMITS,
  applyTitleChange,
  deriveArticleDisplayStatus,
  hasSlugChangedForPublishedArticle,
  localDateTimePartsToIso,
  normalizeSlugInput,
  slugifyTitle,
  toDatetimeLocalParts,
  validateArticleFields,
  validateSchedule,
} from './article-editor-utils'
import type { BlogArticle } from '../../api/blog'

describe('blog article editor utilities', () => {
  it('auto-generates normalized slugs from titles', () => {
    expect(slugifyTitle('What Are Planetary Hours?')).toBe('what-are-planetary-hours')
    expect(slugifyTitle('  Mars & Venus: Timing 101!  ')).toBe('mars-venus-timing-101')
    expect(normalizeSlugInput('Bad Slug!!')).toBe('bad-slug')
  })

  it('auto-generates slug while typing a new article title', () => {
    expect(
      applyTitleChange(
        { slug: '', title: '' },
        'What Are Planetary Hours?',
        { hasEditedSlug: false, isNewArticle: true },
      ),
    ).toEqual({
      slug: 'what-are-planetary-hours',
      title: 'What Are Planetary Hours?',
    })
  })

  it('manual slug edits stop title changes from overwriting the slug', () => {
    expect(
      applyTitleChange(
        { slug: 'custom-slug', title: 'Old Title' },
        'New Title',
        { hasEditedSlug: true, isNewArticle: true },
      ),
    ).toEqual({
      slug: 'custom-slug',
      title: 'New Title',
    })
  })

  it('existing article title edits do not change the slug automatically', () => {
    expect(
      applyTitleChange(
        { slug: 'existing-slug', title: 'Existing Title' },
        'Updated Existing Title',
        { hasEditedSlug: false, isNewArticle: false },
      ),
    ).toEqual({
      slug: 'existing-slug',
      title: 'Updated Existing Title',
    })
  })

  it('uses backend-supported character maximums', () => {
    expect(ARTICLE_FIELD_LIMITS).toEqual({
      title: 180,
      slug: 160,
      excerpt: 500,
      bodyMarkdown: 50000,
      seoTitle: 120,
      seoDescription: 180,
    })
  })

  it('reports invalid slug, required title, and overflow errors', () => {
    const errors = validateArticleFields({
      bodyMarkdown: '',
      excerpt: 'x'.repeat(501),
      seoDescription: '',
      seoTitle: '',
      slug: 'Invalid Slug',
      title: '',
    })

    expect(errors).toContain('Title must be at least 3 characters.')
    expect(errors).toContain('Slug must use lowercase letters, numbers, and hyphens only.')
    expect(errors).toContain('Short Summary must be 500 characters or fewer.')
  })

  it('derives Scheduled from published articles with future publishedAt', () => {
    const now = new Date('2026-08-07T10:00:00.000Z')

    expect(
      deriveArticleDisplayStatus(
        { status: 'published', publishedAt: '2026-08-08T10:00:00.000Z' },
        now,
      ),
    ).toBe('Scheduled')
    expect(
      deriveArticleDisplayStatus(
        { status: 'published', publishedAt: '2026-08-07T09:00:00.000Z' },
        now,
      ),
    ).toBe('Published')
    expect(deriveArticleDisplayStatus({ status: 'draft', publishedAt: null }, now)).toBe('Draft')
    expect(deriveArticleDisplayStatus({ status: 'unpublished', publishedAt: null }, now)).toBe(
      'Unpublished',
    )
  })

  it('validates scheduling date and time requirements', () => {
    const now = new Date('2026-08-07T10:00:00.000Z')

    expect(validateSchedule('', '', now)).toBe(
      'Publish Date and Publish Time are required when scheduling.',
    )
    expect(validateSchedule('2026-08-07', '09:00', now)).toBe(
      'Schedule for Later requires a future date and time.',
    )
    expect(validateSchedule('2999-08-07', '09:00', now)).toBeNull()
  })

  it('converts local date/time controls into ISO values and back', () => {
    const iso = localDateTimePartsToIso('2026-08-07', '15:30')

    expect(iso).toBeTruthy()
    expect(toDatetimeLocalParts(iso)).toEqual({ date: '2026-08-07', time: '15:30' })
  })

  it('warns when a published article slug changes', () => {
    const article = createArticle({ status: 'published', slug: 'original-slug' })

    expect(hasSlugChangedForPublishedArticle(article, 'new-slug')).toBe(true)
    expect(hasSlugChangedForPublishedArticle(article, 'original-slug')).toBe(false)
    expect(
      hasSlugChangedForPublishedArticle(createArticle({ status: 'draft', slug: 'original-slug' }), 'new-slug'),
    ).toBe(false)
  })
})

function createArticle(input: Partial<BlogArticle>): BlogArticle {
  return {
    bodyMarkdown: '',
    categories: [],
    createdAt: '2026-08-07T00:00:00.000Z',
    excerpt: '',
    id: 1,
    publishedAt: null,
    seoDescription: null,
    seoTitle: null,
    slug: 'article',
    status: 'draft',
    title: 'Article',
    updatedAt: '2026-08-07T00:00:00.000Z',
    ...input,
  }
}
