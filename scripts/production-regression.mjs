import { chromium } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.BASE_URL || 'http://161.118.245.238:3000'
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const outputDir = path.resolve(process.env.OUTPUT_DIR || 'qa-production-regression')
const adminPassword = process.env.QA_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
const results = []

const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail })
  if (!passed) throw new Error(`${name}: ${detail}`)
}

async function login(page, username, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  await page.getByPlaceholder('admin or demo').fill(username)
  await page.getByPlaceholder('Enter password').fill(password)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.getByText('What needs your attention?', { exact: true }).waitFor()
}

async function apiStatus(page, route) {
  return (await page.context().request.get(`${baseUrl}${route}`)).status()
}

async function apiDeleteStatus(page, route) {
  return (await page.context().request.delete(`${baseUrl}${route}`)).status()
}

async function dashboardPayload(page) {
  return page.evaluate(async () => (await fetch('/api/dashboard', { credentials: 'include' })).json())
}

async function roleChecks(browser, role, password) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await login(page, role, password)

  const body = await page.locator('body').innerText()
  if (role === 'admin') {
    check('admin sees MT5 Reporter', body.includes('MT5 Reporter'), body.slice(0, 300))
    check('admin sees System Health', body.includes('System Health'), body.slice(0, 300))
    check('admin system API allowed', await apiStatus(page, '/api/system') === 200)
    check('admin delete API exists', await apiDeleteStatus(page, '/api/accounts/__qa_missing_account__') === 404)
    const payload = await dashboardPayload(page)
    check('admin receives real account ids', payload.accounts.some((account) => !String(account.account_number).startsWith('INVESTOR-')))
    await page.keyboard.press('Control+K')
    await page.getByRole('dialog', { name: 'Command palette' }).waitFor()
    const commandText = await page.getByRole('dialog', { name: 'Command palette' }).innerText()
    check('admin command palette shows admin actions', commandText.includes('Open MT5 Reporter') && commandText.includes('Open System Health') && commandText.includes('Sync now'), commandText)
    await page.keyboard.press('Escape')
    await page.getByText('Expert Advisors', { exact: true }).first().click()
    check('admin sees delete portfolio controls', await page.getByRole('button', { name: /Delete .* portfolio/ }).count() > 0)
  } else {
    check('demo hides MT5 Reporter', !body.includes('MT5 Reporter'))
    check('demo hides System Health', !body.includes('System Health'))
    check('demo system API forbidden', await apiStatus(page, '/api/system') === 403)
    check('demo delete API forbidden', await apiDeleteStatus(page, '/api/accounts/__qa_missing_account__') === 403)
    const payload = await dashboardPayload(page)
    const trades = payload.accounts.flatMap((account) => account.open_trades || [])
    check('demo account ids sanitized', payload.accounts.every((account) => String(account.account_number).startsWith('INVESTOR-')))
    check('demo tickets sanitized', trades.every((trade) => String(trade.ticket).startsWith('Trade-')))
    check('demo open prices hidden', trades.every((trade) => trade.open_price == null && trade.current_price == null))
    await page.keyboard.press('Control+K')
    await page.getByRole('dialog', { name: 'Command palette' }).waitFor()
    const commandText = await page.getByRole('dialog', { name: 'Command palette' }).innerText()
    check('demo command palette hides admin actions', !commandText.includes('Open MT5 Reporter') && !commandText.includes('Open System Health') && !commandText.includes('Sync now'), commandText)
    await page.keyboard.press('Escape')
    await page.getByText('Expert Advisors', { exact: true }).first().click()
    check('demo hides delete portfolio controls', await page.getByRole('button', { name: /Delete .* portfolio/ }).count() === 0)
  }

  check(`${role} console errors`, errors.length === 0, errors.join('\n'))
  await page.screenshot({ path: path.join(outputDir, `${role}-desktop-overview.png`), fullPage: false })
  await context.close()
}

async function mobileChecks(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await login(page, 'demo', 'demo')
  await page.getByRole('tab', { name: 'Custom', exact: true }).click()
  await page.getByText('Waiting for date range', { exact: true }).waitFor()
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
  }))
  check('mobile body has no horizontal overflow', widths.body <= widths.viewport + 1, JSON.stringify(widths))
  check('mobile document has no horizontal overflow', widths.document <= widths.viewport + 1, JSON.stringify(widths))
  check('mobile console errors', errors.length === 0, errors.join('\n'))
  await page.screenshot({ path: path.join(outputDir, 'demo-mobile-custom.png'), fullPage: false })
  await context.close()
}

async function historyCustomChecks(browser) {
  for (const cfg of [
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, isMobile: false },
    { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true },
  ]) {
    const context = await browser.newContext({ viewport: cfg.viewport, isMobile: cfg.isMobile })
    const page = await context.newPage()
    const errors = []
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    await login(page, 'demo', 'demo')
    if (cfg.isMobile) {
      await page.getByText('Reports', { exact: true }).click()
    } else {
      await page.getByText('History', { exact: true }).first().click()
    }
    await page.locator('.history-controls [role="combobox"]').first().click()
    await page.getByRole('option', { name: 'Custom', exact: true }).click()
    await page.locator('.history-custom-range input[type="date"]').first().waitFor()
    check(`history custom date inputs visible ${cfg.name}`, await page.locator('.history-custom-range input[type="date"]').count() === 2)
    await page.getByText(/Custom: select dates|Custom: complete dates|Custom: invalid range/).waitFor()
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
    }))
    check(`history custom no body overflow ${cfg.name}`, widths.body <= widths.viewport + 1, JSON.stringify(widths))
    check(`history custom no document overflow ${cfg.name}`, widths.document <= widths.viewport + 1, JSON.stringify(widths))
    check(`history custom console errors ${cfg.name}`, errors.length === 0, errors.join('\n'))
    await page.screenshot({ path: path.join(outputDir, `history-custom-${cfg.name}.png`), fullPage: false })
    await context.close()
  }
}

await fs.mkdir(outputDir, { recursive: true })
const browser = await chromium.launch({ executablePath: chromePath, headless: true })
let failure = null
try {
  check('admin QA password configured', Boolean(adminPassword), 'Set QA_ADMIN_PASSWORD or ADMIN_PASSWORD before running production regression.')
  await roleChecks(browser, 'admin', adminPassword)
  await roleChecks(browser, 'demo', 'demo')
  await mobileChecks(browser)
  await historyCustomChecks(browser)
} catch (error) {
  failure = error
} finally {
  await browser.close()
}

const summary = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  passed: !failure && results.every((result) => result.passed),
  results,
  failure: failure?.message || null,
}
await fs.writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
if (failure) process.exitCode = 1
