import { type FormEvent, useEffect, useState } from 'react'
import {
  type AuditLogFilterOptions,
  type AuditLogItem,
  type AuditLogQuery,
  type AuditLogResult,
  getAuditLogFilterOptions,
  getAuditLogs,
} from '../api/audit-logs'

const DEFAULT_PAGE_SIZE = 25
const EMPTY_FILTER_OPTIONS: AuditLogFilterOptions = {
  actors: [],
  modules: [],
  actions: [],
  resourceTypes: [],
}

export function SystemLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([])
  const [filterOptions, setFilterOptions] = useState<AuditLogFilterOptions>(EMPTY_FILTER_OPTIONS)
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
  const [areFilterOptionsLoading, setAreFilterOptionsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterOptionsError, setFilterOptionsError] = useState('')

  useEffect(() => {
    let isMounted = true

    getAuditLogFilterOptions()
      .then((options) => {
        if (!isMounted) {
          return
        }

        setFilterOptions(options)
      })
      .catch((nextError: unknown) => {
        if (!isMounted) {
          return
        }

        setFilterOptionsError(toErrorMessage(nextError))
      })
      .finally(() => {
        if (isMounted) {
          setAreFilterOptionsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

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

  function updateDraftFilter<K extends keyof AuditLogQuery>(key: K, value: AuditLogQuery[K]) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === 'module' ? { action: '' } : {}),
    }))
  }

  function movePage(direction: -1 | 1) {
    setFilters((current) => ({
      ...current,
      page: Math.max(1, (current.page ?? 1) + direction),
    }))
  }

  const visibleActionOptions = draftFilters.module
    ? filterOptions.actions.filter((action) => action.module === draftFilters.module)
    : filterOptions.actions

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="section-kicker">Security</p>
        <h2>System Logs</h2>
        <p>Review read-only backend audit records for important admin actions.</p>
      </div>

      {filterOptionsError ? (
        <p className="editor-message error">
          Filter options could not be loaded. Existing filters still work.
        </p>
      ) : null}

      <form className="settings-panel audit-filter-panel" onSubmit={applyFilters}>
        <div className="settings-inline-fields">
          <label className="settings-field">
            From
            <input
              onChange={(event) => updateDraftFilter('from', event.target.value)}
              type="date"
              value={draftFilters.from ?? ''}
            />
          </label>
          <label className="settings-field">
            To
            <input
              onChange={(event) => updateDraftFilter('to', event.target.value)}
              type="date"
              value={draftFilters.to ?? ''}
            />
          </label>
        </div>

        <div className="settings-inline-fields">
          <label className="settings-field">
            Actor
            <select
              disabled={areFilterOptionsLoading}
              onChange={(event) => updateDraftFilter('actor', event.target.value)}
              value={draftFilters.actor ?? ''}
            >
              <option value="">All users</option>
              {filterOptions.actors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            Search
            <input
              onChange={(event) => updateDraftFilter('search', event.target.value)}
              placeholder="Description, module, action"
              value={draftFilters.search ?? ''}
            />
          </label>
        </div>

        <div className="settings-inline-fields">
          <label className="settings-field">
            Module
            <select
              disabled={areFilterOptionsLoading}
              onChange={(event) => updateDraftFilter('module', event.target.value)}
              value={draftFilters.module ?? ''}
            >
              <option value="">All modules</option>
              {filterOptions.modules.map((moduleName) => (
                <option key={moduleName} value={moduleName}>
                  {formatModuleLabel(moduleName)}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            Action
            <select
              disabled={areFilterOptionsLoading}
              onChange={(event) => updateDraftFilter('action', event.target.value)}
              value={draftFilters.action ?? ''}
            >
              <option value="">All actions</option>
              {visibleActionOptions.map((action) => (
                <option key={action.value} value={action.value}>
                  {formatActionLabel(action.value)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="settings-inline-fields">
          <label className="settings-field">
            Result
            <select
              onChange={(event) =>
                updateDraftFilter('result', event.target.value as AuditLogResult | '')
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
            <select
              disabled={areFilterOptionsLoading}
              onChange={(event) => updateDraftFilter('resourceType', event.target.value)}
              value={draftFilters.resourceType ?? ''}
            >
              <option value="">All resources</option>
              {filterOptions.resourceTypes.map((resourceType) => (
                <option key={resourceType} value={resourceType}>
                  {formatResourceLabel(resourceType)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="audit-filter-actions">
          <button type="submit">Apply Filters</button>
          <button className="secondary" onClick={resetFilters} type="button">
            Reset Filters
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
              <colgroup>
                <col className="audit-col-date" />
                <col className="audit-col-actor" />
                <col className="audit-col-role" />
                <col className="audit-col-module" />
                <col className="audit-col-action" />
                <col className="audit-col-resource" />
                <col className="audit-col-description" />
                <col className="audit-col-result" />
                <col className="audit-col-ip" />
              </colgroup>
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
                    <td>{formatModuleLabel(item.module)}</td>
                    <td>{formatActionLabel(item.action)}</td>
                    <td>
                      {item.resourceDisplayName ?? item.resourceId ?? item.resourceType}
                    </td>
                    <td>
                      <span className="audit-description" title={item.description}>
                        {item.description}
                      </span>
                    </td>
                    <td>
                      <span className={`article-status-pill audit-result-badge ${item.result}`}>
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
              Page {pagination.page} of {Math.max(1, pagination.totalPages)} ·{' '}
              {pagination.total} records
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

function formatModuleLabel(value: string) {
  const labels: Record<string, string> = {
    app_distribution: 'App Distribution',
    auth: 'Authentication',
    blog: 'Blog',
    planetary_hours: 'Planetary Hours',
  }

  return labels[value] ?? formatUnknownLabel(value)
}

function formatActionLabel(value: string) {
  const labels: Record<string, string> = {
    'app_distribution.apk_upload': 'Upload APK',
    'app_distribution.settings_update': 'Update App Distribution',
    'auth.login.failure': 'Failed Login',
    'auth.login.success': 'Successful Login',
    'blog.article.create': 'Create Article',
    'blog.article.publish': 'Publish Article',
    'blog.article.schedule': 'Schedule Article',
    'blog.article.unpublish': 'Unpublish Article',
    'blog.article.update': 'Update Article',
    'blog.category.create': 'Create Category',
    'blog.category.update': 'Update Category',
    'planetary_hours.day_content_update': 'Update Planetary Hour Content',
  }

  return labels[value] ?? formatUnknownLabel(value)
}

function formatResourceLabel(value: string) {
  const labels: Record<string, string> = {
    admin_session: 'Admin Session',
    android_apk: 'Android APK',
    android_distribution: 'Android Distribution',
    blog_article: 'Blog Article',
    blog_category: 'Blog Category',
    planetary_hour_day: 'Planetary Hour Day',
  }

  return labels[value] ?? formatUnknownLabel(value)
}

function formatUnknownLabel(value: string) {
  return value
    .split(/[_ .-]+/g)
    .filter(Boolean)
    .map(capitalize)
    .join(' ')
}
