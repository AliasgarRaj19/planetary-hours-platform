import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createArticle,
  getAdminArticle,
  getAdminCategories,
  publishArticle,
  unpublishArticle,
  updateArticle,
  type BlogArticle,
  type BlogCategory,
} from '../../api/blog'
import {
  ARTICLE_FIELD_LIMITS,
  applyTitleChange,
  deriveArticleDisplayStatus,
  formatAdminDateTime,
  hasSlugChangedForPublishedArticle,
  localDateTimePartsToIso,
  normalizeSlugInput,
  slugifyTitle,
  toDatetimeLocalParts,
  validateArticleFields,
  validateSchedule,
} from './article-editor-utils'

type ArticleForm = {
  title: string
  slug: string
  excerpt: string
  bodyMarkdown: string
  seoTitle: string
  seoDescription: string
  publishedAt: string
  publishDate: string
  publishTime: string
  categoryIds: number[]
}

const emptyForm: ArticleForm = {
  title: '',
  slug: '',
  excerpt: '',
  bodyMarkdown: '',
  seoTitle: '',
  seoDescription: '',
  publishedAt: '',
  publishDate: '',
  publishTime: '',
  categoryIds: [],
}

export function BlogArticleEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNewArticle = !id || id === 'new'
  const articleId = Number(id)
  const [article, setArticle] = useState<BlogArticle | null>(null)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [status, setStatus] = useState(isNewArticle ? '' : 'Loading article...')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasEditedSlug, setHasEditedSlug] = useState(false)

  useEffect(() => {
    getAdminCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (isNewArticle) {
      return
    }

    getAdminArticle(articleId)
      .then((nextArticle) => {
        setArticle(nextArticle)
        setForm(articleToForm(nextArticle))
        setHasEditedSlug(true)
        setStatus('')
      })
      .catch((nextError: unknown) => {
        setError(toErrorMessage(nextError))
        setStatus('')
      })
  }, [articleId, isNewArticle])

  const title = isNewArticle ? 'New Article' : 'Edit Article'
  const selectedCategoryIds = useMemo(() => new Set(form.categoryIds), [form.categoryIds])
  const displayStatus = article
    ? deriveArticleDisplayStatus(article)
    : isNewArticle
      ? 'Draft'
      : 'Draft'
  const showSlugWarning = hasSlugChangedForPublishedArticle(article, form.slug)

  function updateTitle(nextTitle: string) {
    setForm((currentForm) =>
      applyTitleChange(currentForm, nextTitle, { hasEditedSlug, isNewArticle }),
    )
  }

  function updateSlug(nextSlug: string) {
    setHasEditedSlug(true)
    setForm((currentForm) => ({
      ...currentForm,
      slug: normalizeSlugInput(nextSlug),
    }))
  }

  function regenerateSlug() {
    setHasEditedSlug(false)
    setForm((currentForm) => ({
      ...currentForm,
      slug: slugifyTitle(currentForm.title),
    }))
  }

  async function saveArticle(input: {
    nextPublishedAt?: string | null
    nextStatus?: 'draft' | 'published' | 'unpublished'
    successMessage: string
  }) {
    const validationErrors = validateArticleFields(form)

    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '))
      return null
    }

    setError('')
    setStatus('')
    setIsSaving(true)

    try {
      const payload = {
        ...formToPayload(form),
        ...(input.nextStatus ? { status: input.nextStatus } : {}),
        ...(input.nextPublishedAt !== undefined ? { publishedAt: input.nextPublishedAt } : {}),
      }
      const savedArticle = isNewArticle
        ? await createArticle(payload)
        : await updateArticle(articleId, payload)
      setArticle(savedArticle)
      setForm(articleToForm(savedArticle))
      setHasEditedSlug(true)
      setStatus(input.successMessage)

      if (isNewArticle) {
        navigate(`/blog/${savedArticle.id}`, { replace: true })
      }

      return savedArticle
    } catch (nextError) {
      setError(toErrorMessage(nextError))
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveDraft(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    await saveArticle({
      nextPublishedAt: null,
      nextStatus: 'draft',
      successMessage: 'Draft saved.',
    })
  }

  async function handlePublishNow() {
    const validationErrors = validateArticleFields(form)

    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '))
      setStatus('')
      return
    }

    setIsSaving(true)
    setError('')
    setStatus('')

    try {
      const targetArticle = article
        ? await updateArticle(article.id, formToPayload(form))
        : await createArticle({ ...formToPayload(form), publishedAt: null, status: 'draft' })
      const publishedArticle = await publishArticle(targetArticle.id)
      setArticle(publishedArticle)
      setForm(articleToForm(publishedArticle))
      setHasEditedSlug(true)
      setStatus('Article published now.')

      if (isNewArticle) {
        navigate(`/blog/${publishedArticle.id}`, { replace: true })
      }
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleScheduleForLater() {
    const scheduleError = validateSchedule(form.publishDate, form.publishTime)

    if (scheduleError) {
      setError(scheduleError)
      setStatus('')
      return
    }

    await saveArticle({
      nextPublishedAt: localDateTimePartsToIso(form.publishDate, form.publishTime),
      nextStatus: 'published',
      successMessage: 'Article scheduled.',
    })
  }

  async function handleUnpublish() {
    if (!article) {
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const unpublishedArticle = await unpublishArticle(article.id)
      setArticle(unpublishedArticle)
      setForm(articleToForm(unpublishedArticle))
      setStatus('Article unpublished.')
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  function toggleCategory(categoryId: number) {
    setForm((currentForm) => ({
      ...currentForm,
      categoryIds: selectedCategoryIds.has(categoryId)
        ? currentForm.categoryIds.filter((idValue) => idValue !== categoryId)
        : [...currentForm.categoryIds, categoryId],
    }))
  }

  return (
    <section className="page-section">
      <div className="page-heading action-heading">
        <div>
          <p className="section-kicker">Blog CMS</p>
          <h2>{title}</h2>
          <p>Status: {displayStatus}</p>
          {article?.publishedAt ? (
            <p>{displayStatus === 'Scheduled' ? 'Scheduled for' : 'Published'}: {formatAdminDateTime(article.publishedAt)}</p>
          ) : null}
        </div>
        <Link className="admin-button secondary" to="/blog">
          Back to Articles
        </Link>
      </div>

      {status ? <p className="editor-message">{status}</p> : null}
      {error ? <p className="editor-message error">{error}</p> : null}

      <form className="blog-editor-panel" onSubmit={handleSaveDraft}>
        <div className="settings-inline-fields">
          <label className="settings-field">
            <span className="field-label-row">
              Title
              <CharacterCounter limit={ARTICLE_FIELD_LIMITS.title} value={form.title} />
            </span>
            <input
              maxLength={ARTICLE_FIELD_LIMITS.title}
              value={form.title}
              onChange={(event) => updateTitle(event.target.value)}
            />
          </label>
          <label className="settings-field">
            <span className="field-label-row">
              Slug
              <CharacterCounter limit={ARTICLE_FIELD_LIMITS.slug} value={form.slug} />
            </span>
            <input
              maxLength={ARTICLE_FIELD_LIMITS.slug}
              value={form.slug}
              onChange={(event) => updateSlug(event.target.value)}
            />
            <button className="inline-text-button" onClick={regenerateSlug} type="button">
              Regenerate from title
            </button>
            {showSlugWarning ? (
              <span className="field-warning">
                Changing the slug changes the public article URL and may affect existing links and search indexing.
              </span>
            ) : null}
          </label>
        </div>

        <label className="settings-field">
          <span className="field-label-row">
            Short Summary
            <CharacterCounter limit={ARTICLE_FIELD_LIMITS.excerpt} value={form.excerpt} />
          </span>
          <span className="field-helper">
            A brief description shown in article listings and used as the SEO description when no custom SEO description is provided.
          </span>
          <textarea
            maxLength={ARTICLE_FIELD_LIMITS.excerpt}
            value={form.excerpt}
            onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
          />
        </label>

        <label className="settings-field">
          <span className="field-label-row">
            Article Content
            <CharacterCounter limit={ARTICLE_FIELD_LIMITS.bodyMarkdown} value={form.bodyMarkdown} />
          </span>
          <span className="field-helper">
            Write the full article content here. Basic formatting such as headings, lists, bold, italic and secure HTTPS links is supported.
          </span>
          <textarea
            className="markdown-editor"
            maxLength={ARTICLE_FIELD_LIMITS.bodyMarkdown}
            value={form.bodyMarkdown}
            onChange={(event) => setForm({ ...form, bodyMarkdown: event.target.value })}
          />
        </label>

        <fieldset className="mode-options">
          <legend>Categories</legend>
          {categories.length > 0 ? (
            categories.map((category) => (
              <label key={category.id}>
                <input
                  checked={selectedCategoryIds.has(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  type="checkbox"
                />
                {category.name}
              </label>
            ))
          ) : (
            <p>No categories created yet.</p>
          )}
        </fieldset>

        <div className="settings-inline-fields">
          <label className="settings-field">
            <span className="field-label-row">
              SEO Title
              <CharacterCounter limit={ARTICLE_FIELD_LIMITS.seoTitle} value={form.seoTitle} />
            </span>
            <input
              maxLength={ARTICLE_FIELD_LIMITS.seoTitle}
              value={form.seoTitle}
              onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
            />
          </label>
          <div className="schedule-controls-panel">
            <p className="schedule-title">Schedule for Later</p>
            <div className="settings-inline-fields compact">
              <label className="settings-field">
                Publish Date
                <input
                  type="date"
                  value={form.publishDate}
                  onChange={(event) => setForm({ ...form, publishDate: event.target.value })}
                />
              </label>
              <label className="settings-field">
                Publish Time
                <input
                  type="time"
                  value={form.publishTime}
                  onChange={(event) => setForm({ ...form, publishTime: event.target.value })}
                />
              </label>
            </div>
          </div>
        </div>

        <label className="settings-field">
          <span className="field-label-row">
            SEO Description
            <CharacterCounter limit={ARTICLE_FIELD_LIMITS.seoDescription} value={form.seoDescription} />
          </span>
          <textarea
            maxLength={ARTICLE_FIELD_LIMITS.seoDescription}
            value={form.seoDescription}
            onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
          />
        </label>

        <div className="save-bar">
          <div>
            <p className="save-state saved">Drafts and changes are saved manually.</p>
            <p className="save-toast">Markdown is rendered on the website after publishing.</p>
          </div>
          <div className="heading-actions">
            <button disabled={isSaving} type="submit">
              Save Draft
            </button>
            <button disabled={isSaving} onClick={handlePublishNow} type="button">
              Publish Now
            </button>
            <button disabled={isSaving} onClick={handleScheduleForLater} type="button">
              Schedule for Later
            </button>
            <button disabled={isSaving || !article} onClick={handleUnpublish} type="button">
              Unpublish
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

function CharacterCounter({ limit, value }: { limit: number; value: string }) {
  const ratio = value.length / limit
  const className = ratio >= 1 ? 'character-counter over-limit' : ratio >= 0.9 ? 'character-counter near-limit' : 'character-counter'

  return <span className={className}>{value.length} / {limit}</span>
}

function articleToForm(article: BlogArticle): ArticleForm {
  const parts = toDatetimeLocalParts(article.publishedAt)

  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    bodyMarkdown: article.bodyMarkdown,
    seoTitle: article.seoTitle ?? '',
    seoDescription: article.seoDescription ?? '',
    publishedAt: article.publishedAt ? article.publishedAt.slice(0, 16) : '',
    publishDate: parts.date,
    publishTime: parts.time,
    categoryIds: article.categories.map((category) => category.id),
  }
}

function formToPayload(form: ArticleForm) {
  return {
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    bodyMarkdown: form.bodyMarkdown,
    seoTitle: form.seoTitle || null,
    seoDescription: form.seoDescription || null,
    publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    categoryIds: form.categoryIds,
  }
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to save article.'
}
