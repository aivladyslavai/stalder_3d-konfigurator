import { chromium } from '/Users/vladyslav.katash/4b/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath:
    process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []
const logs = []
page.on('pageerror', (e) => errors.push(String(e.stack || e)))
page.on('console', (m) => {
  if (m.type() === 'error') logs.push(m.text())
})
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(5000)
const before = await page.locator('body').innerText().catch((e) => String(e))
await page.getByRole('button', { name: 'Abdeckung' }).click({ timeout: 8000 })
await page.getByRole('button', { name: 'Rollladen Polycarbonat' }).click({ timeout: 8000 })
await page.waitForTimeout(8000)
await page.screenshot({ path: 'g-roll-full.png' })
const after = await page.locator('body').innerText().catch((e) => String(e))
console.log(JSON.stringify({ errors, logs: logs.slice(0, 12), before: before.slice(0, 200), after: after.slice(0, 400) }, null, 2))
await browser.close()
