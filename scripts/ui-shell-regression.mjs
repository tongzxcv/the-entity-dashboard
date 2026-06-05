import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const app = readFileSync(join(root, 'src', 'App.jsx'), 'utf8')

const checks = [
  {
    name: 'App shell imports shadcn shell primitives',
    ok:
      app.includes("from '@/components/ui/button'") &&
      app.includes("from '@/components/ui/sheet'") &&
      app.includes("from '@/components/ui/switch'") &&
      app.includes("from '@/components/ui/tooltip'"),
  },
  {
    name: 'App shell uses cn for conditional navigation classes',
    ok: app.includes("from '@/lib/utils'") && app.includes('cn('),
  },
  {
    name: 'Admin-only pages remain gated in navigation',
    ok:
      app.includes('...(isAdmin ? [') &&
      app.includes('{ id:"reporter", label:"MT5 Reporter"') &&
      app.includes('{ id:"logs",     label:"System Health"'),
  },
  {
    name: 'Sync and auto sync remain admin-only',
    ok:
      app.includes('{isAdmin &&') &&
      app.includes('Auto sync') &&
      app.includes('Sync'),
  },
  {
    name: 'Demo-safe trades still hide ticket and open price',
    ok:
      app.includes("{isAdmin ? 'Ticket' : 'Trade'}") &&
      app.includes("{isAdmin && <th>Open Price</th>}") &&
      app.includes("{isAdmin && <td data-label=\"Open Price\""),
  },
]

const failures = checks.filter((check) => !check.ok)

if (failures.length) {
  console.error('UI shell regression checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`UI shell regression checks passed (${checks.length})`)
