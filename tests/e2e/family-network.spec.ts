import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

async function registerUser(request: APIRequestContext, name: string) {
  const response = await request.post('/api/auth/register', {
    data: {
      name,
      avatar: '🧪',
    },
  })
  expect(response.ok()).toBeTruthy()
  return response.json()
}

async function seedAuthState(
  page: Page,
  token: string,
  userId: string
) {
  const syncState = {
    state: {
      lastSyncTime: null,
      isRegistered: true,
      serverUserId: userId,
      hasSeenCodePrompt: true,
    },
    version: 0,
  }

  await page.addInitScript(
    ({ token, syncState }) => {
      localStorage.setItem('sync-auth-token', token)
      localStorage.setItem('vocabulary-trainer-sync', JSON.stringify(syncState))
    },
    { token, syncState }
  )
}

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
  const registerData = await registerUser(request, `E2E Parent ${unique}`)

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

  await seedAuthState(page, registerData.token, registerData.user.id)

  await page.goto('/networks')

  await page.getByRole('button', { name: 'Neu' }).click()
  await page.getByRole('button', { name: /Familie/ }).click()
  await page.getByRole('button', { name: /Elternteil/ }).click()
  await page.getByLabel('Name des Netzwerks').fill(`Familie Test ${unique}`)
  await page.getByRole('button', { name: 'Netzwerk erstellen' }).click()

  await expect(page.getByText('Einladungscode (6-stellig)')).toBeVisible()

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

test('parent and child can complete family setup handoff through the wizard', async ({
  browser,
  request,
}) => {
  test.setTimeout(90_000)
  const unique = Date.now()
  const parentData = await registerUser(request, `Wizard Parent ${unique}`)
  const childData = await registerUser(request, `Wizard Child ${unique}`)

  const parentContext = await browser.newContext()
  const childContext = await browser.newContext()
  const parentPage = await parentContext.newPage()
  const childPage = await childContext.newPage()

  try {
    const familyName = `Wizard Familie ${unique}`
    await seedAuthState(parentPage, parentData.token, parentData.user.id)
    await seedAuthState(childPage, childData.token, childData.user.id)

    await parentPage.goto('/settings')
    await parentPage.getByRole('button', { name: 'Familie einrichten' }).click()
    await parentPage.getByRole('button', { name: 'Ich bin ein Elternteil' }).click()

    await expect(
      parentPage.getByText('Einstellungen → Gemeinsam lernen → Familie einrichten → Ich bin das Kind')
    ).toBeVisible()
    await parentPage.getByPlaceholder('z.B. Familie Müller').fill(familyName)
    await parentPage.getByRole('button', { name: 'Familie erstellen' }).click()

    const inviteCodeRaw = (
      await parentPage
        .locator('p', { hasText: 'Einladungscode (6-stellig)' })
        .locator('xpath=following-sibling::div//span')
        .first()
        .textContent()
    )?.trim()
    expect(inviteCodeRaw).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/)
    const inviteCode = inviteCodeRaw || ''

    await expect(parentPage.getByText('Einladungscode (6-stellig)')).toBeVisible()
    await parentPage.getByRole('button', { name: 'Fertig' }).click()

    await childPage.goto('/settings')
    await childPage.getByRole('button', { name: 'Familie einrichten' }).click()
    await childPage.getByRole('button', { name: 'Ich bin das Kind' }).click()

    await expect(childPage.getByText(/Netzwerkcode:\s*XXX-XXX/i)).toBeVisible()

    await childPage.getByPlaceholder('XXX-XXX').fill(inviteCode)
    await childPage.getByPlaceholder('z.B. Max').fill('Kiddo')
    const joinResponsePromise = childPage.waitForResponse(
      (response) =>
        response.url().includes('/api/networks/join') &&
        response.request().method() === 'POST'
    )
    await childPage.getByRole('button', { name: 'Familie beitreten' }).click()
    const joinResponse = await joinResponsePromise
    expect(joinResponse.ok()).toBeTruthy()
    const joinPayload = await joinResponse.json()
    expect(joinPayload.success).toBeTruthy()

    const networkResponse = await request.get(`/api/networks/${joinPayload.network.id}`, {
      headers: {
        Authorization: `Bearer ${parentData.token}`,
      },
    })
    expect(networkResponse.ok()).toBeTruthy()
    const networkPayload = await networkResponse.json()
    expect(
      networkPayload.network.members.some(
        (member: { role: string; nickname: string }) =>
          member.role === 'child' && member.nickname === 'Kiddo'
      )
    ).toBeTruthy()

    await parentPage.goto('/networks')
    await parentPage.getByRole('link', { name: new RegExp(familyName) }).click()
    await expect(parentPage.getByText('Code:')).toBeVisible()
  } finally {
    await parentContext.close()
    await childContext.close()
  }
})
