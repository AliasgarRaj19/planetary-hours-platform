import { useEffect, useMemo, useState } from 'react'
import {
  getAnalyticsEvents,
  getAnalyticsOverview,
  getAnalyticsPages,
  getAnalyticsRealtime,
  getAnalyticsTraffic,
  type AnalyticsEvents,
  type AnalyticsOverview,
  type AnalyticsPages,
  type AnalyticsRange,
  type AnalyticsRealtime,
  type AnalyticsTraffic,
} from '../api/analytics'

const rangeOptions: Array<{ label: string; value: AnalyticsRange }> = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
]

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('7d')
  const [realtime, setRealtime] = useState<AnalyticsRealtime | null>(null)
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [pages, setPages] = useState<AnalyticsPages | null>(null)
  const [events, setEvents] = useState<AnalyticsEvents | null>(null)
  const [traffic, setTraffic] = useState<AnalyticsTraffic | null>(null)
  const [realtimeStatus, setRealtimeStatus] = useState('Loading realtime analytics...')
  const [historicalStatus, setHistoricalStatus] = useState('Loading analytics reports...')
  const [realtimeError, setRealtimeError] = useState('')
  const [historicalError, setHistoricalError] = useState('')

  useEffect(() => {
    let ignore = false

    function loadRealtime() {
      setRealtimeStatus('Loading realtime analytics...')
      getAnalyticsRealtime()
        .then((response) => {
          if (!ignore) {
            setRealtime(response)
            setRealtimeStatus('')
            setRealtimeError('')
          }
        })
        .catch((error: unknown) => {
          if (!ignore) {
            setRealtimeStatus('')
            setRealtimeError(getErrorMessage(error))
          }
        })
    }

    loadRealtime()
    const interval = window.setInterval(loadRealtime, 45_000)

    return () => {
      ignore = true
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    setHistoricalStatus('Loading analytics reports...')

    Promise.allSettled([
      getAnalyticsOverview(range),
      getAnalyticsPages(range),
      getAnalyticsEvents(range),
      getAnalyticsTraffic(range),
    ]).then(([overviewResult, pagesResult, eventsResult, trafficResult]) => {
      if (ignore) {
        return
      }

      if (overviewResult.status === 'fulfilled') {
        setOverview(overviewResult.value)
      }
      if (pagesResult.status === 'fulfilled') {
        setPages(pagesResult.value)
      }
      if (eventsResult.status === 'fulfilled') {
        setEvents(eventsResult.value)
      }
      if (trafficResult.status === 'fulfilled') {
        setTraffic(trafficResult.value)
      }

      const firstError = [overviewResult, pagesResult, eventsResult, trafficResult].find(
        (result) => result.status === 'rejected',
      )

      setHistoricalError(
        firstError && firstError.status === 'rejected'
          ? getErrorMessage(firstError.reason)
          : '',
      )
      setHistoricalStatus('')
    })

    return () => {
      ignore = true
    }
  }, [range])

  const selectedRangeLabel = useMemo(
    () => rangeOptions.find((option) => option.value === range)?.label ?? 'Last 7 Days',
    [range],
  )

  return (
    <section className="page-section analytics-dashboard">
      <div className="page-heading action-heading">
        <div>
          <p className="section-kicker">Analytics</p>
          <h2>Website Analytics</h2>
          <p>
            Review consenting public website traffic, content engagement, and app download activity.
          </p>
        </div>
        <label className="settings-field analytics-range-field">
          Date range
          <select value={range} onChange={(event) => setRange(event.target.value as AnalyticsRange)}>
            {rangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <AnalyticsMessage message={realtimeStatus || realtimeError} isError={Boolean(realtimeError)} />
      <section className="analytics-section" aria-labelledby="analytics-realtime-title">
        <h3 id="analytics-realtime-title">Realtime</h3>
        <div className="status-grid">
          <MetricCard label="Active Users" value={realtime?.activeUsers} />
          <MetricCard label="Recent Views" value={realtime?.recentViews} />
          <MetricCard label="Recent Events" value={realtime?.recentEvents} />
        </div>
        <div className="analytics-grid two-columns">
          <SimpleTable
            columns={['Page', 'Title', 'Active Users']}
            emptyMessage="No active pages right now."
            rows={(realtime?.activePages ?? []).map((page) => [
              page.path,
              page.title ?? 'Untitled',
              formatNumber(page.activeUsers),
            ])}
            title="Active Pages"
          />
          <SimpleTable
            columns={['Event', 'Count']}
            emptyMessage="No realtime events right now."
            rows={(realtime?.events ?? []).map((event) => [
              event.eventName,
              formatNumber(event.count),
            ])}
            title="Recent Events"
          />
        </div>
      </section>

      <AnalyticsMessage
        message={historicalStatus || historicalError}
        isError={Boolean(historicalError)}
      />
      <section className="analytics-section" aria-labelledby="analytics-overview-title">
        <h3 id="analytics-overview-title">Overview - {selectedRangeLabel}</h3>
        <div className="status-grid analytics-metric-grid">
          <MetricCard label="Users" value={overview?.users} />
          <MetricCard label="Sessions" value={overview?.sessions} />
          <MetricCard label="Views" value={overview?.views} />
          <MetricCard label="Engagement Rate" value={formatPercent(overview?.engagementRate)} />
          <MetricCard
            label="Average Engagement Time"
            value={formatDuration(overview?.averageEngagementTimeSeconds)}
          />
        </div>
      </section>

      <section className="analytics-section" aria-labelledby="analytics-content-title">
        <h3 id="analytics-content-title">Content</h3>
        <SimpleTable
          columns={['Page', 'Title', 'Views', 'Users']}
          emptyMessage="No page data is available for this range."
          rows={(pages?.items ?? []).map((page) => [
            page.path,
            page.title ?? 'Untitled',
            formatNumber(page.views),
            formatNumber(page.users),
          ])}
          title="Top Pages"
        />
      </section>

      <section className="analytics-section" aria-labelledby="analytics-engagement-title">
        <h3 id="analytics-engagement-title">Engagement</h3>
        <div className="status-grid">
          <MetricCard label="App Download Clicks" value={events?.customEvents.appDownloadClicks} />
          <MetricCard label="Schedule Interactions" value={events?.customEvents.scheduleDateChanges} />
          <MetricCard label="Blog Article Views" value={events?.customEvents.blogArticleViews} />
          <MetricCard
            label="Blog Category Selections"
            value={events?.customEvents.blogCategorySelections}
          />
        </div>
        <SimpleTable
          columns={['Event', 'Count']}
          emptyMessage="No event data is available for this range."
          rows={(events?.topEvents ?? []).map((event) => [
            event.eventName,
            formatNumber(event.count),
          ])}
          title="Top Events"
        />
      </section>

      <section className="analytics-section" aria-labelledby="analytics-traffic-title">
        <h3 id="analytics-traffic-title">Traffic / Audience</h3>
        <div className="analytics-grid three-columns">
          <SimpleTable
            columns={['Source / Medium', 'Users', 'Sessions']}
            emptyMessage="No source data is available."
            rows={(traffic?.sources ?? []).map((source) => [
              source.sourceMedium,
              formatNumber(source.users),
              formatNumber(source.sessions),
            ])}
            title="Traffic Sources"
          />
          <SimpleTable
            columns={['Country', 'Users']}
            emptyMessage="No country data is available."
            rows={(traffic?.countries ?? []).map((country) => [
              country.country,
              formatNumber(country.users),
            ])}
            title="Countries"
          />
          <SimpleTable
            columns={['Device', 'Users']}
            emptyMessage="No device data is available."
            rows={(traffic?.devices ?? []).map((device) => [
              device.deviceCategory,
              formatNumber(device.users),
            ])}
            title="Devices"
          />
        </div>
      </section>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: number | string | undefined | null }) {
  return (
    <article className="status-card">
      <div>
        <p className="card-label">{label}</p>
        <h3>{value === undefined || value === null ? '-' : value}</h3>
      </div>
    </article>
  )
}

function SimpleTable({
  columns,
  emptyMessage,
  rows,
  title,
}: {
  columns: string[]
  emptyMessage: string
  rows: string[][]
  title: string
}) {
  return (
    <article className="analytics-table-panel">
      <h4>{title}</h4>
      {rows.length > 0 ? (
        <div className="analytics-table-scroll">
          <table className="admin-list-table analytics-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${rowIndex}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </article>
  )
}

function AnalyticsMessage({ isError, message }: { isError: boolean; message: string }) {
  if (!message) {
    return null
  }

  return <p className={`editor-message${isError ? ' error' : ''}`}>{message}</p>
}

function formatNumber(value: number | undefined | null) {
  return new Intl.NumberFormat('en').format(value ?? 0)
}

function formatPercent(value: number | undefined | null) {
  if (value === undefined || value === null) {
    return '-'
  }

  return `${Math.round(value * 1000) / 10}%`
}

function formatDuration(value: number | undefined | null) {
  if (value === undefined || value === null) {
    return '-'
  }

  const seconds = Math.round(value)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Analytics data is unavailable right now.'
}
