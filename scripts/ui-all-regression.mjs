import { spawnSync } from 'node:child_process'

const checks = [
  ['ui shell', 'scripts/ui-shell-regression.mjs'],
  ['ui login', 'scripts/ui-login-regression.mjs'],
  ['ui overview', 'scripts/ui-overview-regression.mjs'],
  ['ui advisors', 'scripts/ui-advisors-regression.mjs'],
  ['ui trades/history', 'scripts/ui-trades-history-regression.mjs'],
  ['ui symbols/preview', 'scripts/ui-symbols-preview-regression.mjs'],
  ['ui admin ops', 'scripts/ui-admin-ops-regression.mjs'],
]

const failures = []

for (const [name, scriptPath] of checks) {
  const result = spawnSync(process.execPath, [scriptPath], { stdio: 'inherit' })
  if (result.status !== 0) failures.push(name)
}

if (failures.length) {
  console.error(`UI regression suite failed: ${failures.join(', ')}`)
  process.exit(1)
}

console.log(`UI regression suite passed (${checks.length})`)
