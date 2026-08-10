import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAuditLogFilterOptions, getAuditLogs } from '../api/audit-logs'
import { Sidebar } from '../components/Sidebar'
import { SystemLogsPage } from './SystemLogsPage'

vi.mock('../api/audit-logs', () => ({
  getAuditLogs: vi.fn(),
  getAuditLogFilterOptions: vi.fn(),
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

describe('SystemLogsPage', () => {
  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    container?.remove()
    root = null
    container = null
    vi.clearAllMocks()
  })

  it('renders audit logs in a read-only table', async () => {
    mockAuditLogs()
    mockFilterOptions()

    renderPage(<SystemLogsPage />)

    expect(text()).toContain('Loading system logs...')
    await waitForText('Blog article "Example" was updated.')
    expect(text()).toContain('admin@example.com')
    expect(text()).toContain('Update Article')
    expect(text()).toContain('Success')
    expect(container!.querySelector('.audit-result-badge.success')).toBeTruthy()
    expect(text()).not.toContain('Delete')
    expect(text()).not.toContain('Edit')
  })

  it('renders loading, empty, and error states', async () => {
    mockFilterOptions()
    vi.mocked(getAuditLogs).mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
    })

    renderPage(<SystemLogsPage />)

    expect(text()).toContain('Loading system logs...')
    await waitForText('No system logs match the current filters.')

    act(() => {
      root?.unmount()
    })
    container?.remove()
    root = null
    container = null

    mockFilterOptions()
    vi.mocked(getAuditLogs).mockRejectedValueOnce(new Error('Logs unavailable'))
    renderPage(<SystemLogsPage />)
    await waitForText('Logs unavailable')
  })

  it('renders dropdown filters, limits actions by module, applies filters, and changes pages', async () => {
    mockAuditLogs()
    mockFilterOptions()

    renderPage(<SystemLogsPage />)
    await waitForText('Blog article "Example" was updated.')

    expect(text()).toContain('All users')
    expect(text()).toContain('All modules')
    expect(text()).toContain('All actions')
    expect(text()).toContain('All resources')
    expect(text()).toContain('Failure')

    const selects = Array.from(container!.querySelectorAll('select'))
    await act(async () => {
      selects[0].value = 'admin@example.com'
      selects[0].dispatchEvent(new Event('change', { bubbles: true }))
      selects[1].value = 'blog'
      selects[1].dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(text()).toContain('Update Article')
    expect(text()).not.toContain('Successful Login')

    await act(async () => {
      selects[2].value = 'blog.article.update'
      selects[2].dispatchEvent(new Event('change', { bubbles: true }))
      selects[3].value = 'success'
      selects[3].dispatchEvent(new Event('change', { bubbles: true }))
      selects[4].value = 'blog_article'
      selects[4].dispatchEvent(new Event('change', { bubbles: true }))
      container!.querySelector('form')!.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      )
    })

    await waitFor(() => {
      expect(getAuditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({
          actor: 'admin@example.com',
          module: 'blog',
          action: 'blog.article.update',
          resourceType: 'blog_article',
          result: 'success',
          page: 1,
        }),
      )
    })

    const nextButton = Array.from(container!.querySelectorAll('button')).find(
      (button) => button.textContent === 'Next',
    )
    expect(nextButton).toBeTruthy()
    await act(async () => {
      nextButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await waitFor(() => {
      expect(getAuditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      )
    })
  })

  it('resets filters and page state', async () => {
    mockAuditLogs()
    mockFilterOptions()

    renderPage(<SystemLogsPage />)
    await waitForText('Blog article "Example" was updated.')

    const selects = Array.from(container!.querySelectorAll('select'))
    await act(async () => {
      selects[1].value = 'blog'
      selects[1].dispatchEvent(new Event('change', { bubbles: true }))
      selects[2].value = 'blog.article.update'
      selects[2].dispatchEvent(new Event('change', { bubbles: true }))
    })

    const resetButton = Array.from(container!.querySelectorAll('button')).find(
      (button) => button.textContent === 'Reset Filters',
    )
    expect(resetButton).toBeTruthy()

    await act(async () => {
      resetButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await waitFor(() => {
      expect(getAuditLogs).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 25,
      })
    })
    expect(selects[1].value).toBe('')
    expect(selects[2].value).toBe('')
  })
})

describe('System Logs navigation', () => {
  afterEach(() => {
    act(() => {
      root?.unmount()
    })
    container?.remove()
    root = null
    container = null
  })

  it('adds the System Logs sidebar entry', () => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)

    act(() => {
      root!.render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>,
      )
    })

    const link = container.querySelector('a[href="/system-logs"]')
    expect(link?.textContent).toContain('System Logs')
  })
})

function renderPage(element: React.ReactNode) {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root!.render(element)
  })
}

function text() {
  return container?.textContent ?? ''
}

function mockAuditLogs() {
  vi.mocked(getAuditLogs).mockResolvedValue({
    items: [
      {
        id: 'audit_1',
        createdAt: '2026-08-09T00:00:00.000Z',
        actorType: 'admin',
        actorId: 'admin@example.com',
        actorUsername: 'admin@example.com',
        actorDisplayName: null,
        actorRole: null,
        action: 'blog.article.update',
        module: 'blog',
        resourceType: 'blog_article',
        resourceId: '1',
        resourceDisplayName: 'Example',
        description: 'Blog article "Example" was updated.',
        result: 'success',
        metadata: null,
        ipAddress: '127.0.0.1',
        userAgent: null,
        requestId: null,
      },
    ],
    pagination: { page: 1, pageSize: 25, total: 26, totalPages: 2 },
  })
}

function mockFilterOptions() {
  vi.mocked(getAuditLogFilterOptions).mockResolvedValue({
    actors: ['admin@example.com', 'editor@example.com'],
    modules: ['auth', 'blog', 'planetary_hours', 'app_distribution'],
    actions: [
      { value: 'auth.login.success', module: 'auth' },
      { value: 'auth.login.failure', module: 'auth' },
      { value: 'blog.article.update', module: 'blog' },
      { value: 'planetary_hours.day_content_update', module: 'planetary_hours' },
      { value: 'app_distribution.apk_upload', module: 'app_distribution' },
    ],
    resourceTypes: ['admin_session', 'blog_article', 'planetary_hour_day'],
  })
}

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
