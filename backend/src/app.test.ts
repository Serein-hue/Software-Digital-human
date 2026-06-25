import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createApp } from './app.js'

async function withTestServer<T>(run: (baseUrl: string) => Promise<T>): Promise<T> {
  const server = createServer(createApp())

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })

  try {
    const { port } = server.address() as AddressInfo
    return await run(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

function restoreEnv(name: string, previous: string | undefined) {
  if (previous === undefined) {
    delete process.env[name]
    return
  }
  process.env[name] = previous
}

describe('backend API', () => {
  it('wraps spot lists in a paginated response envelope', async () => {
    await withTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/spots?page=1&page_size=3`)
      const body = await response.json()

      assert.equal(response.status, 200)
      assert.equal(body.code, 0)
      assert.equal(body.message, 'success')
      assert.equal(body.data.items.length, 3)
      assert.equal(body.data.pagination.page, 1)
      assert.equal(body.data.pagination.page_size, 3)
      assert.equal(body.data.pagination.total, 8)
      assert.equal(body.data.pagination.total_pages, 3)
      assert.match(body.trace_id, /^trace_/)
    })
  })

  it('wraps route lists in a paginated response envelope', async () => {
    await withTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/routes?limit=2`)
      const body = await response.json()

      assert.equal(response.status, 200)
      assert.equal(body.code, 0)
      assert.equal(body.message, 'success')
      assert.equal(body.data.items.length, 2)
      assert.equal(body.data.pagination.page, 1)
      assert.equal(body.data.pagination.page_size, 2)
      assert.equal(body.data.pagination.total, 3)
      assert.match(body.trace_id, /^trace_/)
    })
  })

  it('filters spot lists by category and search text', async () => {
    await withTestServer(async (baseUrl) => {
      const allResponse = await fetch(`${baseUrl}/api/spots?page_size=8`)
      const allBody = await allResponse.json()
      const target = allBody.data.items[3]

      const response = await fetch(
        `${baseUrl}/api/spots?category=${encodeURIComponent(target.category)}&search=${encodeURIComponent(target.name)}`,
      )
      const body = await response.json()

      assert.equal(response.status, 200)
      assert.equal(body.code, 0)
      assert.equal(body.data.items.length, 1)
      assert.equal(body.data.items[0].id, target.id)
    })
  })

  it('rejects invalid pagination parameters', async () => {
    await withTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/spots?page=0&page_size=999`)
      const body = await response.json()

      assert.equal(response.status, 400)
      assert.equal(body.code, 10001)
      assert.equal(body.message, 'page must be >= 1 and page_size must be between 1 and 50')
      assert.equal(body.data, null)
      assert.match(body.trace_id, /^trace_/)
    })
  })

  it('rejects chat requests with blank questions', async () => {
    await withTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '   ' }),
      })
      const body = await response.json()

      assert.equal(response.status, 400)
      assert.equal(body.code, 10001)
      assert.equal(body.message, 'question is required')
      assert.equal(body.data, null)
      assert.match(body.trace_id, /^trace_/)
    })
  })

  it('returns a deterministic low-confidence fallback for unknown questions', async () => {
    await withTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'not a known tourism question' }),
      })
      const body = await response.json()

      assert.equal(response.status, 200)
      assert.equal(body.code, 0)
      assert.equal(body.data.confidence, 'low')
      assert.equal(typeof body.data.answer, 'string')
      assert.ok(body.data.answer.length > 0)
      assert.match(body.trace_id, /^trace_/)
    })
  })

  it('returns 404 for unknown API routes', async () => {
    await withTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/not-real`)
      const body = await response.json()

      assert.equal(response.status, 404)
      assert.equal(body.code, 10002)
      assert.equal(body.message, 'Not found')
      assert.equal(body.data, null)
      assert.match(body.trace_id, /^trace_/)
    })
  })

  it('wraps resource not-found responses in the error envelope', async () => {
    await withTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/spots/not-found`)
      const body = await response.json()

      assert.equal(response.status, 404)
      assert.equal(body.code, 10002)
      assert.equal(body.message, 'Spot not found')
      assert.equal(body.data, null)
      assert.match(body.trace_id, /^trace_/)
    })
  })

  it('adds freshness metadata to realtime analytics', async () => {
    await withTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/analytics/realtime`)
      const body = await response.json()

      assert.equal(response.status, 200)
      assert.equal(body.code, 0)
      assert.equal(body.data.dataSource, 'static-demo')
      assert.equal(body.data.refreshIntervalSeconds, 5)
      assert.match(body.data.updatedAt, /^\d{4}-\d{2}-\d{2}T/)
      assert.match(body.trace_id, /^trace_/)
    })
  })

  it('discloses the analytics data source and freshness on the aggregate endpoint', async () => {
    await withTestServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/analytics`)
      const body = await response.json()

      assert.equal(response.status, 200)
      assert.equal(body.code, 0)
      assert.equal(body.data.dataSource, 'static-demo')
      assert.equal(body.data.refreshIntervalSeconds, 300)
      assert.match(body.data.updatedAt, /^\d{4}-\d{2}-\d{2}T/)
      assert.match(body.trace_id, /^trace_/)
    })
  })

  it('allows configured CORS origins', async () => {
    const previous = process.env.CORS_ORIGINS
    process.env.CORS_ORIGINS = 'http://localhost:5173'

    try {
      await withTestServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/health`, {
          headers: { Origin: 'http://localhost:5173' },
        })

        assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173')
      })
    } finally {
      restoreEnv('CORS_ORIGINS', previous)
    }
  })

  it('does not emit wildcard CORS headers for unknown origins', async () => {
    const previous = process.env.CORS_ORIGINS
    process.env.CORS_ORIGINS = 'http://localhost:5173'

    try {
      await withTestServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/health`, {
          headers: { Origin: 'https://evil.example' },
        })

        assert.equal(response.headers.get('access-control-allow-origin'), null)
      })
    } finally {
      restoreEnv('CORS_ORIGINS', previous)
    }
  })
})
