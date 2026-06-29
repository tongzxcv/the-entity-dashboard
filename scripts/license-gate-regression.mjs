import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const checks = []
const check = (name, condition, detail = '') => {
  checks.push({ name, passed: Boolean(condition), detail })
}

const backend = read('backend/main.py')
const app = read('src/App.jsx')
const docs = read('docs/account-approval-license-gate.md')
const prototype = read('docs/lab/SteadyFlow_LicenseGate_Module.mqh')

check(
  'license check endpoint exists',
  backend.includes('@app.post("/api/ea/license/check")') && backend.includes('def check_ea_license'),
)
check(
  'admin account registry endpoints exist',
    backend.includes('@app.get("/api/admin/accounts")') &&
    backend.includes('@app.post("/api/admin/accounts")') &&
    backend.includes('@app.delete("/api/admin/accounts/{account_id}")') &&
    backend.includes('@app.post("/api/admin/accounts/{account_id}/status")') &&
    backend.includes('@app.get("/api/admin/accounts/{account_id}/audit")') &&
    backend.includes('@app.post("/api/admin/accounts/import-csv")'),
)
check(
  'admin agent token endpoints exist',
  backend.includes('@app.get("/api/admin/agent-tokens")') &&
    backend.includes('@app.post("/api/admin/agent-tokens")') &&
    backend.includes('@app.post("/api/admin/agent-tokens/{token_id}/revoke")') &&
    backend.includes('secrets.token_urlsafe') &&
    backend.includes('REVOKE_AGENT_TOKEN'),
)
check(
  'account registry filters and delete confirmation exist',
  backend.includes('risk_profile: str = ""') &&
    backend.includes('confirm_account_login') &&
    backend.includes('Type the account login to confirm deletion'),
)
check(
  'license tokens are hashed and not logged',
  backend.includes('hash_secret') &&
    backend.includes('EA_LICENSE_API_TOKEN') &&
    backend.includes('token_hash') &&
    !backend.includes('"EA_LICENSE_API_TOKEN":'),
)
check(
  'license check has rate limit guard',
  backend.includes('LICENSE_RATE_BUCKET') && backend.includes('EA_LICENSE_RATE_LIMIT_PER_MINUTE'),
)
check(
  'unregistered license checks auto-register paused accounts',
  backend.includes('def auto_register_license_account') &&
    backend.includes('AUTO_REGISTER_ACCOUNT') &&
    backend.includes("'PAUSED', ?") &&
    backend.includes('account auto-registered and waiting for admin approval'),
)
check(
  'account status audit exists',
  backend.includes('account_audit_log') &&
    backend.includes('write_audit') &&
    backend.includes('STATUS_CHANGE'),
)
check(
  'dashboard enriches approval state',
  backend.includes('approval_status') &&
    backend.includes('last_license_check_at') &&
    backend.includes('allowed_eas'),
)
check(
  'admin account UI is present and admin-only nav exists',
  app.includes('function AdminAccountsPage') &&
    app.includes('function AuditLogPage') &&
    app.includes('IB Accounts') &&
    app.includes('custom EA name') &&
    app.includes('Delete registry account') &&
    app.includes('Agent Tokens') &&
    app.includes('License Check History') &&
    app.includes('Type ${deleteTarget.account_login} to confirm') &&
    app.includes('openHistory(account)') &&
    app.includes('Audit Log') &&
    app.includes('...(isAdmin ? ['),
)
check(
  'docs cover required security and migration scope',
  docs.includes('No trade execution from the web') &&
    docs.includes('No MT5 trade password') &&
    docs.includes('CSV Import Guide') &&
    docs.includes('Security Checklist') &&
    docs.includes('EA Behavior Design'),
)
check(
  'lab prototype is opt-in and has no real token',
  prototype.includes('InpUseWebLicenseGate = false') &&
    prototype.includes('InpEaLicenseToken = ""') &&
    prototype.includes('<dashboard-host>') &&
    !prototype.includes('N603k5392T') &&
    !prototype.includes('EA_LICENSE_API_TOKEN'),
)

const failed = checks.filter((item) => !item.passed)
console.log(JSON.stringify({ passed: failed.length === 0, checks }, null, 2))

if (failed.length) {
  process.exit(1)
}
