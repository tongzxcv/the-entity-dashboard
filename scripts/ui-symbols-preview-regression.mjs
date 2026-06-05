import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const app = readFileSync(join(root, 'src', 'App.jsx'), 'utf8')
const css = readFileSync(join(root, 'src', 'App.css'), 'utf8')

function sliceBetween(startMarker, endMarker) {
  const start = app.indexOf(startMarker)
  const end = app.indexOf(endMarker, start)
  return start >= 0 && end > start ? app.slice(start, end) : ''
}

const responsiveSymbolRows = sliceBetween('function ResponsiveSymbolRows', 'function ResponsiveTradeRows')
const symbols = sliceBetween('function SymbolsPage', 'function TradesPage')
const terminalCard = sliceBetween('function MT5TerminalCard', 'function MT5PreviewPage')
const preview = sliceBetween('function MT5PreviewPage', 'function AlertsPage')

const checks = [
  {
    name: 'Symbols and MT5 preview import required shadcn primitives',
    ok:
      app.includes("from '@/components/ui/card'") &&
      app.includes("from '@/components/ui/table'") &&
      app.includes("from '@/components/ui/badge'") &&
      app.includes("from '@/components/ui/button'") &&
      app.includes("from '@/components/ui/select'"),
  },
  {
    name: 'Symbols summary and exposure cards use Card/Badge composition',
    ok:
      symbols.includes('<MetricCard') &&
      symbols.includes('<Card') &&
      symbols.includes('<CardHeader') &&
      symbols.includes('<CardContent') &&
      symbols.includes('<Badge') &&
      symbols.includes('<Button'),
  },
  {
    name: 'Symbols exposure table uses shadcn Table and mobile card rows',
    ok:
      symbols.includes('<DataTableShell') &&
      symbols.includes('<Table') &&
      symbols.includes('<TableHeader') &&
      symbols.includes('<TableBody') &&
      symbols.includes('<TableRow') &&
      symbols.includes('<ResponsiveSymbolRows') &&
      responsiveSymbolRows.includes('<Card') &&
      responsiveSymbolRows.includes('<Badge'),
  },
  {
    name: 'Symbol numeric classes guard against overflow',
    ok:
      app.includes('symbol-money') &&
      app.includes('symbol-number') &&
      css.includes('overflow-wrap:anywhere') &&
      css.includes('font-variant-numeric:tabular-nums') &&
      css.includes('min-width:0'),
  },
  {
    name: 'MT5 terminal cards use shadcn Card/Button/Badge composition',
    ok:
      terminalCard.includes('<Card') &&
      terminalCard.includes('<CardHeader') &&
      terminalCard.includes('<CardContent') &&
      terminalCard.includes('<Button') &&
      terminalCard.includes('<Badge') &&
      terminalCard.includes('terminal-tag') &&
      terminalCard.includes('terminal-live'),
  },
  {
    name: 'MT5 preview filters and group headers use shadcn controls and badges',
    ok:
      preview.includes('<Card') &&
      preview.includes('<CardHeader') &&
      preview.includes('<CardContent') &&
      preview.includes('<Select') &&
      preview.includes('<SelectTrigger') &&
      preview.includes('<SelectItem') &&
      preview.includes('<Badge') &&
      preview.includes('mt5-group-status'),
  },
  {
    name: 'Mobile-specific symbols/preview layout guards exist',
    ok:
      app.includes('symbols-table') &&
      app.includes('symbol-mobile-row') &&
      css.includes('.symbols-table .mobile-card-only') &&
      css.includes('.terminal-card') &&
      css.includes('.terminal-position'),
  },
]

const failures = checks.filter((check) => !check.ok)

if (failures.length) {
  console.error('UI symbols/preview regression checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`UI symbols/preview regression checks passed (${checks.length})`)
