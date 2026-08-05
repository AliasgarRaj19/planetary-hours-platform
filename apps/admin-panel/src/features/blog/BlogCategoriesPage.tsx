import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createCategory,
  getAdminCategories,
  updateCategory,
  type BlogCategory,
} from '../../api/blog'

const emptyCategory = {
  name: '',
  slug: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
}

export function BlogCategoriesPage() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyCategory)
  const [status, setStatus] = useState('Loading categories...')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const nextCategories = await getAdminCategories()
      setCategories(nextCategories)
      setStatus('')
    } catch (nextError) {
      setError(toErrorMessage(nextError))
      setStatus('')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setStatus('')

    try {
      if (editingId) {
        await updateCategory(editingId, normalizeForm(form))
        setStatus('Category updated.')
      } else {
        await createCategory(normalizeForm(form))
        setStatus('Category created.')
      }

      setForm(emptyCategory)
      setEditingId(null)
      await loadCategories()
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  function editCategory(category: BlogCategory) {
    setEditingId(category.id)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      seoTitle: category.seoTitle ?? '',
      seoDescription: category.seoDescription ?? '',
    })
  }

  return (
    <section className="page-section">
      <div className="page-heading action-heading">
        <div>
          <p className="section-kicker">Blog CMS</p>
          <h2>Categories</h2>
          <p>Manage the categories assigned to published and draft articles.</p>
        </div>
        <Link className="admin-button secondary" to="/blog">
          Back to Articles
        </Link>
      </div>

      {status ? <p className="editor-message">{status}</p> : null}
      {error ? <p className="editor-message error">{error}</p> : null}

      <div className="settings-grid">
        <form className="settings-panel" onSubmit={handleSubmit}>
          <div>
            <p className="card-label">{editingId ? 'Edit category' : 'New category'}</p>
            <h3>{editingId ? 'Update category' : 'Create category'}</h3>
          </div>
          <label className="settings-field">
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="settings-field">
            Slug
            <input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </label>
          <label className="settings-field">
            Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <button disabled={isSaving} type="submit">
            {isSaving ? 'Saving...' : editingId ? 'Save Category' : 'Create Category'}
          </button>
        </form>

        <div className="settings-panel">
          <div>
            <p className="card-label">Existing categories</p>
            <h3>Category list</h3>
          </div>
          <div className="category-list">
            {categories.length > 0 ? (
              categories.map((category) => (
                <button key={category.id} onClick={() => editCategory(category)} type="button">
                  <strong>{category.name}</strong>
                  <span>{category.slug}</span>
                </button>
              ))
            ) : (
              <p>No categories yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function normalizeForm(form: typeof emptyCategory) {
  return {
    name: form.name,
    slug: form.slug,
    description: form.description,
    seoTitle: form.seoTitle || null,
    seoDescription: form.seoDescription || null,
  }
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to save category.'
}
