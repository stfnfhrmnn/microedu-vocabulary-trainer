import { test, expect } from '@playwright/test'

test('parent can create a family network', async ({ page, request }) => {
  const runtimeErrors: string[] = []
  const runtimeErrorPromises: Promise<void>[] = []

  page.on('pageerror', (error) => {
    runtimeErrors.push(`pageerror: ${error.stack || error.message}`)
  })
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const capture = Promise.all(
      message.args().map((arg) => arg.jsonValue().catch(() => '[unserializable]'))
    ).then((args) => {
      const location = message.location()
      runtimeErrors.push(
        `console.error: ${message.text()} | ${JSON.stringify(args)} | ${location.url}:${location.lineNumber}:${location.columnNumber}`
      )
    })
    runtimeErrorPromises.push(capture)
  })

  const unique = Date.now()
  const registerResponse = await request.post('/api/auth/register', {
    data: {
      name: `E2E Parent ${unique}`,
      avatar: '🧪',
    },
  })

  expect(registerResponse.ok()).toBeTruthy()
  const registerData = await registerResponse.json()

  const syncState = {
    state: {
      lastSyncTime: null,
      isRegistered: true,
      serverUserId: registerData.user.id,
      hasSeenCodePrompt: true,
    },
    version: 0,
  }

  await page.addInitScript(() => {
    const store = window as Window & { __e2eErrors?: unknown[] }
    store.__e2eErrors = []
    window.addEventListener('error', (event) => {
      store.__e2eErrors?.push({
        type: 'error',
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      })
    })
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason
      store.__e2eErrors?.push({
        type: 'unhandledrejection',
        message: reason?.message || String(reason),
        stack: reason?.stack,
      })
    })
  })

  await page.addInitScript(
    ({ token, syncState }) => {
      localStorage.setItem('sync-auth-token', token)
      localStorage.setItem('vocabulary-trainer-sync', JSON.stringify(syncState))
    },
    { token: registerData.token, syncState }
  )

  await page.goto('/networks')

  await page.getByRole('button', { name: 'Neu' }).click()
  await page.getByRole('button', { name: /Familie/ }).click()
  await page.getByRole('button', { name: /Elternteil/ }).click()
  await page.getByLabel('Name des Netzwerks').fill(`Familie Test ${unique}`)
  await page.getByRole('button', { name: 'Netzwerk erstellen' }).click()

  await expect(page.getByText('Einladungscode', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Fertig' }).click()
  await expect(page.getByRole('link', { name: new RegExp(`Familie Test ${unique}`) })).toBeVisible()
  await page.getByRole('link', { name: new RegExp(`Familie Test ${unique}`) }).click()
  await expect(page.getByText('Code:')).toBeVisible()

  await Promise.all(runtimeErrorPromises)
  const windowErrors = await page.evaluate(() => (window as Window & { __e2eErrors?: unknown[] }).__e2eErrors || [])
  if (windowErrors.length > 0) {
    runtimeErrors.push(`windowErrors: ${JSON.stringify(windowErrors)}`)
  }
  expect(runtimeErrors).toEqual([])
})
