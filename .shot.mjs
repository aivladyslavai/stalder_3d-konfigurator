import { chromium } from '/Users/vladyslav.katash/4b/node_modules/playwright/index.mjs'

const browser = await chromium.launch({
  executablePath:
    process.env.HOME +
    '/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(18000)
await page.screenshot({ path: 'g-land-wide.png', clip: { x: 340, y: 70, width: 940, height: 660 } })
await page.screenshot({ path: 'g-land.png' })
console.log('ERRORS', errors.slice(0, 8))
await browser.close()
