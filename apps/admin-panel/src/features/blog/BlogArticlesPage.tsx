import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getAdminArticles, type BlogArticle } from '../../api/blog'

export function BlogArticlesPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [status, setStatus] = useState('Loading articles...')
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminArticles()
      .then((nextArticles) => {
        setArticles(nextArticles)
        setStatus('')
      })
      .catch((nextError: unknown) => {
        setError(toErrorMessage(nextError))
        setStatus('')
      })
  }, [])

  return (
    <section className="page-section">
      <div className="page-heading action-heading">
        <div>
          <p className="section-kicker">Blog CMS</p>
          <h2>Articles</h2>
          <p>Create drafts, manage categories, and publish website articles.</p>
        </div>
        <div className="heading-actions">
          <Link className="admin-button secondary" to="/blog/categories">
            Categories
          </Link>
          <Link className="admin-button" to="/blog/new">
            New Article
          </Link>
        </div>
      </div>

      {status ? <p className="editor-message">{status}</p> : null}
      {error ? <p className="editor-message error">{error}</p> : null}

      <div className="editor-table-panel">
        <table className="hours-table admin-list-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Categories</th>
              <th>Published</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {articles.length > 0 ? (
              articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link to={`/blog/${article.id}`}>{article.title}</Link>
                  </td>
                  <td>{article.slug}</td>
                  <td>{article.status}</td>
                  <td>{article.categories.map((category) => category.name).join(', ') || 'None'}</td>
                  <td>{formatDate(article.publishedAt)}</td>
                  <td>{formatDate(article.updatedAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No blog articles yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value)) : '-'
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load blog articles.'
}
