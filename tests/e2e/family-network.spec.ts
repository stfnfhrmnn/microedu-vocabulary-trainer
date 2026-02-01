import { test, expect } from '@playwright/test'

test('parent can create a family network', async ({ page, request }) => {
  const runtimeErrors: string[] = []

  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtimeErrors.push(message.text())
    }
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

  await expect(page.getByText('Einladungscode')).toBeVisible()

  expect(runtimeErrors).toEqual([])
})
