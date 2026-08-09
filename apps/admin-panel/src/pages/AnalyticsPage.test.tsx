import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getAnalyticsEvents,
  getAnalyticsOverview,
  getAnalyticsPages,
  getAnalyticsRealtime,
  getAnalyticsTraffic,
} from '../api/analytics'
import { AnalyticsPage } from './AnalyticsPage'

vi.mock('../api/analytics', () => ({
  getAnalyticsRealtime: vi.fn(),
  getAnalyticsOverview: vi.fn(),
  getAnalyticsPages: vi.fn(),
  getAnalyticsEvents: vi.fn(),
  getAnalyticsTraffic: vi.fn(),
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('AnalyticsPage', () => {
  let root: Root | null = null
  let container: HTMLDivElement | null = null

  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    container?.remove()
    root = null
    container = null
    vi.clearAllMocks()
  })

  it('renders realtime, overview, content, engagement, and traffic analytics', async () => {
    mockSuccessfulAnalytics()

    renderPage()

    expect(text()).toContain('Loading realtime analytics...')
    await waitForText('/schedule')
    expect(text()).toContain('Active Users')
    expect(text()).toContain('Recent Views')
    expect(text()).toContain('Recent Events')
    expect(text()).toContain('Top Pages')
    expect(text()).toContain('App Download Clicks')
    expect(text()).toContain('Schedule Interactions')
    expect(text()).toContain('Blog Article Views')
    expect(text()).toContain('Blog Category Selections')
    expect(text()).toContain('Traffic Sources')
    expect(text()).toContain('google / organic')
    expect(text()).toContain('India')
    expect(text()).toContain('mobile')
  })

  it('reloads historical reports when the range changes', async () => {
    mockSuccessfulAnalytics()

    renderPage()

    const select = container?.querySelector('select')
    expect(select).toBeTruthy()
    await act(async () => {
      select!.value = '30d'
      select!.dispatchEvent(new Event('change', { bubbles: true }))
    })

    await waitFor(() => {
      expect(getAnalyticsOverview).toHaveBeenCalledWith('30d')
      expect(getAnalyticsPages).toHaveBeenCalledWith('30d')
      expect(getAnalyticsEvents).toHaveBeenCalledWith('30d')
      expect(getAnalyticsTraffic).toHaveBeenCalledWith('30d')
    })
  })

  it('renders empty and API failure states', async () => {
    vi.mocked(getAnalyticsRealtime).mockRejectedValue(new Error('Analytics unavailable'))
    vi.mocked(getAnalyticsOverview).mockResolvedValue(createOverview())
    vi.mocked(getAnalyticsPages).mockResolvedValue({
      range: '7d',
      items: [],
      refreshedAt: '2026-08-09T00:00:00.000Z',
    })
    vi.mocked(getAnalyticsEvents).mockResolvedValue({
      range: '7d',
      customEvents: {
        appDownloadClicks: 0,
        scheduleDateChanges: 0,
        blogArticleViews: 0,
        blogCategorySelections: 0,
      },
      topEvents: [],
      refreshedAt: '2026-08-09T00:00:00.000Z',
    })
    vi.mocked(getAnalyticsTraffic).mockResolvedValue({
      range: '7d',
      sources: [],
      countries: [],
      devices: [],
      refreshedAt: '2026-08-09T00:00:00.000Z',
    })

    renderPage()

    await waitForText('Analytics unavailable')
    expect(text()).toContain('No page data is available for this range.')
    expect(text()).toContain('No event data is available for this range.')
    expect(text()).toContain('No source data is available.')
  })

  function renderPage() {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    act(() => {
      root!.render(<AnalyticsPage />)
    })
  }

  function text() {
    return container?.textContent ?? ''
  }
})

async function waitForText(expectedText: string) {
  await waitFor(() => {
    expect(document.body.textContent ?? '').toContain(expectedText)
  })
}

async function waitFor(assertion: () => void) {
  const deadline = Date.now() + 1000
  let lastError: unknown

  while (Date.now() < deadline) {
    try {
      assertion()
      return
    } catch (error) {
      lastError = error
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })
    }
  }

  throw lastError
}

function mockSuccessfulAnalytics() {
  vi.mocked(getAnalyticsRealtime).mockResolvedValue({
    activeUsers: 3,
    recentViews: 9,
    recentEvents: 12,
    activePages: [{ path: '/schedule', title: 'Schedule Table', activeUsers: 2 }],
    events: [{ eventName: 'app_download_click', count: 4 }],
    refreshedAt: '2026-08-09T00:00:00.000Z',
  })
  vi.mocked(getAnalyticsOverview).mockResolvedValue(createOverview())
  vi.mocked(getAnalyticsPages).mockResolvedValue({
    range: '7d',
    items: [{ path: '/schedule', title: 'Schedule Table', views: 20, users: 10 }],
    refreshedAt: '2026-08-09T00:00:00.000Z',
  })
  vi.mocked(getAnalyticsEvents).mockResolvedValue({
    range: '7d',
    customEvents: {
      appDownloadClicks: 4,
      scheduleDateChanges: 5,
      blogArticleViews: 6,
      blogCategorySelections: 7,
    },
    topEvents: [{ eventName: 'blog_article_view', count: 6 }],
    refreshedAt: '2026-08-09T00:00:00.000Z',
  })
  vi.mocked(getAnalyticsTraffic).mockResolvedValue({
    range: '7d',
    sources: [{ sourceMedium: 'google / organic', users: 9, sessions: 8 }],
    countries: [{ country: 'India', users: 7 }],
    devices: [{ deviceCategory: 'mobile', users: 6 }],
    refreshedAt: '2026-08-09T00:00:00.000Z',
  })
}

function createOverview() {
  return {
    range: '7d' as const,
    users: 10,
    sessions: 8,
    views: 30,
    engagementRate: 0.5,
    averageEngagementTimeSeconds: 22,
    refreshedAt: '2026-08-09T00:00:00.000Z',
  }
}
