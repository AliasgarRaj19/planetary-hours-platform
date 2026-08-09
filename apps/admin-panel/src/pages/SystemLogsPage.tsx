import { type FormEvent, useEffect, useState } from 'react'
import {
  type AuditLogItem,
  type AuditLogQuery,
  type AuditLogResult,
  getAuditLogs,
} from '../api/audit-logs'

const DEFAULT_PAGE_SIZE = 25

export function SystemLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState<AuditLogQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [draftFilters, setDraftFilters] = useState<AuditLogQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setError('')

    getAuditLogs(filters)
      .then((response) => {
        if (!isMounted) {
          return
        }

        setItems(response.items)
        setPagination(response.pagination)
      })
      .catch((nextError: unknown) => {
        if (!isMounted) {
          return
        }

        setItems([])
        setError(toErrorMessage(nextError))
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [filters])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters({ ...draftFilters, page: 1, pageSize: DEFAULT_PAGE_SIZE })
  }

  function resetFilters() {
    const nextFilters = { page: 1, pageSize: DEFAULT_PAGE_SIZE }
    setDraftFilters(nextFilters)
    setFilters(nextFilters)
  }

  function movePage(direction: -1 | 1) {
    setFilters((current) => ({
      ...current,
      page: Math.max(1, (current.page ?? 1) + direction),
    }))
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="section-kicker">Security</p>
        <h2>System Logs</h2>
        <p>Review read-only backend audit records for important admin actions.</p>
      </div>

      <form className="settings-panel audit-filter-panel" onSubmit={applyFilters}>
        <div className="settings-inline-fields">
          <label className="settings-field">
            From
            <input
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, from: event.target.value }))
              }
              type="date"
              value={draftFilters.from ?? ''}
            />
          </label>
          <label className="settings-field">
            To
            <input
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, to: event.target.value }))
              }
              type="date"
              value={draftFilters.to ?? ''}
            />
          </label>
        </div>

        <div className="settings-inline-fields">
          <label className="settings-field">
            Actor
            <input
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, actor: event.target.value }))
              }
              placeholder="admin@example.com"
              value={draftFilters.actor ?? ''}
            />
          </label>
          <label className="settings-field">
            Search
            <input
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Description, module, action"
              value={draftFilters.search ?? ''}
            />
          </label>
        </div>

        <div className="settings-inline-fields">
          <label className="settings-field">
            Module
            <input
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, module: event.target.value }))
              }
              placeholder="blog"
              value={draftFilters.module ?? ''}
            />
          </label>
          <label className="settings-field">
            Action
            <input
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, action: event.target.value }))
              }
              placeholder="blog.article.update"
              value={draftFilters.action ?? ''}
            />
          </label>
        </div>

        <div className="settings-inline-fields">
          <label className="settings-field">
            Result
            <select
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  result: event.target.value as AuditLogResult | '',
                }))
              }
              value={draftFilters.result ?? ''}
            >
              <option value="">All results</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </label>
          <label className="settings-field">
            Resource type
            <input
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  resourceType: event.target.value,
                }))
              }
              placeholder="blog_article"
              value={draftFilters.resourceType ?? ''}
            />
          </label>
        </div>

        <div className="audit-filter-actions">
          <button type="submit">Apply Filters</button>
          <button className="secondary" onClick={resetFilters} type="button">
            Reset
          </button>
        </div>
      </form>

      {isLoading ? <p className="editor-message">Loading system logs...</p> : null}
      {error ? <p className="editor-message error">{error}</p> : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="empty-panel">
          <p>No system logs match the current filters.</p>
        </div>
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="analytics-table-panel">
          <div className="analytics-table-scroll">
            <table className="analytics-table audit-table">
              <thead>
                <tr>
                  <th>Date/time</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Description</th>
                  <th>Result</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>{item.actorDisplayName ?? item.actorUsername ?? 'System'}</td>
                    <td>{item.actorRole ?? 'Not set'}</td>
                    <td>{item.module}</td>
                    <td>{item.action}</td>
                    <td>
                      {item.resourceDisplayName ?? item.resourceId ?? item.resourceType}
                    </td>
                    <td>{item.description}</td>
                    <td>
                      <span className={`article-status-pill ${item.result}`}>
                        {capitalize(item.result)}
                      </span>
                    </td>
                    <td>{item.ipAddress ?? 'Not available'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="audit-pagination" aria-label="System logs pagination">
            <button
              className="admin-button secondary"
              disabled={pagination.page <= 1}
              onClick={() => movePage(-1)}
              type="button"
            >
              Previous
            </button>
            <span>
              Page {pagination.page} of {Math.max(1, pagination.totalPages)}
            </span>
            <button
              className="admin-button secondary"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => movePage(1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load system logs.'
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
