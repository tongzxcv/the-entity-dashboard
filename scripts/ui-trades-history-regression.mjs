import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const app = readFileSync(join(root, 'src', 'App.jsx'), 'utf8')

function sliceBetween(startMarker, endMarker) {
  const start = app.indexOf(startMarker)
  const end = app.indexOf(endMarker, start)
  return start >= 0 && end > start ? app.slice(start, end) : ''
}

const dataTableShell = sliceBetween('function DataTableShell', 'function DataFreshnessStat')
const responsiveTradeRows = sliceBetween('function ResponsiveTradeRows', 'function ResponsiveHistoryRows')
const responsiveHistoryRows = sliceBetween('function ResponsiveHistoryRows', 'function DataTableShell')
const trades = sliceBetween('function TradesPage', 'function marginLevel')
const history = sliceBetween('function HistoryPage', 'function ConfigField')

const checks = [
  {
    name: 'Trades and history import shadcn table and form primitives',
    ok:
      app.includes("from '@/components/ui/table'") &&
      app.includes("from '@/components/ui/select'") &&
      app.includes("from '@/components/ui/input'") &&
      app.includes("from '@/components/ui/button'") &&
      app.includes("from '@/components/ui/card'") &&
      app.includes("from '@/components/ui/badge'"),
  },
  {
    name: 'Shared DataTableShell wraps tables in Card composition',
    ok:
      dataTableShell.includes('<Card') &&
      dataTableShell.includes('<CardHeader') &&
      dataTableShell.includes('<CardContent') &&
      dataTableShell.includes('data-table-shell') &&
      dataTableShell.includes('mobileRows'),
  },
  {
    name: 'Active trades use shadcn Table and mobile card rows',
    ok:
      trades.includes('<DataTableShell') &&
      trades.includes('<Table') &&
      trades.includes('<TableHeader') &&
      trades.includes('<TableBody') &&
      trades.includes('<TableRow') &&
      trades.includes('<ResponsiveTradeRows') &&
      responsiveTradeRows.includes('<Card') &&
      responsiveTradeRows.includes('<Badge') &&
      responsiveTradeRows.includes("isAdmin ? `#${trade.ticket}` : `Trade ${index + 1}`"),
  },
  {
    name: 'History uses shadcn Table and mobile card rows',
    ok:
      history.includes('<DataTableShell') &&
      history.includes('<Table') &&
      history.includes('<TableHeader') &&
      history.includes('<TableBody') &&
      history.includes('<TableRow') &&
      history.includes('<ResponsiveHistoryRows') &&
      responsiveHistoryRows.includes('<Card') &&
      responsiveHistoryRows.includes('<Badge'),
  },
  {
    name: 'Trade and history controls use shadcn Select/Input/Button',
    ok:
      trades.includes('<Select') &&
      trades.includes('<SelectTrigger') &&
      trades.includes('<SelectItem') &&
      trades.includes('<Button') &&
      history.includes('<Select') &&
      history.includes('<Input') &&
      history.includes('<Button'),
  },
  {
    name: 'Admin-only privacy guards remain in trades and history',
    ok:
      trades.includes('{isAdmin && <Button') &&
      trades.includes("{isAdmin && <TableHead>Open Price</TableHead>}") &&
      trades.includes("{isAdmin && <TableCell") &&
      trades.includes("isAdmin ? 'Ticket' : 'Trade'") &&
      history.includes('{isAdmin && <Button') &&
      !history.includes('ticket') &&
      !history.includes('open_price'),
  },
  {
    name: 'Mobile table CSS no longer depends on wide table stacking for these pages',
    ok:
      app.includes('trades-history-table') &&
      app.includes('responsive-row-list') &&
      app.includes('desktop-table-only') &&
      app.includes('mobile-card-only'),
  },
]

const failures = checks.filter((check) => !check.ok)

if (failures.length) {
  console.error('UI trades/history regression checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`UI trades/history regression checks passed (${checks.length})`)
