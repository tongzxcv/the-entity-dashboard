import { chromium } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.BASE_URL || 'http://161.118.245.238:3000'
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const outputDir = path.resolve(process.env.OUTPUT_DIR || 'qa-production-license-gate')
const adminPassword = process.env.QA_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
const licenseToken = process.env.EA_LICENSE_API_TOKEN

const qaAccount = {
  account_login: process.env.QA_LICENSE_ACCOUNT_LOGIN || '999000001',
  broker_name: 'QA Broker',
  broker_server: process.env.QA_LICENSE_BROKER_SERVER || 'QA-License-Server',
  account_type: 'demo',
  symbol: 'XAUUSD.c',
  ib_group: 'qa',
  referral_tag: 'production-e2e',
  owner_name: 'License Gate E2E',
  note: 'Synthetic account for production license gate QA. Do not attach live EA.',
  allowed_eas: ['SteadyFlow'],
  allowed_version: 'V1.4 X10 TH',
  allowed_build_hash: '',
  allowed_preset: 'QA',
  risk_profile: 'QA',
  status: 'PAUSED',
  reason: 'production license gate qa bootstrap',
  expiry_date: '',
}

const licensePayload = {
  account_login: qaAccount.account_login,
  broker_server: qaAccount.broker_server,
  symbol: qaAccount.symbol,
  ea_name: 'SteadyFlow',
  ea_version: qaAccount.allowed_version,
  magic: 56789,
  build_hash: '',
  machine_id: 'qa-production-license-gate',
  timestamp: new Date().toISOString(),
}

const results = []
const check = (name, passed, detail = '') => {
  const item = { name, passed: Boolean(passed), detail }
  results.push(item)
  if (!item.passed) throw new Error(`${name}: ${detail}`)
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  await page.getByPlaceholder('admin or demo').fill('admin')
  await page.getByPlaceholder('Enter password').fill(adminPassword)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await page.getByText('What needs your attention?', { exact: true }).waitFor()
}

async function apiJson(page, method, route, body) {
  const response = await page.context().request.fetch(`${baseUrl}${route}`, {
    method,
    data: body,
    headers: { 'Content-Type': 'application/json' },
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { status: response.status(), json }
}

async function licenseCheck(page, token, body = licensePayload) {
  const response = await page.context().request.post(`${baseUrl}/api/ea/license/check`, {
    data: body,
    headers: token
      ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' },
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { status: response.status(), json }
}

async function upsertQaAccount(page) {
  const list = await apiJson(page, 'GET', `/api/admin/accounts?search=${encodeURIComponent(qaAccount.account_login)}`)
  check('admin can list account registry', list.status === 200, JSON.stringify(list.json))
  const existing = (list.json.accounts || []).find(
    (item) => item.account_login === qaAccount.account_login && item.broker_server === qaAccount.broker_server,
  )
  if (!existing) {
    const created = await apiJson(page, 'POST', '/api/admin/accounts', qaAccount)
    check('admin can create QA registry account', created.status === 200, JSON.stringify(created.json))
    return created.json
  }

  const updated = await apiJson(page, 'PUT', `/api/admin/accounts/${existing.id}`, {
    broker_name: qaAccount.broker_name,
    account_type: qaAccount.account_type,
    symbol: qaAccount.symbol,
    ib_group: qaAccount.ib_group,
    referral_tag: qaAccount.referral_tag,
    owner_name: qaAccount.owner_name,
    note: qaAccount.note,
    allowed_eas: qaAccount.allowed_eas,
    allowed_version: qaAccount.allowed_version,
    allowed_build_hash: qaAccount.allowed_build_hash,
    allowed_preset: qaAccount.allowed_preset,
    risk_profile: qaAccount.risk_profile,
    expiry_date: '',
  })
  check('admin can update QA registry account', updated.status === 200, JSON.stringify(updated.json))
  return updated.json
}

async function setStatus(page, accountId, status, reason) {
  const response = await apiJson(page, 'POST', `/api/admin/accounts/${accountId}/status`, { status, reason })
  check(`status change to ${status}`, response.status === 200, JSON.stringify(response.json))
  return response.json
}

async function setExpiry(page, accountId, expiryDate) {
  const response = await apiJson(page, 'PUT', `/api/admin/accounts/${accountId}`, { expiry_date: expiryDate })
  check(`set expiry ${expiryDate || 'blank'}`, response.status === 200, JSON.stringify(response.json))
  return response.json
}

async function expectDecision(page, expected) {
  const response = await licenseCheck(page, licenseToken)
  check(`${expected.status} license HTTP 200`, response.status === 200, JSON.stringify(response.json))
  check(`${expected.status} status`, response.json.status === expected.status, JSON.stringify(response.json))
  check(`${expected.status} allow_new_entries`, response.json.allow_new_entries === expected.allow_new_entries, JSON.stringify(response.json))
  check(`${expected.status} allow_manage_existing`, response.json.allow_manage_existing === expected.allow_manage_existing, JSON.stringify(response.json))
  check(`${expected.status} allow_close_existing`, response.json.allow_close_existing === expected.allow_close_existing, JSON.stringify(response.json))
  return response.json
}

await fs.mkdir(outputDir, { recursive: true })

let failure = null
const browser = await chromium.launch({ executablePath: chromePath, headless: true })
try {
  check('admin QA password configured', Boolean(adminPassword), 'Set QA_ADMIN_PASSWORD or ADMIN_PASSWORD.')
  check('EA license token configured', Boolean(licenseToken), 'Set EA_LICENSE_API_TOKEN. Do not commit it.')

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  await login(page)

  const missingToken = await licenseCheck(page, '')
  check('missing license token rejected', missingToken.status === 401, JSON.stringify(missingToken.json))
  const invalidToken = await licenseCheck(page, 'invalid-production-license-token')
  check('invalid license token rejected', invalidToken.status === 401, JSON.stringify(invalidToken.json))

  const unregistered = await licenseCheck(page, licenseToken, {
    ...licensePayload,
    account_login: '999000002',
    machine_id: 'qa-production-license-gate-unregistered',
  })
  check('unregistered account auto-registers paused', unregistered.status === 200 && unregistered.json.status === 'PAUSED', JSON.stringify(unregistered.json))
  check('unregistered account blocks new entries', unregistered.json.allow_new_entries === false, JSON.stringify(unregistered.json))
  const autoRegistered = await apiJson(page, 'GET', '/api/admin/accounts?search=999000002')
  check(
    'auto-registered account appears in registry',
    autoRegistered.status === 200 && (autoRegistered.json.accounts || []).some((item) => item.account_login === '999000002' && item.status === 'PAUSED'),
    JSON.stringify(autoRegistered.json),
  )

  const account = await upsertQaAccount(page)
  await setExpiry(page, account.id, '')

  await setStatus(page, account.id, 'APPROVED', 'qa approve account for license matrix')
  await expectDecision(page, {
    status: 'APPROVED',
    allow_new_entries: true,
    allow_manage_existing: true,
    allow_close_existing: true,
  })

  await setStatus(page, account.id, 'PAUSED', 'qa pause new entries')
  await expectDecision(page, {
    status: 'PAUSED',
    allow_new_entries: false,
    allow_manage_existing: true,
    allow_close_existing: true,
  })

  await setStatus(page, account.id, 'BLOCKED', 'qa block account')
  await expectDecision(page, {
    status: 'BLOCKED',
    allow_new_entries: false,
    allow_manage_existing: true,
    allow_close_existing: true,
  })

  await setStatus(page, account.id, 'APPROVED', 'qa approve before expiry test')
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  await setExpiry(page, account.id, yesterday)
  await expectDecision(page, {
    status: 'BLOCKED',
    allow_new_entries: false,
    allow_manage_existing: true,
    allow_close_existing: true,
  })

  await setExpiry(page, account.id, '')
  await setStatus(page, account.id, 'PAUSED', 'qa complete reset to paused')
  const finalPaused = await expectDecision(page, {
    status: 'PAUSED',
    allow_new_entries: false,
    allow_manage_existing: true,
    allow_close_existing: true,
  })
  check('paused message returned', finalPaused.message.includes('paused'), JSON.stringify(finalPaused))

  const audit = await apiJson(page, 'GET', `/api/admin/accounts/${account.id}/audit`)
  check('account audit readable', audit.status === 200, JSON.stringify(audit.json))
  const actions = (audit.json.audit || []).map((item) => `${item.action}:${item.new_status}`)
  for (const expectedAction of [
    'STATUS_CHANGE:APPROVED',
    'STATUS_CHANGE:PAUSED',
    'STATUS_CHANGE:BLOCKED',
    'LICENSE_CHECK:APPROVED',
    'LICENSE_CHECK:BLOCKED',
  ]) {
    check(`audit includes ${expectedAction}`, actions.includes(expectedAction), actions.join(', '))
  }

  await page.screenshot({ path: path.join(outputDir, 'admin-license-gate-qa.png'), fullPage: false })
  await context.close()
} catch (error) {
  failure = error
} finally {
  await browser.close()
}

const summary = {
  baseUrl,
  generatedAt: new Date().toISOString(),
  account_login: qaAccount.account_login,
  broker_server: qaAccount.broker_server,
  passed: !failure && results.every((result) => result.passed),
  results,
  failure: failure?.message || null,
}

await fs.writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
if (failure) process.exitCode = 1
