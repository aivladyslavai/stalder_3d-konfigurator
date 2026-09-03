import { chromium } from '/Users/vladyslav.katash/4b/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath:
    process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.stack || e)))
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(11000)
await page.locator('button', { hasText: 'Top Ansicht' }).click({ timeout: 8000 })
await page.waitForTimeout(2000)
await page.screenshot({ path: 'g-stair-top.png', clip: { x: 300, y: 70, width: 1000, height: 680 } })
await page.screenshot({ path: 'g-stair-zoom.png', clip: { x: 520, y: 140, width: 360, height: 280 } })
await page.locator('button', { hasText: 'Perspektive' }).click({ timeout: 8000 })
await page.waitForTimeout(1500)
await page.screenshot({ path: 'g-stair.png', clip: { x: 300, y: 70, width: 1000, height: 680 } })
console.log(JSON.stringify({ errors: errors.slice(0, 8) }))
await browser.close()
