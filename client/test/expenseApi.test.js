import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as api from '../src/services/expenseApi.js'

// All requests are intercepted here. These tests never contact Express or PostgreSQL.
const id = 'b78a89c1-2335-48ef-b08a-56d8b0c4170e'
const expenseData = {
  title: 'Test expense',
  amount: 250.5,
  category: 'Food',
  expense_date: '2026-11-07',
}
const returnedExpense = {
  ...expenseData,
  id,
  amount: '250.50',
  expense_date: '2026-11-06T18:30:00.000Z',
  created_at: '2026-11-07T10:00:00.000Z',
}

test('expense API helpers use fetch without touching a database', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch })

  await t.test('GET returns the backend expense array', async () => {
    globalThis.fetch = async (path, options) => {
      assert.equal(path, '/api/expenses')
      assert.equal(options?.method || 'GET', 'GET')
      return { ok: true, status: 200, json: async () => [returnedExpense] }
    }
    assert.deepEqual(await api.getExpenses(), [returnedExpense])
  })

  await t.test('POST serializes editable fields and returns the database UUID', async () => {
    globalThis.fetch = async (path, options) => {
      assert.equal(path, '/api/expenses')
      assert.equal(options.method, 'POST')
      assert.equal(new Headers(options.headers).get('Content-Type'), 'application/json')
      assert.deepEqual(JSON.parse(options.body), expenseData)
      assert(!Object.hasOwn(JSON.parse(options.body), 'id'))
      return { ok: true, status: 201, json: async () => returnedExpense }
    }
    assert.deepEqual(await api.createExpense(expenseData), returnedExpense)
  })

  await t.test('PATCH sends the UUID and requested fields, then returns the updated row', async () => {
    const changes = { amount: 300 }
    const updated = { ...returnedExpense, amount: '300.00' }
    globalThis.fetch = async (path, options) => {
      assert.equal(path, `/api/expenses/${id}`)
      assert.equal(options.method, 'PATCH')
      assert.equal(new Headers(options.headers).get('Content-Type'), 'application/json')
      assert.deepEqual(JSON.parse(options.body), changes)
      return { ok: true, status: 200, json: async () => updated }
    }
    assert.deepEqual(await api.updateExpense(id, changes), updated)
  })

  await t.test('DELETE handles 204 without attempting to read JSON', async () => {
    let jsonCalls = 0
    globalThis.fetch = async (path, options) => {
      assert.equal(path, `/api/expenses/${id}`)
      assert.equal(options.method, 'DELETE')
      assert.equal(options.body, undefined)
      return {
        ok: true,
        status: 204,
        async json() {
          jsonCalls += 1
          throw new Error('A 204 response has no JSON body')
        },
      }
    }
    await api.deleteExpense(id)
    assert.equal(jsonCalls, 0)
  })

  const operations = [
    ['GET', () => api.getExpenses()],
    ['POST', () => api.createExpense(expenseData)],
    ['PATCH', () => api.updateExpense(id, { title: 'Changed' })],
    ['DELETE', () => api.deleteExpense(id)],
  ]

  for (const [method, operation] of operations) {
    await t.test(`${method} rejects with the backend's error message`, async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Expense request was rejected' }),
      })
      await assert.rejects(operation, /Expense request was rejected/)
    })

    await t.test(`${method} uses a readable fallback for a non-JSON error response`, async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 502,
        json: async () => { throw new SyntaxError('Unexpected HTML from proxy') },
      })
      await assert.rejects(operation, error => {
        assert(error instanceof Error)
        assert(!(error instanceof SyntaxError))
        assert.match(error.message, /expense/i)
        return true
      })
    })

    await t.test(`${method} rejects when the network fails`, async () => {
      globalThis.fetch = async () => { throw new TypeError('Network request failed') }
      await assert.rejects(operation, /network|failed|expense/i)
    })
  }
})
