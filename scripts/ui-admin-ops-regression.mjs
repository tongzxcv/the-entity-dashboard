import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const app = readFileSync(join(root, 'src', 'App.jsx'), 'utf8')
const css = readFileSync(join(root, 'src', 'App.css'), 'utf8')

function sliceBetween(startMarker, endMarker) {
  const start = app.indexOf(startMarker)
  const end = endMarker ? app.indexOf(endMarker, start) : app.length
  return start >= 0 && end > start ? app.slice(start, end) : ''
}

const configField = sliceBetween('function ConfigField', 'function ReporterPage')
const reporter = sliceBetween('function ReporterPage', 'function ResponsiveHealthRows')
const responsiveHealthRows = sliceBetween('function ResponsiveHealthRows', 'function LogsPage')
const logs = sliceBetween('function LogsPage', 'export default function App')
const commandPalette = sliceBetween('function CommandPalette', 'function PeriodFilter')
const appRoot = sliceBetween('export default function App', null)
const compactRoot = appRoot.replace(/\s+/g, ' ')

const checks = [
  {
    name: 'Admin ops pages import required shadcn primitives',
    ok:
      app.includes("from '@/components/ui/card'") &&
      app.includes("from '@/components/ui/table'") &&
      app.includes("from '@/components/ui/badge'") &&
      app.includes("from '@/components/ui/button'") &&
      app.includes("from '@/components/ui/input'") &&
      app.includes("from '@/components/ui/tooltip'"),
  },
  {
    name: 'ConfigField uses Card/Input/Button/Tooltip and keeps masked default display',
    ok:
      configField.includes('<Card') &&
      configField.includes('<CardHeader') &&
      configField.includes('<CardContent') &&
      configField.includes('<Input') &&
      configField.includes('<Button') &&
      configField.includes('<TooltipProvider') &&
      configField.includes('<TooltipTrigger asChild') &&
      configField.includes('masked && !revealed') &&
      configField.includes('navigator.clipboard.writeText(value)') &&
      configField.includes('disabled={!value || disabled}'),
  },
  {
    name: 'MT5 Reporter page uses Card/Badge/Button downloads while preserving API key privacy guard',
    ok:
      reporter.includes('<Card') &&
      reporter.includes('<CardHeader') &&
      reporter.includes('<CardContent') &&
      reporter.includes('<CardTitle') &&
      reporter.includes('<CardDescription') &&
      reporter.includes('<Badge') &&
      reporter.includes('<Button asChild') &&
      reporter.includes('href={REPORTER_PATH}') &&
      reporter.includes('href={REPORTER_EX5_PATH}') &&
      reporter.includes("value={isAdmin ? mt5Config.api_key : ''}") &&
      reporter.includes('masked') &&
      reporter.includes('disabled={!isAdmin}'),
  },
  {
    name: 'System Health page uses Card metrics and shadcn Table with mobile rows',
    ok:
      logs.includes('<Card') &&
      logs.includes('<CardHeader') &&
      logs.includes('<CardContent') &&
      logs.includes('<Badge') &&
      logs.includes('<DataTableShell') &&
      logs.includes('<Table') &&
      logs.includes('<TableHeader') &&
      logs.includes('<TableBody') &&
      logs.includes('<TableRow') &&
      logs.includes('<ResponsiveHealthRows') &&
      responsiveHealthRows.includes('<Card') &&
      responsiveHealthRows.includes('<Badge'),
  },
  {
    name: 'System Health keeps raw logs hidden and only shows reporter freshness fields',
    ok:
      logs.includes('Internal logs hidden') &&
      logs.includes('Raw server and TFM job logs are no longer shown') &&
      logs.includes('Per-account freshness') &&
      !logs.includes('logrow') &&
      !logs.includes('logs.map'),
  },
  {
    name: 'Admin-only nav and command palette entries remain gated',
    ok:
      appRoot.includes('...(isAdmin ? [') &&
      appRoot.includes('{ id:"reporter", label:"MT5 Reporter"') &&
      appRoot.includes('{ id:"logs",     label:"System Health"') &&
      commandPalette.includes('const admin = isAdmin ? [') &&
      commandPalette.includes('Open MT5 Reporter') &&
      commandPalette.includes('Open System Health') &&
      commandPalette.includes('Sync now'),
  },
  {
    name: 'System/log fetching still runs only inside admin branches',
    ok:
      compactRoot.includes('if (isAdmin) { fetchSystem() fetchLogs() }') &&
      compactRoot.includes("if (isAdmin) { fetchSystem() if (page === 'logs') fetchLogs() }"),
  },
  {
    name: 'Admin ops mobile table and card overflow guards exist',
    ok:
      app.includes('health-status-table') &&
      app.includes('responsive-row-list') &&
      css.includes('.health-status-table .desktop-table-only') &&
      css.includes('.health-status-table .mobile-card-only') &&
      css.includes('min-width:0') &&
      css.includes('overflow-wrap:anywhere'),
  },
]

const failures = checks.filter((check) => !check.ok)

if (failures.length) {
  console.error('UI admin ops regression checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`UI admin ops regression checks passed (${checks.length})`)
