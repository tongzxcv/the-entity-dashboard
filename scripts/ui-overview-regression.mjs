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

const brokerFilter = sliceBetween('function BrokerAccountFilter', 'function DeleteAccountDialog')
const periodFilter = sliceBetween('function PeriodFilter', 'function WeekendExposureCard')
const overview = sliceBetween('function OverviewPage', 'function MiniLineChart')
const appRoot = sliceBetween('export default function App', '')
const all = appRoot || app.slice(app.indexOf('export default function App'))

const checks = [
  {
    name: 'Overview imports shadcn filter and display primitives',
    ok:
      app.includes("from '@/components/ui/badge'") &&
      app.includes("from '@/components/ui/select'") &&
      app.includes("from '@/components/ui/tabs'"),
  },
  {
    name: 'Broker filter is composed with Card, Button, Badge, and cn',
    ok:
      brokerFilter.includes('<Card') &&
      brokerFilter.includes('<CardHeader') &&
      brokerFilter.includes('<CardContent') &&
      brokerFilter.includes('<Button') &&
      brokerFilter.includes('<Badge') &&
      brokerFilter.includes('cn('),
  },
  {
    name: 'Period filter is composed with Tabs and shadcn Inputs',
    ok:
      periodFilter.includes('<Tabs') &&
      periodFilter.includes('<TabsList') &&
      periodFilter.includes('<TabsTrigger') &&
      periodFilter.includes('<Input') &&
      periodFilter.includes('type="date"'),
  },
  {
    name: 'Overview account tools use shared Select controls',
    ok:
      app.includes('function AccountFilterControls') &&
      app.includes('function DashboardSelect') &&
      app.includes('<Select value={value}') &&
      app.includes('<DashboardSelect value={statusFilter}') &&
      app.includes('<DashboardSelect value={sortMode}') &&
      app.includes('<DashboardSelect value={strategyFilter}') &&
      app.includes('placeholder="Search account"'),
  },
  {
    name: 'Overview KPI cards use MetricCard with Card composition',
    ok:
      app.includes('function MetricCard') &&
      overview.includes('<MetricCard') &&
      app.includes('<Card className="kpi"'),
  },
  {
    name: 'Overview admin-only attention remains gated',
    ok: overview.includes('{isAdmin && <AttentionRequired'),
  },
  {
    name: 'Admin-only pages and sync remain gated',
    ok:
      all.includes('...(isAdmin ? [') &&
      all.includes('{ id:"reporter", label:"MT5 Reporter"') &&
      all.includes('{isAdmin &&') &&
      all.includes('Auto sync') &&
      all.includes('Sync'),
  },
]

const failures = checks.filter((check) => !check.ok)

if (failures.length) {
  console.error('UI overview regression checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`UI overview regression checks passed (${checks.length})`)
