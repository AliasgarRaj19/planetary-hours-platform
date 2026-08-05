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

type ArticleForm = {
  title: string
  slug: string
  excerpt: string
  bodyMarkdown: string
  seoTitle: string
  seoDescription: string
  publishedAt: string
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
        setStatus('')
      })
      .catch((nextError: unknown) => {
        setError(toErrorMessage(nextError))
        setStatus('')
      })
  }, [articleId, isNewArticle])

  const title = isNewArticle ? 'New Article' : 'Edit Article'
  const selectedCategoryIds = useMemo(() => new Set(form.categoryIds), [form.categoryIds])

  async function handleSave(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setError('')
    setStatus('')
    setIsSaving(true)

    try {
      const payload = formToPayload(form)
      const savedArticle = isNewArticle
        ? await createArticle(payload)
        : await updateArticle(articleId, payload)
      setArticle(savedArticle)
      setForm(articleToForm(savedArticle))
      setStatus('Article saved.')

      if (isNewArticle) {
        navigate(`/blog/${savedArticle.id}`, { replace: true })
      }
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    if (!article) {
      await handleSave()
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const savedArticle = await updateArticle(article.id, formToPayload(form))
      const publishedArticle = await publishArticle(savedArticle.id)
      setArticle(publishedArticle)
      setForm(articleToForm(publishedArticle))
      setStatus('Article published.')
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
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
          <p>Status: {article?.status ?? 'draft'}</p>
        </div>
        <Link className="admin-button secondary" to="/blog">
          Back to Articles
        </Link>
      </div>

      {status ? <p className="editor-message">{status}</p> : null}
      {error ? <p className="editor-message error">{error}</p> : null}

      <form className="blog-editor-panel" onSubmit={handleSave}>
        <div className="settings-inline-fields">
          <label className="settings-field">
            Title
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="settings-field">
            Slug
            <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </label>
        </div>

        <label className="settings-field">
          Excerpt
          <textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} />
        </label>

        <label className="settings-field">
          Markdown body
          <textarea
            className="markdown-editor"
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
            SEO title
            <input value={form.seoTitle} onChange={(event) => setForm({ ...form, seoTitle: event.target.value })} />
          </label>
          <label className="settings-field">
            Published date
            <input
              type="datetime-local"
              value={form.publishedAt}
              onChange={(event) => setForm({ ...form, publishedAt: event.target.value })}
            />
          </label>
        </div>

        <label className="settings-field">
          SEO description
          <textarea value={form.seoDescription} onChange={(event) => setForm({ ...form, seoDescription: event.target.value })} />
        </label>

        <div className="save-bar">
          <div>
            <p className="save-state saved">Drafts and changes are saved manually.</p>
            <p className="save-toast">Markdown is rendered on the website after publishing.</p>
          </div>
          <div className="heading-actions">
            <button disabled={isSaving} type="submit">
              {isNewArticle ? 'Save Draft' : 'Save Changes'}
            </button>
            <button disabled={isSaving} onClick={handlePublish} type="button">
              Publish
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

function articleToForm(article: BlogArticle): ArticleForm {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    bodyMarkdown: article.bodyMarkdown,
    seoTitle: article.seoTitle ?? '',
    seoDescription: article.seoDescription ?? '',
    publishedAt: article.publishedAt ? article.publishedAt.slice(0, 16) : '',
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
