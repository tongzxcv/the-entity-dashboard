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

const inferProfile = sliceBetween('function inferEaProfile', 'function buildClosedHistoryRows')
const advisors = sliceBetween('function AdvisorsPage', 'function SymbolsPage')
const detail = sliceBetween('function AccountDrilldown', 'function AdvisorsPage')
const nameDialog = sliceBetween('function AccountNameDialog', 'function LoginScreen')
const deleteDialog = sliceBetween('function DeleteAccountDialog', 'function CommandPalette')

const checks = [
  {
    name: 'EA risk thresholds remain peak-DD only and use expected boundaries',
    ok:
      inferProfile.includes('const maxDd = accountMaxDrawdown(account, snapshots)') &&
      inferProfile.includes('if (maxDd > 50)') &&
      inferProfile.includes("risk = 'Extreme risk'") &&
      inferProfile.includes('else if (maxDd > 30)') &&
      inferProfile.includes("risk = 'High risk'") &&
      inferProfile.includes('else if (maxDd > 10)') &&
      inferProfile.includes("risk = 'Medium risk'") &&
      !inferProfile.includes('floating'),
  },
  {
    name: 'Advisors imports dialog-capable shadcn primitives',
    ok:
      app.includes("from '@/components/ui/dialog'") &&
      app.includes("from '@/components/ui/tooltip'") &&
      app.includes("from '@/components/ui/badge'") &&
      app.includes("from '@/components/ui/card'"),
  },
  {
    name: 'EA cards use Card composition and Badge status/risk markers',
    ok:
      advisors.includes('<Card') &&
      advisors.includes('<CardHeader') &&
      advisors.includes('<CardContent') &&
      advisors.includes('<Badge') &&
      advisors.includes('risk-') &&
      advisors.includes('StatusBadge'),
  },
  {
    name: 'Advisor admin edit/delete controls use tooltip icon buttons',
    ok:
      advisors.includes('TooltipTrigger asChild') &&
      advisors.includes('variant="ghost"') &&
      advisors.includes('size="icon"') &&
      advisors.includes('Edit display name') &&
      advisors.includes('Delete portfolio'),
  },
  {
    name: 'Selected EA detail uses Card composition and Badge profile header',
    ok:
      detail.includes('<Card') &&
      detail.includes('<CardHeader') &&
      detail.includes('<CardContent') &&
      detail.includes('<CardTitle') &&
      detail.includes('<Badge') &&
      detail.includes('Selected Expert Advisor'),
  },
  {
    name: 'Rename and delete confirmations are composed with Dialog',
    ok:
      nameDialog.includes('<Dialog') &&
      nameDialog.includes('<DialogContent') &&
      nameDialog.includes('<DialogTitle') &&
      deleteDialog.includes('<Dialog') &&
      deleteDialog.includes('<DialogContent') &&
      deleteDialog.includes('<DialogTitle') &&
      deleteDialog.includes('DELETE'),
  },
  {
    name: 'Admin-only edit/delete remains gated',
    ok:
      advisors.includes('{isAdmin &&') &&
      app.includes('{isAdmin && <AccountNameDialog') &&
      app.includes('{isAdmin && <DeleteAccountDialog'),
  },
]

const failures = checks.filter((check) => !check.ok)

if (failures.length) {
  console.error('UI advisors regression checks failed:')
  for (const failure of failures) console.error(`- ${failure.name}`)
  process.exit(1)
}

console.log(`UI advisors regression checks passed (${checks.length})`)
