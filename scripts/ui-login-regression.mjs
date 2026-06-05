import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const app = readFileSync(join(root, 'src', 'App.jsx'), 'utf8')
const loginStart = app.indexOf('function LoginScreen')
const loginEnd = app.indexOf('function LoadingSkeleton')
const login = loginStart >= 0 && loginEnd > loginStart ? app.slice(loginStart, loginEnd) : ''

const checks = [
  {
    name: 'Login imports shadcn Card primitives',
    ok: app.includes("from '@/components/ui/card'"),
  },
  {
    name: 'Login imports shadcn Input primitive',
    ok: app.includes("from '@/components/ui/input'"),
  },
  {
    name: 'Login form is composed with Card structure',
    ok:
      login.includes('<Card') &&
      login.includes('<CardHeader') &&
      login.includes('<CardTitle') &&
      login.includes('<CardDescription') &&
      login.includes('<CardContent'),
  },
  {
    name: 'Login uses shadcn Input fields',
    ok:
      login.includes('<Input') &&
      login.includes('autoComplete="username"') &&
      login.includes('autoComplete="current-password"') &&
      login.includes('placeholder="admin or demo"') &&
      login.includes('placeholder="Enter password"'),
  },
  {
    name: 'Login uses shadcn Button actions',
    ok:
      login.includes('<Button') &&
      login.includes('type="submit"') &&
      login.includes('Login') &&
      login.includes('Show') &&
      login.includes('Hide'),
  },
]

const failures = checks.filter((check) => !check.ok)

if (failures.length) {
  console.error('UI login regression checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`UI login regression checks passed (${checks.length})`)
