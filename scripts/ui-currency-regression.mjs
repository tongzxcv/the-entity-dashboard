import { readFileSync } from 'node:fs'

const files = {
  app: readFileSync('src/App.jsx', 'utf8'),
  backend: readFileSync('backend/main.py', 'utf8'),
  reporter: readFileSync('public/mt5/MT5DashboardReporter.mq5', 'utf8'),
}

const checks = [
  ['reporter version bumped', files.reporter.includes('#property version   "1.06"')],
  ['reporter has currency override input', files.reporter.includes('AccountCurrencyOverride')],
  ['reporter has rebate lot multiplier input', files.reporter.includes('RebateLotMultiplier')],
  ['reporter auto-scales rebate lots by money scale', files.reporter.includes('EffectiveRebateLotMultiplier') && files.reporter.includes('1.0 / money_scale')],
  ['reporter emits account currency', files.reporter.includes('account_currency')],
  ['reporter emits money scale', files.reporter.includes('money_scale')],
  ['reporter emits rebate lots', files.reporter.includes('daily_rebate_lots') && files.reporter.includes('total_rebate_lots')],
  ['backend stores account currency', files.backend.includes('ADD COLUMN account_currency')],
  ['backend stores money scale', files.backend.includes('ADD COLUMN money_scale')],
  ['backend stores rebate lots', files.backend.includes('ADD COLUMN rebate_lots_total') && files.backend.includes('ADD COLUMN daily_rebate_lots')],
  ['backend resolves rebate lot fallback', files.backend.includes('def resolve_rebate_lots') && files.backend.includes('def resolve_daily_rebate_lots')],
  ['backend scales legacy rebate lots for cent accounts', files.backend.includes('def scaled_rebate_lots') && files.backend.includes('return raw_lots / money_scale') && files.backend.includes('resolve_rebate_lots(data, rebate_rate, rebate_total, money_scale)')],
  ['backend normalizes rebate money from rebate lots', files.backend.includes('rebate_total = rebate_lots_total * rebate_rate') && files.backend.includes('row_daily_rebate = row_daily_rebate_lots * rebate_rate') && files.backend.includes('today_rebate = today_rebate_lots * rebate_rate')],
  ['backend normalizes currency', files.backend.includes('def normalize_account_currency')],
  ['backend parses money scale', files.backend.includes('def parse_money_scale')],
  ['backend preserves existing account scale', files.backend.includes('def resolve_account_money_settings')],
  ['backend only defaults when payload and account scale are missing', files.backend.includes('SELECT account_currency, money_scale FROM accounts')],
  ['frontend normalizes dashboard payload', files.app.includes('function normalizeDashboardPayload')],
  ['frontend applies normalized payload on fetch', files.app.includes('setData(normalizeDashboardPayload(result))')],
  ['frontend documents rebate no-scale rule', files.app.includes('Rebate is paid in USD per lot; do not money-scale')],
  ['frontend displays rebate lots separately', files.app.includes('Rebate Lots') && files.app.includes('rebate_lots')],
]

const failures = checks.filter(([, passed]) => !passed).map(([name]) => name)

if (failures.length) {
  console.error(`Currency regression failed: ${failures.join(', ')}`)
  process.exit(1)
}

console.log(`Currency regression passed (${checks.length})`)
