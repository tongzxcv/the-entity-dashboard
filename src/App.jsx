import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || ''
const INGEST_ENDPOINT = `${window.location.origin}/api/mt5/update`
const REPORTER_PATH = '/mt5/MT5DashboardReporter.mq5'
const REPORTER_EX5_PATH = '/mt5/MT5DashboardReporter.ex5'
const DEFAULT_REBATE_PER_LOT = 10
const EquityAreaChart = React.lazy(() => import('@/components/EquityAreaChart'))

// โ”€โ”€ DESIGN TOKENS โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const C = {
  bg0:"#080C14", bg1:"#0C1220", bg2:"#111926", bg3:"#172433", bg4:"#1E2D40",
  br0:"rgba(200,218,238,0.08)", br1:"rgba(200,218,238,0.14)", br2:"rgba(200,218,238,0.22)",
  acc:"#4E9F96", accD:"rgba(78,159,150,0.11)", accG:"rgba(78,159,150,0.20)",
  grn:"#3DD68C", grnD:"rgba(61,214,140,0.12)",
  red:"#F0607A", redD:"rgba(240,96,122,0.12)",
  blu:"#6EAFF2", yel:"#E5A84B",
  t1:"#F0F4FA", t2:"#A8BDCF", t3:"#738DA8",
  fn:"'JetBrains Mono',monospace",
  fh:"'Chakra Petch',sans-serif",
  fb:"'Outfit',sans-serif",
}

// โ”€โ”€ SVG ICONS โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const Ico = {
  overview: <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1.5"/><rect x="9" y="0.5" width="5.5" height="5.5" rx="1.5"/><rect x="0.5" y="9" width="5.5" height="5.5" rx="1.5"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.5"/></svg>,
  advisors: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7.5" cy="5" r="3"/><path d="M1.5 14c0-3.3 2.7-5 6-5s6 1.7 6 5"/></svg>,
  symbols: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="1,11 4.5,5.5 7.5,8 11,2.5 14,2.5"/></svg>,
  trades: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="0.5" y="3" width="14" height="9" rx="1.5"/><line x1="0.5" y1="6.5" x2="14.5" y2="6.5"/></svg>,
  reporter: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2.5" y="0.5" width="10" height="14" rx="1.5"/><line x1="5.5" y1="4.5" x2="9.5" y2="4.5"/><line x1="5.5" y1="7" x2="9.5" y2="7"/><line x1="5.5" y1="9.5" x2="7.5" y2="9.5"/></svg>,
  logs: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7.5" cy="7.5" r="6.5"/><polyline points="7.5,4 7.5,7.5 10,9" strokeLinecap="round"/></svg>,
  sync: <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11.5 6.5A5 5 0 0 1 2 9.5M1.5 6.5A5 5 0 0 1 11 3.5"/><polyline points="11.5,3.5 11.5,6.5 8.5,6.5"/><polyline points="1.5,9.5 1.5,6.5 4.5,6.5"/></svg>,
  copy: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
  logout: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18"/></svg>,
  lock: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  alert: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  stop: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8l6-6Z"/><path d="M12 8v5"/><path d="M12 17h.01"/></svg>,
  trendUp: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>,
  trendDown: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 7 6 6 4-4 8 8"/><path d="M14 17h7v-7"/></svg>
}

// โ”€โ”€ HELPERS โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const moneyDisplayContext = (signedOrContext, context) => {
  if (typeof signedOrContext === 'boolean') return { signed: signedOrContext, context }
  return { signed: false, context: signedOrContext || context }
}
const moneySymbol = (context) => accountCurrency(context) === 'USC' ? '¢' : '$'
const displayMoneyAmount = (value, context) => {
  const amount = Number(value || 0)
  if (!context || accountCurrency(context) !== 'USC') return amount
  return context.money_normalized ? amount * accountMoneyScale(context) : amount
}
const fmtM = (v, signedOrContext = false, context = null) => {
  const { signed, context: moneyContext } = moneyDisplayContext(signedOrContext, context)
  const num = displayMoneyAmount(v, moneyContext)
  const sign = signed && num > 0 ? "+" : signed && num < 0 ? "-" : ""
  return `${sign}${moneySymbol(moneyContext)}${Math.abs(num).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
const fmtS = (v, context = null) => {
  const num = displayMoneyAmount(v, context)
  return (num >= 0 ? "+" : "-") + moneySymbol(context) + Math.abs(num).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
const pclr = (v) => Number(v || 0) >= 0 ? C.grn : C.red
const hmClr = (v) => {
  if (v === null || v === undefined) return "rgba(255,255,255,0.04)"
  if (v > 10000) return "#2BD47E"
  if (v > 1000)  return "#1BA85E"
  if (v > 0)     return "#0F6E3E"
  return "#F0607A"
}
const formatPercent = (v) => `${Number(v || 0).toFixed(2)}%`
const resourceTone = (value) => {
  const level = Number(value || 0)
  if (level >= 85) return C.red
  if (level >= 70) return C.yel
  return C.acc
}
const fmtLots = (value) => value === null || value === undefined ? '-' : Number(value || 0).toFixed(2)
const pctOfBalance = (value, balance) => Number(balance || 0) ? (Number(value || 0) / Number(balance || 0)) * 100 : 0
const maskAccountNumber = (value) => {
  const str = String(value || '')
  if (str.length <= 4) return str
  return `${str.slice(0, 4)}****${str.slice(-2)}`
}
async function copyToClipboard(value) {
  const text = String(value || '')
  if (!text) return false

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall back below. Production may run over plain HTTP, where Clipboard API is blocked.
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-1000px'
    textarea.style.left = '-1000px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  } catch {
    return false
  }
}
const accountLabel = (account) => String(account?.display_name || '').trim() || maskAccountNumber(account?.account_number)
const brokerKey = (name) => String(name || 'unknown').toLowerCase()
const brokerMeta = (name) => {
  const key = brokerKey(name)
  if (key.includes('interstellar')) return { label: 'InterStellar', logo: 'IS', asset: '/brokers/interstellar-core.png', tone: 'cyan', subtitle: 'InterStellar Financial Group' }
  if (key.includes('tickmill')) return { label: 'Tickmill', logo: 'TM', asset: '/brokers/tickmill.svg', tone: 'red', subtitle: 'Tickmill' }
  if (key.includes('hfm') || key.includes('hf markets') || key.includes('hotforex')) return { label: 'HFM', logo: 'HF', asset: '/brokers/hfm.svg', tone: 'red', subtitle: 'HF Markets' }
  if (key.includes('vtmarkets') || key.includes('vt markets') || key.includes('vt-markets')) return { label: 'VT Markets', logo: 'VT', asset: '/brokers/vt-markets.svg', tone: 'blue', subtitle: 'VT Markets' }
  if (key.includes('vantage') || key.includes('vig group')) return { label: 'Vantage', logo: 'VG', asset: '/brokers/vantage.svg', tone: 'cyan', subtitle: 'Vantage' }
  if (key.includes('ic markets') || key.includes('icmarkets')) return { label: 'IC Markets', logo: 'IC', asset: '/brokers/ic-markets.svg', tone: 'green', subtitle: 'IC Markets' }
  if (key.includes('exness')) return { label: 'Exness', logo: 'ex', asset: '/brokers/exness.svg', tone: 'gold', subtitle: 'Exness' }
  if (key.includes('fp')) return { label: 'FP Markets', logo: 'FP', asset: '/brokers/fp-markets.svg', tone: 'blue', subtitle: 'FP Markets' }
  if (key.includes('xm')) return { label: 'XM', logo: 'XM', asset: '/brokers/xm.svg', tone: 'red', subtitle: 'XM' }
  if (key.includes('pepperstone')) return { label: 'Pepperstone', logo: 'P', asset: '/brokers/pepperstone.svg', tone: 'blue', subtitle: 'Pepperstone' }
  return { label: name || 'Unknown', logo: String(name || '?').slice(0, 2).toUpperCase(), asset: null, tone: 'cyan', subtitle: name || 'Unknown broker' }
}

function getAge(account) {
  if (!account?.last_update) return { level: 'danger', label: 'No data', detail: 'Never updated', seconds: Infinity }
  const parsed = new Date(`${String(account.last_update).replace(' ', 'T')}Z`)
  const seconds = (Date.now() - parsed.getTime()) / 1000
  if (seconds < 330) return { level: 'success', label: 'Live', detail: `${Math.round(seconds)}s ago`, seconds }
  if (seconds < 1800) return { level: 'warning', label: 'Delayed', detail: `${(seconds / 60).toFixed(1)}m ago`, seconds }
  if (seconds < 86400) return { level: 'warning', label: 'Stale', detail: `${(seconds / 3600).toFixed(1)}h ago`, seconds }
  return { level: 'danger', label: 'Offline', detail: '> 1 day ago', seconds }
}

function accountCurrency(account) {
  const explicit = normalizeAccountCurrency(account?.account_currency || account?.currency || account?.accountCurrency)
  if (explicit) return explicit
  const broker = String(account?.broker || '').toLowerCase()
  const number = String(account?.account_number || '')
  if (broker.includes('cent') || number.includes('usc')) return 'USC'
  return 'USD'
}

function normalizeAccountCurrency(value) {
  const currency = String(value || '').trim().toUpperCase()
  if (!currency) return null
  if (currency.includes('USC') || currency.includes('CENT')) return 'USC'
  return currency
}

function accountMoneyScale(account) {
  const explicit = Number(account?.money_scale ?? account?.moneyScale)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  return accountCurrency(account) === 'USC' ? 100 : 1
}

function accountMoneyValue(value, account) {
  const amount = Number(value || 0)
  if (account?.money_normalized) return amount
  return amount / accountMoneyScale(account)
}

function moneyContextForItems(items) {
  const list = (items || []).filter(Boolean)
  const currencies = Array.from(new Set(list.map((item) => accountCurrency(item)).filter(Boolean)))
  if (currencies.length !== 1) return null
  const sample = list.find((item) => accountCurrency(item) === currencies[0]) || { account_currency: currencies[0] }
  return {
    account_currency: currencies[0],
    money_scale: accountMoneyScale(sample),
    money_normalized: sample.money_normalized,
  }
}

function normalizeDashboardPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload

  const accountMeta = new Map()
  const normalizeForAccount = (value, meta) => Number(value || 0) / meta.moneyScale

  const accounts = (payload.accounts || []).map((account) => {
    const currency = accountCurrency(account)
    const moneyScale = accountMoneyScale({ ...account, account_currency: currency })
    const meta = { currency, moneyScale }
    const key = String(account.account_number || '')
    if (key) accountMeta.set(key, meta)

    const normalizedAccount = {
      ...account,
      account_currency: currency,
      money_scale: moneyScale,
      money_normalized: true,
      balance: normalizeForAccount(account.balance, meta),
      equity: normalizeForAccount(account.equity, meta),
      margin: normalizeForAccount(account.margin, meta),
      free_margin: normalizeForAccount(account.free_margin, meta),
      total_closed_pnl: normalizeForAccount(account.total_closed_pnl, meta),
      peak_drawdown_amount: normalizeForAccount(account.peak_drawdown_amount, meta),
      open_trades: (account.open_trades || []).map((trade) => ({
        ...trade,
        account_currency: currency,
        money_scale: moneyScale,
        money_normalized: true,
        profit: normalizeForAccount(trade.profit, meta),
      })),
      daily_history: (account.daily_history || []).map((row) => ({
        ...row,
        account_currency: currency,
        money_scale: moneyScale,
        money_normalized: true,
        daily_profit: normalizeForAccount(row.daily_profit, meta),
      })),
    }

    // Rebate is paid in USD per lot; do not money-scale rebate_total or daily_rebate.
    return normalizedAccount
  })

  const fallbackMeta = { currency: 'USD', moneyScale: 1 }
  const equitySnapshots = (payload.equity_snapshots || []).map((snapshot) => {
    const accountKey = String(snapshot.account_number || '')
    const account = accountMeta.get(accountKey)
    const currency = normalizeAccountCurrency(snapshot.account_currency) || account?.currency || fallbackMeta.currency
    const moneyScale = accountMoneyScale({ account_currency: currency, money_scale: snapshot.money_scale ?? account?.moneyScale })
    const meta = { currency, moneyScale }
    return {
      ...snapshot,
      account_currency: currency,
      money_scale: moneyScale,
      money_normalized: true,
      balance: normalizeForAccount(snapshot.balance, meta),
      equity: normalizeForAccount(snapshot.equity, meta),
      floating: normalizeForAccount(snapshot.floating, meta),
    }
  })

  const totalEquity = accounts.reduce((sum, account) => sum + Number(account.equity || 0), 0)
  const totalFloatingProfit = accounts.reduce(
    (sum, account) => sum + (account.open_trades || []).reduce((tradeSum, trade) => tradeSum + Number(trade.profit || 0), 0),
    0,
  )

  return {
    ...payload,
    accounts,
    equity_snapshots: equitySnapshots,
    summary: {
      ...(payload.summary || {}),
      total_equity: totalEquity,
      total_floating_profit: totalFloatingProfit,
      total_accounts: accounts.length,
      total_open_trades: accounts.reduce((sum, account) => sum + Number(account.open_positions || (account.open_trades || []).length || 0), 0),
    },
  }
}

const PERIOD_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'Last Week' },
  { id: 'month', label: 'Last Month' },
  { id: '3m', label: '3M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1Y' },
  { id: 'custom', label: 'Custom' },
]

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfLocalWeek(date) {
  const start = new Date(date)
  const day = start.getDay() || 7
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - day + 1)
  return start
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function getPeriodRange(period, customStart = '', customEnd = '') {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (period === 'yesterday') {
    const y = addDays(today, -1)
    return { id: period, label: 'Yesterday', start: dateKey(y), end: dateKey(y) }
  }
  if (period === 'week') return { id: period, label: 'Last Week', start: dateKey(addDays(today, -6)), end: dateKey(today) }
  if (period === 'month') return { id: period, label: 'Last Month', start: dateKey(addDays(today, -29)), end: dateKey(today) }
  if (period === '3m') return { id: period, label: '3M', start: dateKey(addDays(today, -89)), end: dateKey(today) }
  if (period === '6m') return { id: period, label: '6M', start: dateKey(addDays(today, -179)), end: dateKey(today) }
  if (period === '1y') return { id: period, label: '1Y', start: dateKey(addDays(today, -364)), end: dateKey(today) }
  if (period === 'custom') {
    if (customStart && customEnd && customStart <= customEnd) {
      return { id: period, label: `${customStart} to ${customEnd}`, start: customStart, end: customEnd, incomplete: false }
    }
    if (customStart && customEnd && customStart > customEnd) {
      return { id: period, label: 'Custom: invalid range', start: customStart, end: customEnd, incomplete: true }
    }
    return { id: period, label: customStart || customEnd ? 'Custom: complete dates' : 'Custom: select dates', start: customStart || null, end: customEnd || null, incomplete: true }
  }
  return { id: 'all', label: 'All Time', start: null, end: null }
}

function rowInPeriod(row, periodRange) {
  if (periodRange?.id === 'custom' && periodRange.incomplete) return false
  if (!periodRange?.start && !periodRange?.end) return true
  const date = String(row?.date || '')
  if (!date) return false
  if (periodRange.start && date < periodRange.start) return false
  if (periodRange.end && date > periodRange.end) return false
  return true
}

function collectHistory(accounts) {
  return accounts.flatMap((account) =>
    (account.daily_history || []).map((row) => ({
      ...row,
      account_number: account.account_number,
      account_currency: account.account_currency,
      money_scale: account.money_scale,
      money_normalized: account.money_normalized,
      name: accountLabel(account),
      broker: account.broker,
      balance: Number(account.balance || 0),
    })),
  )
}

function collectPeriodHistory(accounts, periodRange = null) {
  return collectHistory(accounts).filter((row) => rowInPeriod(row, periodRange))
}

function latestReportingDate(accounts) {
  return collectHistory(accounts)
    .map((row) => String(row.date || ''))
    .filter(Boolean)
    .sort()
    .at(-1) || null
}

function reportingDayLabel(reportingDate) {
  if (!reportingDate) return 'Latest Day'
  return reportingDate === dateKey(new Date()) ? 'Today' : 'Latest Day'
}

function accountOpenLots(account) {
  return (account.open_trades || account.trades || []).reduce((sum, trade) => sum + Number(trade.lots || 0), 0)
}

function numericField(account, keys) {
  for (const key of keys) {
    const value = account?.[key]
    if (value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))) {
      return Number(value)
    }
  }
  return null
}

function latestHistoryRow(account) {
  const history = account?.daily_history || []
  const latestDate = history
    .map((row) => String(row.date || ''))
    .filter(Boolean)
    .sort()
    .at(-1)
  return history.find((row) => String(row.date || '') === latestDate) || null
}

function accountTodayProfit(account) {
  return Number(latestHistoryRow(account)?.daily_profit || 0)
}

function accountTodayTrades(account) {
  return Number(latestHistoryRow(account)?.daily_trades || 0)
}

function accountTodayLots(account) {
  const value = Number(latestHistoryRow(account)?.daily_lots || 0)
  return value > 0 ? value : null
}

function accountClosedProfit(account) {
  const reported = numericField(account, ['total_closed_pnl', 'closed_pnl', 'total_profit', 'total_pnl'])
  if (reported !== null) return reported
  return accountTodayProfit(account)
}

function accountClosedTrades(account) {
  const reported = numericField(account, ['total_closed_trades', 'closed_trades'])
  if (reported !== null) return reported
  return accountTodayTrades(account)
}

function accountClosedLots(account) {
  const reported = numericField(account, ['total_closed_lots', 'closed_lots'])
  if (reported !== null) return reported
  const historyLots = (account.daily_history || []).reduce((sum, row) => sum + Number(row.daily_lots || 0), 0)
  return historyLots > 0 ? historyLots : null
}

function accountRebateRate(account) {
  const reported = numericField(account, ['rebate_rate', 'rebate_per_lot', 'cashback_rate', 'commission_rebate_rate', 'rebate_usd_per_lot'])
  return reported !== null ? reported : DEFAULT_REBATE_PER_LOT
}

function accountReportedRebate(account) {
  return numericField(account, ['rebate', 'rebate_total', 'total_rebate', 'cashback', 'commission_rebate'])
}

function accountRebate(account) {
  const reported = accountReportedRebate(account)
  if (reported !== null) return reported
  return Number(accountClosedLots(account) || 0) * accountRebateRate(account)
}

function rebateLotsFromAmount(rebate, rate) {
  const numericRate = Number(rate || 0)
  if (!numericRate) return null
  const numericRebate = Number(rebate || 0)
  return numericRebate / numericRate
}

function accountRebateLots(account) {
  const reported = numericField(account, ['rebate_lots_total', 'total_rebate_lots', 'rebate_lots'])
  if (reported !== null) return reported
  const rebate = accountReportedRebate(account)
  const inferred = rebateLotsFromAmount(rebate, accountRebateRate(account))
  if (inferred !== null) return inferred
  return accountClosedLots(account)
}

function accountTodayRebate(account) {
  const latest = latestHistoryRow(account)
  const reported = numericField(latest, ['daily_rebate', 'rebate', 'total_rebate'])
  if (reported !== null) return reported
  return Number(latest?.daily_lots || 0) * accountRebateRate(account)
}

function accountTotalLots(account) {
  return Number(accountClosedLots(account) || 0)
}

function accountMaxDrawdown(account, snapshots = []) {
  const accountNumber = String(account.account_number)
  const reportedPeak = numericField(account, ['peak_drawdown_percent', 'max_drawdown_percent'])
  const historicalMax = snapshots
    .filter((snapshot) => String(snapshot.account_number) === accountNumber)
    .reduce((max, snapshot) => Math.max(max, Number(snapshot.drawdown_percent || 0)), 0)
  return Math.max(Number(account.drawdown_percent || 0), historicalMax, Number(reportedPeak || 0))
}

function accountPeakDrawdownAmount(account) {
  return numericField(account, ['peak_drawdown_amount', 'max_drawdown_amount']) || 0
}

function summarize(accounts, snapshots = []) {
  const history = collectHistory(accounts)
  const reportingDate = latestReportingDate(accounts)
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)
  const totalEquity = accounts.reduce((sum, account) => sum + Number(account.equity || 0), 0)
  const floating = totalEquity - totalBalance
  const openTrades = accounts.reduce((sum, account) => sum + Number(account.open_positions || (account.open_trades || []).length || 0), 0)
  const liveAccounts = accounts.filter((account) => getAge(account).seconds < 330).length
  const activeEas = accounts.filter((account) => getAge(account).seconds < 1800).length
  const latestRows = history.filter((row) => row.date === reportingDate)
  const todayPnl = latestRows.reduce((sum, row) => sum + Number(row.daily_profit || 0), 0)
  const todayTrades = latestRows.reduce((sum, row) => sum + Number(row.daily_trades || 0), 0)
  const tradeDays = history.filter((row) => Number(row.daily_trades || 0) > 0)
  const winDays = tradeDays.filter((row) => Number(row.daily_profit || 0) > 0).length
  const overallWinRate = tradeDays.length ? (winDays / tradeDays.length) * 100 : 0
  const maxDrawdown = accounts.reduce((max, account) => Math.max(max, accountMaxDrawdown(account, snapshots)), 0)
  const totalLots = accounts.reduce((sum, account) => sum + accountTotalLots(account), 0)
  return { totalBalance, totalEquity, floating, openTrades, liveAccounts, activeEas, todayPnl, todayTrades, overallWinRate, worstDrawdown: maxDrawdown, maxDrawdown, totalLots, tradeDays: tradeDays.length, reportingDate }
}

function buildPeriodStats(accounts, periodRange = null) {
  const history = collectHistory(accounts)
  const selectedHistory = collectPeriodHistory(accounts, periodRange)
  const reportingDate = latestReportingDate(accounts)
  const referenceDate = reportingDate ? new Date(`${reportingDate}T00:00:00`) : new Date()
  const referenceKey = dateKey(referenceDate)
  const weekStart = startOfLocalWeek(referenceDate)
  const weekKeys = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return dateKey(date)
  })
  const monthKey = referenceKey.slice(0, 7)
  const byDate = new Map()
  history.forEach((row) => {
    byDate.set(row.date, (byDate.get(row.date) || 0) + Number(row.daily_profit || 0))
  })
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)
  const totalEquity = accounts.reduce((sum, account) => sum + Number(account.equity || 0), 0)
  const floating = totalEquity - totalBalance
  const weekPnl = weekKeys.reduce((sum, key) => sum + Number(byDate.get(key) || 0), 0)
  const monthPnl = history
    .filter((row) => String(row.date || '').startsWith(monthKey))
    .reduce((sum, row) => sum + Number(row.daily_profit || 0), 0)
  const dayPnl = Number(byDate.get(referenceKey) || 0)
  const weekDays = weekKeys.map((key) => ({ key, label: new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }), pnl: Number(byDate.get(key) || 0) }))
  const selectedTradeDays = selectedHistory.filter((row) => Number(row.daily_trades || 0) > 0)
  const selectedPnl = selectedHistory.reduce((sum, row) => sum + Number(row.daily_profit || 0), 0)
  const selectedTrades = selectedHistory.reduce((sum, row) => sum + Number(row.daily_trades || 0), 0)
  const selectedLots = selectedHistory.reduce((sum, row) => sum + Number(row.daily_lots || 0), 0)
  const selectedWinDays = selectedTradeDays.filter((row) => Number(row.daily_profit || 0) > 0).length
  const selectedLossDays = selectedTradeDays.filter((row) => Number(row.daily_profit || 0) < 0).length
  const selectedBest = selectedTradeDays.length ? Math.max(...selectedTradeDays.map((row) => Number(row.daily_profit || 0))) : 0
  const selectedWorst = selectedTradeDays.length ? Math.min(...selectedTradeDays.map((row) => Number(row.daily_profit || 0))) : 0
  return {
    totalBalance, totalEquity, floating, dayPnl, weekPnl, monthPnl, weekDays,
    selectedPnl, selectedTrades, selectedLots, selectedWinDays, selectedLossDays,
    selectedBest, selectedWorst, selectedTradeDays: selectedTradeDays.length, reportingDate,
    selectedWinRate: selectedTradeDays.length ? (selectedWinDays / selectedTradeDays.length) * 100 : 0,
  }
}

function buildEquitySeries(accounts, snapshots = []) {
  const allowedAccounts = new Set(accounts.map((account) => String(account.account_number)))
  const sortedSnapshots = snapshots
    .filter((snapshot) => allowedAccounts.has(String(snapshot.account_number)) && (snapshot.bucket_ts || snapshot.timestamp))
    .sort((a, b) => String(a.bucket_ts || a.timestamp).localeCompare(String(b.bucket_ts || b.timestamp)))
  const latestByAccount = new Map()
  const snapshotPoints = []
  let activeBucket = null
  let bucketRows = []
  const flushBucket = () => {
    if (!activeBucket || bucketRows.length === 0) return
    bucketRows.forEach((snapshot) => {
      latestByAccount.set(String(snapshot.account_number), Number(snapshot.equity || 0))
    })
    if (latestByAccount.size !== allowedAccounts.size) return
    const value = Array.from(latestByAccount.values()).reduce((sum, equity) => sum + equity, 0)
    snapshotPoints.push({ date: activeBucket, value })
  }
  sortedSnapshots.forEach((snapshot) => {
    const bucket = snapshot.bucket_ts || snapshot.timestamp
    if (activeBucket && bucket !== activeBucket) {
      flushBucket()
      bucketRows = []
    }
    activeBucket = bucket
    bucketRows.push(snapshot)
  })
  flushBucket()
  const recentSnapshotPoints = snapshotPoints.slice(-1440)
  if (recentSnapshotPoints.length >= 2) return recentSnapshotPoints

  const totals = new Map()
  accounts.forEach((account) => {
    const base = Number(account.balance || 0)
    ;(account.daily_history || []).forEach((row) => {
      totals.set(row.date, (totals.get(row.date) || 0) + base + Number(row.daily_profit || 0))
    })
  })
  const points = Array.from(totals.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-52).map(([date, value]) => ({ date, value }))
  if (points.length >= 2) return points
  const totalEquity = accounts.reduce((sum, account) => sum + Number(account.equity || 0), 0)
  return [
    { date: 'Baseline', value: totalEquity },
    { date: 'Now', value: totalEquity },
  ]
}

function buildMonthlyRows(accounts, periodRange = null) {
  const byMonth = new Map()
  collectPeriodHistory(accounts, periodRange).forEach((row) => {
    const month = String(row.date || '').slice(0, 7)
    if (!month) return
    const item = byMonth.get(month) || { month, pnl: 0, trades: 0, lots: 0, winDays: 0, lossDays: 0, bestDay: null, worstDay: null, accounts: new Map(), moneyContexts: [] }
    const pnl = Number(row.daily_profit || 0)
    const trades = Number(row.daily_trades || 0)
    const lots = Number(row.daily_lots || 0)
    item.pnl += pnl
    item.trades += trades
    item.lots += lots
    item.moneyContexts.push(row)
    if (trades > 0 && pnl > 0) item.winDays += 1
    if (trades > 0 && pnl < 0) item.lossDays += 1
    item.bestDay = item.bestDay === null ? pnl : Math.max(item.bestDay, pnl)
    item.worstDay = item.worstDay === null ? pnl : Math.min(item.worstDay, pnl)
    const accountItem = item.accounts.get(row.account_number) || {
      account_number: row.account_number,
      name: row.name,
      broker: row.broker,
      account_currency: row.account_currency,
      money_scale: row.money_scale,
      money_normalized: row.money_normalized,
      pnl: 0,
      trades: 0,
      lots: 0,
    }
    accountItem.pnl += pnl
    accountItem.trades += trades
    accountItem.lots += lots
    item.accounts.set(row.account_number, accountItem)
    byMonth.set(month, item)
  })
  return Array.from(byMonth.values()).map((row) => ({
    ...row,
    money_context: moneyContextForItems(row.moneyContexts),
    accounts: Array.from(row.accounts.values()).sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl)),
  })).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12)
}

function buildRankings(accounts, periodRange = null) {
  const scopedPeriod = Boolean(periodRange && periodRange.id !== 'all')
  return accounts
    .map((account) => {
      const history = scopedPeriod
        ? (account.daily_history || []).filter((row) => rowInPeriod(row, periodRange))
        : account.daily_history || []
      const closedProfit = scopedPeriod
        ? history.reduce((sum, row) => sum + Number(row.daily_profit || 0), 0)
        : accountClosedProfit(account)
      const trades = scopedPeriod
        ? history.reduce((sum, row) => sum + Number(row.daily_trades || 0), 0)
        : accountClosedTrades(account)
      const lots = history.reduce((sum, row) => sum + Number(row.daily_lots || 0), 0)
      const winDays = history.filter((row) => Number(row.daily_trades || 0) > 0 && Number(row.daily_profit || 0) > 0).length
      const tradeDays = history.filter((row) => Number(row.daily_trades || 0) > 0).length
      const returnPct = Number(account.balance || 0) ? (closedProfit / Number(account.balance || 0)) * 100 : 0
      return { account, closedProfit, trades, lots, winRate: tradeDays ? (winDays / tradeDays) * 100 : 0, returnPct }
    })
    .sort((a, b) => b.returnPct - a.returnPct)
}

function symbolCategory(symbol) {
  const key = String(symbol || '').toUpperCase()
  if (key.includes('XAU') || key.includes('GOLD')) return 'Gold'
  if (key.includes('JPY')) return 'Yen Pairs'
  if (key.includes('NAS') || key.includes('US30') || key.includes('SPX') || key.includes('DOW')) return 'Indices'
  if (key.includes('BTC') || key.includes('ETH') || key.includes('XBT')) return 'Crypto'
  const majors = ['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY']
  if (majors.some((major) => key.includes(major))) return 'Major Pairs'
  return 'Minor / Cross'
}

function buildSymbolExposure(accounts) {
  const map = new Map()
  accounts.forEach((account) => {
    ;(account.open_trades || account.trades || []).forEach((trade) => {
      const symbol = trade.symbol || 'Unknown'
      const item = map.get(symbol) || { symbol, category: symbolCategory(symbol), lots: 0, profit: 0, trades: 0, buy: 0, sell: 0, accounts: new Set(), moneyContexts: [] }
      item.lots += Number(trade.lots || 0)
      item.profit += Number(trade.profit || 0)
      item.trades += 1
      item.accounts.add(account.account_number)
      item.moneyContexts.push(account)
      if (String(trade.trade_type || '').toUpperCase() === 'BUY') item.buy += 1
      if (String(trade.trade_type || '').toUpperCase() === 'SELL') item.sell += 1
      map.set(symbol, item)
    })
  })
  return Array.from(map.values())
    .map((row) => ({ ...row, accounts: row.accounts.size, money_context: moneyContextForItems(row.moneyContexts) }))
    .sort((a, b) => Math.abs(b.lots) - Math.abs(a.lots))
}

function buildAccountPeriodStats(account) {
  const history = account?.daily_history || []
  const rebateRate = accountRebateRate(account)
  const reportingDate = history
    .map((row) => String(row.date || ''))
    .filter(Boolean)
    .sort()
    .at(-1) || dateKey(new Date())
  const referenceDate = new Date(`${reportingDate}T00:00:00`)
  const weekStart = startOfLocalWeek(referenceDate)
  const monthKey = reportingDate.slice(0, 7)
  const yearKey = reportingDate.slice(0, 4)
  const byDate = new Map()
  const byMonth = new Map()

  history.forEach((row) => {
    const key = String(row.date || '')
    if (!key) return
    const rowLots = Number(row.daily_lots || 0)
    const rowRebate = numericField(row, ['daily_rebate', 'rebate', 'total_rebate'])
    const rebate = rowRebate !== null ? rowRebate : rowLots * rebateRate
    const rebateLots = numericField(row, ['daily_rebate_lots', 'rebate_lots']) ?? rebateLotsFromAmount(rebate, rebateRate) ?? rowLots
    const current = byDate.get(key) || { pnl: 0, trades: 0, lots: 0, rebateLots: 0, rebate: 0 }
    current.pnl += Number(row.daily_profit || 0)
    current.trades += Number(row.daily_trades || 0)
    current.lots += rowLots
    current.rebateLots += rebateLots
    current.rebate += rebate
    byDate.set(key, current)

    const month = key.slice(0, 7)
    const monthCurrent = byMonth.get(month) || { pnl: 0, trades: 0, lots: 0, rebateLots: 0, rebate: 0 }
    monthCurrent.pnl += Number(row.daily_profit || 0)
    monthCurrent.trades += Number(row.daily_trades || 0)
    monthCurrent.lots += rowLots
    monthCurrent.rebateLots += rebateLots
    monthCurrent.rebate += rebate
    byMonth.set(month, monthCurrent)
  })

  const dailySeries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(referenceDate)
    date.setHours(0, 0, 0, 0)
    date.setDate(referenceDate.getDate() - (6 - index))
    const key = dateKey(date)
    return { key, label: date.toLocaleDateString(undefined, { weekday: 'short' }), value: Number(byDate.get(key)?.pnl || 0) }
  })
  const weeklySeries = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    const key = dateKey(date)
    return { key, label: date.toLocaleDateString(undefined, { weekday: 'short' }), value: Number(byDate.get(key)?.pnl || 0) }
  })
  const monthlySeries = Array.from({ length: 12 }, (_, index) => {
    const month = `${yearKey}-${String(index + 1).padStart(2, '0')}`
    const label = new Date(Number(yearKey), index, 1).toLocaleDateString(undefined, { month: 'short' })
    return { key: month, label, value: Number(byMonth.get(month)?.pnl || 0) }
  })
  const todayData = byDate.get(reportingDate) || { pnl: 0, trades: 0, lots: 0, rebateLots: 0, rebate: 0 }
  const weekData = weeklySeries.reduce((acc, point) => {
    const item = byDate.get(point.key) || { pnl: 0, trades: 0, lots: 0, rebateLots: 0, rebate: 0 }
    return { pnl: acc.pnl + item.pnl, trades: acc.trades + item.trades, lots: acc.lots + item.lots, rebateLots: acc.rebateLots + item.rebateLots, rebate: acc.rebate + item.rebate }
  }, { pnl: 0, trades: 0, lots: 0, rebateLots: 0, rebate: 0 })
  const monthData = history
    .filter((row) => String(row.date || '').startsWith(monthKey))
    .reduce((acc, row) => {
      const lots = Number(row.daily_lots || 0)
      const rebate = numericField(row, ['daily_rebate', 'rebate', 'total_rebate']) ?? (lots * rebateRate)
      const rebateLots = numericField(row, ['daily_rebate_lots', 'rebate_lots']) ?? rebateLotsFromAmount(rebate, rebateRate) ?? lots
      return {
        pnl: acc.pnl + Number(row.daily_profit || 0),
        trades: acc.trades + Number(row.daily_trades || 0),
        lots: acc.lots + lots,
        rebateLots: acc.rebateLots + rebateLots,
        rebate: acc.rebate + rebate,
      }
    }, { pnl: 0, trades: 0, lots: 0, rebateLots: 0, rebate: 0 })

  return {
    today: { ...todayData, series: dailySeries, reportingDate },
    week: { ...weekData, series: weeklySeries },
    month: { ...monthData, series: monthlySeries },
  }
}

function inferEaProfile(account, snapshots = []) {
  const name = accountLabel(account).toLowerCase()
  const openTrades = Number(account.open_positions || (account.open_trades || account.trades || []).length || 0)
  const maxDd = accountMaxDrawdown(account, snapshots)
  let strategy = 'Portfolio EA'
  if (name.includes('manual') || name.includes('hand')) strategy = 'Manual'
  else if (name.includes('janus')) strategy = 'JANUS'
  else if (name.includes('steady')) strategy = 'SteadyFlow'
  else if (openTrades >= 10) strategy = 'Grid / Multi-trade'
  else if (openTrades > 0) strategy = 'Active strategy'

  let risk = 'Low risk'
  let level = 'low'
  if (maxDd > 50) { risk = 'Extreme risk'; level = 'extreme' }
  else if (maxDd > 30) { risk = 'High risk'; level = 'high' }
  else if (maxDd > 10) { risk = 'Medium risk'; level = 'medium' }
  return { strategy, risk, level }
}

function buildClosedHistoryRows(accounts) {
  return accounts.flatMap((account) =>
    (account.daily_history || []).map((row) => {
      const lots = Number(row.daily_lots || 0)
      const reportedRebate = numericField(row, ['daily_rebate', 'rebate', 'total_rebate'])
      const rebate = reportedRebate !== null ? reportedRebate : lots * accountRebateRate(account)
      return {
        date: row.date,
        account,
        account_number: account.account_number,
        name: accountLabel(account),
        broker: account.broker || 'Unknown broker',
        pnl: Number(row.daily_profit || 0),
        trades: Number(row.daily_trades || 0),
        lots,
        rebateLots: numericField(row, ['daily_rebate_lots', 'rebate_lots']) ?? rebateLotsFromAmount(rebate, accountRebateRate(account)) ?? lots,
        rebate,
      }
    }),
  ).filter((row) => row.date).sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

function buildWeekendExposure(accounts) {
  const rows = accounts.map((account) => {
    const trades = account.open_trades || account.trades || []
    const lots = accountOpenLots(account)
    const floating = Number(account.equity || 0) - Number(account.balance || 0)
    return { account, trades: trades.length, lots, floating }
  }).filter((row) => row.trades > 0 || Math.abs(row.floating) > 0.01)
    .sort((a, b) => Math.abs(b.floating) - Math.abs(a.floating))
  const totalTrades = rows.reduce((sum, row) => sum + row.trades, 0)
  const totalLots = rows.reduce((sum, row) => sum + row.lots, 0)
  const totalFloating = rows.reduce((sum, row) => sum + row.floating, 0)
  const now = new Date()
  const day = now.getDay()
  const isFridayWindow = day === 5 && now.getHours() >= 12
  const isWeekend = day === 0 || day === 6
  const level = totalTrades === 0 ? 'clear' : (isWeekend || isFridayWindow ? 'danger' : 'watch')
  return { rows, totalTrades, totalLots, totalFloating, isFridayWindow, isWeekend, level }
}

function buildRebateSummary(accounts) {
  const rows = accounts
    .map((account) => {
      const closedLots = accountClosedLots(account) || 0
      const reported = accountReportedRebate(account)
      const rate = accountRebateRate(account)
      const rebate = reported !== null ? reported : closedLots * rate
      const lots = accountRebateLots(account) ?? closedLots
      return { account, rebate, lots, closedLots, rate, estimated: reported === null }
    })
    .filter((row) => row.lots > 0 || Math.abs(row.rebate) > 0.0001)
  const rates = Array.from(new Set(rows.map((row) => Number(row.rate || 0).toFixed(4))))
  return {
    total: rows.reduce((sum, row) => sum + row.rebate, 0),
    totalLots: rows.reduce((sum, row) => sum + row.lots, 0),
    rateLabel: rates.length === 1 ? `$${Number(rates[0]).toFixed(2)} / lot` : 'Mixed rates',
    estimated: rows.some((row) => row.estimated),
    rows: rows.sort((a, b) => Math.abs(b.rebate) - Math.abs(a.rebate)),
    hasData: rows.length > 0,
  }
}

function buildRiskRows(accounts, snapshots = []) {
  return accounts.map((account) => {
    const floating = Number(account.equity || 0) - Number(account.balance || 0)
    const openTrades = Number(account.open_positions || (account.open_trades || account.trades || []).length || 0)
    const openLots = accountOpenLots(account)
    const currentDd = Number(account.drawdown_percent || 0)
    const peakDd = accountMaxDrawdown(account, snapshots)
    const floatingPct = pctOfBalance(floating, account.balance)
    const age = getAge(account)
    const score =
      (currentDd >= 10 ? 45 : currentDd >= 5 ? 28 : currentDd >= 2 ? 12 : 0) +
      (floatingPct <= -10 ? 35 : floatingPct <= -5 ? 22 : floatingPct <= -2 ? 10 : 0) +
      (openTrades >= 10 ? 18 : openTrades > 0 ? 8 : 0) +
      (age.seconds >= 1800 ? 18 : age.seconds >= 330 ? 8 : 0)
    const level = score >= 65 ? 'critical' : score >= 30 ? 'warning' : 'clear'
    return { account, floating, floatingPct, openTrades, openLots, currentDd, peakDd, age, score, level }
  }).sort((a, b) => b.score - a.score || Math.abs(b.floating) - Math.abs(a.floating))
}

function buildAlerts(accounts, snapshots = [], sysData = null) {
  const alerts = []
  const weekend = buildWeekendExposure(accounts)
  accounts.forEach((account) => {
    const age = getAge(account)
    const label = accountLabel(account)
    const floating = Number(account.equity || 0) - Number(account.balance || 0)
    const floatingPct = pctOfBalance(floating, account.balance)
    const currentDd = Number(account.drawdown_percent || 0)
    const peakDd = accountMaxDrawdown(account, snapshots)
    if (age.seconds >= 1800) {
      alerts.push({ level: 'critical', title: `${label} data stale`, detail: `Last update ${age.detail}. Check MT5 reporter or VPS connectivity.`, scope: 'Data' })
    } else if (age.seconds >= 330) {
      alerts.push({ level: 'warning', title: `${label} delayed`, detail: `Last update ${age.detail}. Data is still visible but not fresh.`, scope: 'Data' })
    }
    if (currentDd >= 10) alerts.push({ level: 'critical', title: `${label} current drawdown high`, detail: `Current DD is ${formatPercent(currentDd)}. Peak DD is ${formatPercent(peakDd)}. Review risk before adding exposure.`, scope: 'Risk' })
    else if (currentDd >= 5) alerts.push({ level: 'warning', title: `${label} current drawdown watch`, detail: `Current DD is ${formatPercent(currentDd)}. Peak DD is ${formatPercent(peakDd)}.`, scope: 'Risk' })
    if (floatingPct <= -10) alerts.push({ level: 'critical', title: `${label} floating loss pressure`, detail: `${fmtS(floating, account)} floating (${floatingPct.toFixed(2)}% of balance).`, scope: 'Floating' })
    else if (floatingPct <= -5) alerts.push({ level: 'warning', title: `${label} floating loss watch`, detail: `${fmtS(floating, account)} floating (${floatingPct.toFixed(2)}% of balance).`, scope: 'Floating' })
  })
  if (weekend.totalTrades > 0 && (weekend.isFridayWindow || weekend.isWeekend)) {
    alerts.push({ level: 'critical', title: 'Weekend exposure open', detail: `${weekend.totalTrades} trades / ${weekend.totalLots.toFixed(2)} lots still open.`, scope: 'Weekend' })
  } else if (weekend.totalTrades > 0) {
    alerts.push({ level: 'info', title: 'Open exposure monitor', detail: `${weekend.totalTrades} trades / ${weekend.totalLots.toFixed(2)} lots currently open.`, scope: 'Weekend' })
  }
  ;[['CPU', sysData?.cpu_percent], ['RAM', sysData?.ram_percent], ['Disk', sysData?.disk_percent]].forEach(([label, value]) => {
    const pct = Number(value || 0)
    if (pct >= 90) alerts.push({ level: 'critical', title: `${label} usage critical`, detail: `${pct.toFixed(1)}% usage on VPS.`, scope: 'Server' })
    else if (pct >= 75) alerts.push({ level: 'warning', title: `${label} usage elevated`, detail: `${pct.toFixed(1)}% usage on VPS.`, scope: 'Server' })
  })
  const rank = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => rank[a.level] - rank[b.level])
}

function csvEscape(value) {
  const str = String(value ?? '')
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// โ”€โ”€ TRADINGVIEW WIDGETS โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function TradingViewNewsWidget() {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    ref.current.appendChild(widget)
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      width: '100%', height: 350, colorTheme: 'dark',
      isTransparent: true, locale: 'en', importanceFilter: '0,1',
    })
    ref.current.appendChild(script)
    return () => { if (ref.current) ref.current.innerHTML = '' }
  }, [])
  return (
    <div className="rp">
      <div className="rpl">
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none"><path d="M4 11h16M4 7h16M4 15h8" /></svg>
        Economic Calendar
      </div>
      <div ref={ref} style={{ minHeight: 360, marginTop: 8 }} />
    </div>
  )
}

function TradingViewMarketWidget() {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    ref.current.appendChild(widget)
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark', dateRange: '1D', showChart: false,
      locale: 'en', isTransparent: true, showSymbolLogo: true,
      showFloatingTooltip: false, width: '100%', height: 380,
      tabs: [
        { title: 'Forex', originalTitle: 'Forex', symbols: [
          { s: 'FX:XAUUSD', d: 'Gold / XAUUSD' },
          { s: 'FX:EURUSD', d: 'EUR / USD' },
          { s: 'FX:GBPUSD', d: 'GBP / USD' },
          { s: 'FX:USDJPY', d: 'USD / JPY' },
          { s: 'FX:AUDUSD', d: 'AUD / USD' },
          { s: 'FX:USDCHF', d: 'USD / CHF' },
        ]},
        { title: 'Indices', originalTitle: 'Indices', symbols: [
          { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
          { s: 'FOREXCOM:NSXUSD', d: 'Nasdaq 100' },
          { s: 'TVC:DJI', d: 'Dow Jones' },
        ]},
      ],
    })
    ref.current.appendChild(script)
    return () => { if (ref.current) ref.current.innerHTML = '' }
  }, [])
  return (
    <div className="rp">
      <div className="rpl">
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none"><path d="M4 18h16M5 15l4-4 4 3 6-8M15 6h4v4" /></svg>
        Market Overview
      </div>
      <div ref={ref} style={{ minHeight: 380, marginTop: 8 }} />
    </div>
  )
}

function TradingViewForexHeatmapWidget() {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    ref.current.appendChild(widget)
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      width: '100%', height: 380,
      currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY'],
      isTransparent: true, colorTheme: 'dark', locale: 'en',
      backgroundColor: '#050812',
    })
    ref.current.appendChild(script)
    return () => { if (ref.current) ref.current.innerHTML = '' }
  }, [])
  return (
    <div className="sec" style={{ marginBottom:9 }}>
      <div className="sec-h">
        <div><div className="sec-lbl">Currency Strength</div><div className="sec-title">Forex Heatmap</div></div>
        <span className="chip cb">TradingView Live</span>
      </div>
      <div ref={ref} style={{ minHeight: 380, padding: 14 }} />
    </div>
  )
}

// โ”€โ”€ TOOLTIP โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
// โ”€โ”€ COMPONENTS โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function AccountNameDialog({ account, value, onChange, onCancel, onSave, saving }) {
  if (!account) return null
  return (
    <Dialog open={Boolean(account)} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="name-dialog sec p-0">
        <form onSubmit={onSave}>
          <DialogHeader className="sec-h">
            <div>
              <div className="sec-lbl">Account Label</div>
              <DialogTitle className="sec-title">{maskAccountNumber(account.account_number)}</DialogTitle>
            </div>
            <Badge variant="secondary" className="chip cd">{account.broker || 'Broker unknown'}</Badge>
          </DialogHeader>
          <DialogDescription className="sr-only">Rename the account display label.</DialogDescription>
          <div style={{ padding: 20 }}>
            <label style={{ display: 'block', marginBottom: 12, fontSize: 12, color: C.t3, fontFamily: C.fb }}>
              Display name
              <Input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="e.g., Manual Gold, EA Scalper 01"
                autoFocus
                maxLength={80}
                className="name-dialog-input"
              />
            </label>
            <div style={{ fontSize: 11, color: C.t3, marginBottom: 20 }}>Leave blank to revert to masked account number.</div>
            <DialogFooter className="dialog-actions">
              <Button className="brtab" variant="ghost" onClick={onCancel} type="button">Cancel</Button>
              <Button className="btn b-acc" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save name'}</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loginError, setLoginError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setLoginError('')
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) throw new Error('Login failed')
      onLogin(await response.json())
    } catch {
      setLoginError('Username or password is incorrect')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-brand">
          <div className="login-grid" />
          <div className="brand-mark">
            <div className="sb-icon login-logo">TE</div>
            <div>
              <div className="brand-name">The Entity</div>
              <div className="brand-sub">Forex EA Portfolio Monitor</div>
            </div>
          </div>
          <div className="login-hero">
            <div className="login-kicker">Portfolio Monitoring</div>
            <h1>Control every EA, risk signal, and open position from one terminal.</h1>
            <p>Live MT5 reporter data, drawdown alerts, weekend exposure checks, and closed performance history in a private dashboard.</p>
            <div className="login-badges">
              <span><span className="ldot" /> System Live</span>
              <span>MT5 WebRequest</span>
            </div>
          </div>
          <div className="login-mini">
            <div><span>DATA</span><b>Live Sync</b></div>
            <div><span>RISK</span><b>DD Alerts</b></div>
            <div><span>VIEW</span><b>Mobile Ready</b></div>
          </div>
        </div>
        <Card className="login-card">
          <form onSubmit={submit} className="login-form">
            <CardHeader className="login-card-head">
              <div className="sec-lbl">Secure Access</div>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Sign in to your portfolio dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="login-card-body">
              <label className="login-field">
                Username
                <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="admin or demo" />
              </label>
              <label className="login-field">
                Password
                <span className="password-wrap">
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter password" />
                  <Button type="button" className="password-toggle" variant="secondary" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</Button>
                </span>
              </label>
              {loginError && <div className="login-error">{loginError}</div>}
              <Button className="login-submit" disabled={busy} type="submit">{busy ? 'Signing in...' : 'Login'}</Button>
              <div className="login-footnote">End-to-end dashboard session protected by proxy auth</div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg0, flexDirection: 'column', gap: 20 }}>
      <div className="sb-icon" style={{ width: 50, height: 50, fontSize: 18, animation: 'pulse 2s infinite' }}>TE</div>
      <div style={{ color: C.t2, fontFamily: C.fn, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading portfolio data...</div>
    </div>
  )
}

function BrokerAccountFilter({ brokers, accounts, selected, onSelect }) {
  const brokerOptions = [
    {
      id: 'all',
      label: 'All Brokers',
      logo: 'ALL',
      asset: '/brokers/all-brokers.svg',
      tone: 'cyan',
      count: accounts.length,
      subtitle: 'All monitored accounts',
    },
    ...brokers.map((broker) => {
      const meta = brokerMeta(broker)
      return {
        id: broker,
        label: meta.label,
        logo: meta.logo,
        asset: meta.asset,
        tone: meta.tone,
        count: accounts.filter((account) => account.broker === broker).length,
        subtitle: meta.subtitle,
      }
    }),
  ]
  return (
    <Card className="broker-filter-card">
      <CardHeader className="broker-filter-head p-0">
        <span>Broker</span>
        <b>/ Account Filter</b>
      </CardHeader>
      <CardContent className="broker-filter-scroll p-0" role="list" aria-label="Broker account filter">
        {brokerOptions.map((broker) => (
          <Button
            key={broker.id}
            type="button"
            variant="ghost"
            className={cn('broker-card', selected === broker.id && 'on')}
            onClick={() => onSelect(broker.id)}
            title={broker.subtitle}
          >
            <span className={`broker-logo ${broker.tone}`} aria-hidden="true">
              {broker.asset ? <img src={broker.asset} alt="" loading="lazy" /> : broker.logo}
            </span>
            <span className="broker-name">{broker.label}</span>
            <Badge variant="secondary" className="broker-count">{broker.count} {broker.count === 1 ? 'account' : 'accounts'}</Badge>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

function DeleteAccountDialog({ account, confirmation, onConfirmationChange, onCancel, onDelete, deleting }) {
  if (!account) return null
  const canDelete = confirmation === 'DELETE' && !deleting
  return (
    <Dialog open={Boolean(account)} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="delete-dialog sec p-0">
        <form onSubmit={onDelete}>
          <DialogHeader className="sec-h">
            <div>
              <div className="sec-lbl">Permanent Portfolio Removal</div>
              <DialogTitle className="sec-title">Delete {accountLabel(account)}?</DialogTitle>
            </div>
            <span className="delete-dialog-icon">{Ico.trash}</span>
          </DialogHeader>
          <DialogDescription className="sr-only">Confirm permanent portfolio removal.</DialogDescription>
          <div className="delete-dialog-body">
            <div className="delete-warning">
              <strong>Disable the MT5 Reporter for this account first.</strong>
              <span>If it remains active, the portfolio will return on the next reporter update.</span>
            </div>
            <div className="delete-account-summary">
              <span>{maskAccountNumber(account.account_number)}</span>
              <span>{account.broker || 'Unknown broker'}</span>
            </div>
            <p>This removes the account, open trades, daily history, and equity snapshots from the dashboard. A server-side backup is created automatically before deletion.</p>
            <label className="delete-confirm-field">
              Type <b>DELETE</b> to confirm
              <Input
                value={confirmation}
                onChange={(event) => onConfirmationChange(event.target.value)}
                placeholder="DELETE"
                autoFocus
                autoComplete="off"
              />
            </label>
            <DialogFooter className="delete-dialog-actions">
              <Button className="brtab" variant="ghost" onClick={onCancel} disabled={deleting} type="button">Cancel</Button>
              <Button className="btn b-danger" disabled={!canDelete} type="submit">
                {Ico.trash} {deleting ? 'Deleting...' : 'Delete portfolio'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CommandPalette({ open, onClose, onNavigate, onSync, isAdmin, accounts }) {
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const actions = useMemo(() => {
    const base = [
      { id: 'go-overview', label: 'Open Overview', meta: 'Portfolio status and equity curve', page: 'overview' },
      { id: 'go-advisors', label: 'Open Expert Advisors', meta: 'EA cards, risk, and daily performance', page: 'advisors' },
      { id: 'go-symbols', label: 'Open Symbols', meta: 'Lots, direction, and floating exposure', page: 'symbols' },
      { id: 'go-trades', label: 'Open Active Trades', meta: 'Open positions and current floating P&L', page: 'trades' },
      { id: 'go-preview', label: 'Open MT5 Preview', meta: 'Reporter-style account preview', page: 'mt5preview' },
      { id: 'go-history', label: 'Open History', meta: 'Closed performance and period reports', page: 'history' },
    ]
    const admin = isAdmin ? [
      { id: 'go-reporter', label: 'Open MT5 Reporter', meta: 'Endpoint, API key, and install checklist', page: 'reporter' },
      { id: 'go-health', label: 'Open System Health', meta: 'Reporter heartbeat and VPS health', page: 'logs' },
      { id: 'sync-now', label: 'Sync now', meta: 'Refresh dashboard, health, and reporter state', run: onSync },
    ] : []
    const accountActions = accounts.slice(0, 8).map((account) => ({
      id: `account-${account.account_number}`,
      label: `Find ${accountLabel(account)}`,
      meta: `${maskAccountNumber(account.account_number)} / ${account.broker || 'Unknown broker'}`,
      page: 'advisors',
    }))
    return [...base, ...admin, ...accountActions]
  }, [accounts, isAdmin, onSync])

  const filtered = actions.filter((action) => {
    const needle = `${action.label} ${action.meta}`.toLowerCase()
    return needle.includes(query.trim().toLowerCase())
  }).slice(0, 10)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])

  if (!open) return null
  const runAction = (action) => {
    if (action.page) onNavigate(action.page)
    if (action.run) action.run()
    onClose()
  }

  return (
    <div className="command-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="command-panel" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="command-head">
          <div>
            <span>Command Palette</span>
            <b>Navigate or run safe actions</b>
          </div>
          <kbd>Esc</kbd>
        </div>
        <input
          className="command-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search page, account, or action..."
          autoFocus
        />
        <div className="command-list">
          {filtered.length === 0 ? (
            <div className="command-empty">No matching command.</div>
          ) : filtered.map((action) => (
            <button key={action.id} type="button" className="command-item" onClick={() => runAction(action)}>
              <span>{action.label}</span>
              <small>{action.meta}</small>
            </button>
          ))}
        </div>
        <div className="command-foot">
          <span>Ctrl/⌘ + K</span>
          <em>{isAdmin ? 'Admin mode' : 'Demo mode'}</em>
        </div>
      </div>
    </div>
  )
}

function PeriodFilter({ value, onChange, customStart, customEnd, onCustomStart, onCustomEnd, range }) {
  const label = value === 'custom' && range?.id === 'all' ? 'Set dates' : (range?.label || PERIOD_OPTIONS.find((option) => option.id === value)?.label || 'All Time')
  return (
    <Card className="period-filter-card">
      <CardHeader className="period-filter-head p-0">
        <span>Period View</span>
        <b>{label}</b>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={value} onValueChange={onChange}>
          <TabsList className="period-tabs">
            {PERIOD_OPTIONS.map((option) => (
              <TabsTrigger key={option.id} className="period-tab" value={option.id}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      {value === 'custom' ? (
        <div className="custom-period">
          <Input className="fctl" type="date" value={customStart} onChange={(event) => onCustomStart(event.target.value)} />
          <Input className="fctl" type="date" value={customEnd} onChange={(event) => onCustomEnd(event.target.value)} />
        </div>
      ) : null}
      </CardContent>
    </Card>
  )
}

function DashboardSelect({ value, onValueChange, options, className, ariaLabel }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn('fctl', className)} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

function AccountFilterControls({
  statusFilter,
  setStatusFilter,
  sortMode,
  setSortMode,
  strategyFilter,
  setStrategyFilter,
  strategyOptions,
  searchTerm,
  setSearchTerm,
}) {
  const statusOptions = [
    { value: 'all', label: 'All status' },
    { value: 'live', label: 'Live' },
    { value: 'stale', label: 'Stale' },
    { value: 'offline', label: 'Offline' },
  ]
  const sortOptions = [
    { value: 'equity-desc', label: 'Equity high to low' },
    { value: 'equity-asc', label: 'Equity low to high' },
    { value: 'floating-desc', label: 'Floating high to low' },
    { value: 'floating-asc', label: 'Floating low to high' },
    { value: 'dd-desc', label: 'Peak DD high to low' },
    { value: 'name-asc', label: 'Name A to Z' },
  ]
  const strategySelectOptions = [
    { value: 'all', label: 'All strategies' },
    ...strategyOptions.map((strategy) => ({ value: strategy, label: strategy })),
  ]

  return (
    <div className="filter-tools">
      <DashboardSelect value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} ariaLabel="Account status filter" />
      <DashboardSelect value={sortMode} onValueChange={setSortMode} options={sortOptions} className="wide" ariaLabel="Account sort mode" />
      <DashboardSelect value={strategyFilter} onValueChange={setStrategyFilter} options={strategySelectOptions} className="wide" ariaLabel="Strategy filter" />
      <Input
        className="fctl search"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search account"
      />
    </div>
  )
}

function WeekendExposureCard({ accounts, compact = false }) {
  const exposure = buildWeekendExposure(accounts)
  const exposureMoneyContext = moneyContextForItems(exposure.rows.map((row) => row.account))
  const tone = exposure.level === 'danger' ? C.red : exposure.level === 'watch' ? C.yel : C.grn
  const worstRow = exposure.rows[0]
  return (
    <div className={compact ? "rp weekend-card" : "sec weekend-card"}>
      <div className={compact ? "rpl" : "sec-h"} style={compact ? {} : { alignItems:'center' }}>
        {compact ? 'Weekend Exposure' : (
          <>
            <div><div className="sec-lbl">Friday Risk Desk</div><div className="sec-title">Weekend Exposure</div></div>
            <span className={`badge ${exposure.level === 'danger' ? 'bsell' : exposure.level === 'watch' ? 'bwarn' : 'blive'}`}>{exposure.level === 'clear' ? 'Clear' : 'Watch'}</span>
          </>
        )}
      </div>
      <div className="weekend-metrics">
        <div><span>Open Trades</span><b>{exposure.totalTrades}</b></div>
        <div><span>Open Lots</span><b>{exposure.totalLots.toFixed(2)}</b></div>
        <div><span>Floating</span><b style={{ color:pclr(exposure.totalFloating) }}>{fmtS(exposure.totalFloating, exposureMoneyContext)}</b></div>
      </div>
      <div className="weekend-note" style={{ color:tone }}>
        {exposure.totalTrades === 0
          ? 'No open weekend exposure.'
          : exposure.level === 'danger'
            ? 'Action required before holding across weekend.'
            : 'Monitor before Friday close.'}
      </div>
      {compact && worstRow && (
        <div className="weekend-mini-risk">
          <span>Largest exposure</span>
          <b>{accountLabel(worstRow.account)}</b>
          <em>{worstRow.trades} trades / {worstRow.lots.toFixed(2)} lots</em>
        </div>
      )}
      {!compact && (
        <div className="weekend-list">
          {exposure.rows.length === 0 ? <div className="empty-note">No open exposure.</div> : exposure.rows.slice(0, 8).map((row) => (
            <div className="weekend-row" key={row.account.account_number}>
              <div>
                <strong>{accountLabel(row.account)}</strong>
                <span>{maskAccountNumber(row.account.account_number)}</span>
              </div>
              <div className="tm">{row.trades} trades</div>
              <div className="tm">{row.lots.toFixed(2)} lots</div>
              <div className="tm" style={{ color:pclr(row.floating) }}>{fmtS(row.floating, row.account)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RebateSummaryCard({ accounts }) {
  const rebate = buildRebateSummary(accounts)
  return (
    <div className="rp rebate-card">
      <div className="rpl">Rebate Summary</div>
      <div className="rpb" style={{ color: rebate.hasData ? C.grn : C.t2 }}>{fmtM(rebate.total)}</div>
      <div className="rps">
        {rebate.hasData
          ? `${rebate.totalLots.toFixed(4)} rebate lots · ${rebate.rateLabel}${rebate.estimated ? ' estimate' : ''}`
          : 'No closed lots yet. Rebate will appear after reporter sends closed history.'}
      </div>
      <div className="rebate-mini">
        {(rebate.hasData ? rebate.rows.slice(0, 3) : accounts.slice(0, 3).map((account) => ({ account, rebate: 0, lots: accountClosedLots(account) || 0, rate: accountRebateRate(account) }))).map((row) => (
          <div key={row.account.account_number}>
            <span>{accountLabel(row.account)} · {Number(row.lots || 0).toFixed(2)} lots</span>
            <b>{rebate.hasData ? fmtM(row.rebate) : `$${Number(row.rate || DEFAULT_REBATE_PER_LOT).toFixed(2)}/lot`}</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiskDeskPage({ accounts, snapshots }) {
  const exposure = buildWeekendExposure(accounts)
  const exposureMoneyContext = moneyContextForItems(exposure.rows.map((row) => row.account))
  const riskRows = buildRiskRows(accounts, snapshots)
  const clearCount = riskRows.filter((row) => row.level === 'clear').length
  const watchCount = riskRows.filter((row) => row.level === 'warning').length
  const criticalCount = riskRows.filter((row) => row.level === 'critical').length
  const exportRisk = () => {
    downloadCsv('the-entity-risk-desk.csv', [
      ['ea_name', 'account', 'broker', 'risk_level', 'score', 'current_dd_pct', 'peak_dd_pct', 'open_trades', 'open_lots', 'floating_pnl', 'floating_pct', 'data_status'],
      ...riskRows.map((row) => [
        accountLabel(row.account),
        row.account.account_number,
        row.account.broker || '',
        row.level,
        row.score,
        row.currentDd.toFixed(2),
        row.peakDd.toFixed(2),
        row.openTrades,
        row.openLots.toFixed(2),
        row.floating.toFixed(2),
        row.floatingPct.toFixed(2),
        row.age.label,
      ]),
    ])
  }
  return (
    <>
      <div className="risk-hero">
        <div>
          <div className="sec-lbl">Friday Clear View</div>
          <div className="risk-title">Weekend Risk Desk</div>
          <div className="risk-copy">Use this page before Friday close to find open trades, large floating loss, stale MT5 reporters, and EAs that need attention.</div>
        </div>
        <div className="risk-hero-grid">
          <div><span>Open Trades</span><b>{exposure.totalTrades}</b></div>
          <div><span>Open Lots</span><b>{exposure.totalLots.toFixed(2)}</b></div>
          <div><span>Floating</span><b style={{ color:pclr(exposure.totalFloating) }}>{fmtS(exposure.totalFloating, exposureMoneyContext)}</b></div>
        </div>
      </div>
      <div className="alert-summary">
        <div className="alert-kpi critical"><span>Critical EAs</span><b>{criticalCount}</b></div>
        <div className="alert-kpi warning"><span>Watch EAs</span><b>{watchCount}</b></div>
        <div className="alert-kpi info"><span>Clear EAs</span><b>{clearCount}</b></div>
      </div>
      <WeekendExposureCard accounts={accounts} />
      <div className="sec">
        <div className="sec-h">
          <div><div className="sec-lbl">Risk Queue</div><div className="sec-title">Which EA needs attention?</div></div>
          <button className="btn b-acc" onClick={exportRisk}>Export CSV</button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className="tbl">
            <thead><tr><th>EA</th><th>Risk</th><th>Current DD</th><th>Open</th><th>Open Lots</th><th>Floating</th><th>Data</th><th>Action</th></tr></thead>
            <tbody>
              {riskRows.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign:'center', color:C.t3, padding:20 }}>No accounts to monitor.</td></tr>
              ) : riskRows.map((row) => (
                <tr key={row.account.account_number}>
                  <td>
                    <div className="tn">{accountLabel(row.account)}</div>
                    <div className="tm" style={{ color:C.t3 }}>{maskAccountNumber(row.account.account_number)}</div>
                  </td>
                  <td><span className={`badge ${row.level === 'critical' ? 'bsell' : row.level === 'warning' ? 'bwarn' : 'blive'}`}>{row.level === 'clear' ? 'Clear' : row.level}</span></td>
                  <td className="tm" style={{ color:row.currentDd >= 10 ? C.red : row.currentDd >= 5 ? C.yel : C.t2 }}>{formatPercent(row.currentDd)}</td>
                  <td className="tm">{row.openTrades}</td>
                  <td className="tm">{row.openLots.toFixed(2)}</td>
                  <td className="tm" style={{ color:pclr(row.floating), fontWeight:600 }}>{fmtS(row.floating, row.account)}</td>
                  <td><span className={`badge ${row.age.seconds < 330 ? 'blive' : row.age.seconds < 1800 ? 'bbuy' : 'bsell'}`}>{row.age.label}</span></td>
                  <td className="tm" style={{ color:C.t2 }}>
                    {row.openTrades > 0 ? 'Review before close' : row.level === 'clear' ? 'No action' : 'Check reporter / DD'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// โ”€โ”€ PAGES โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function ResponsiveSymbolRows({ symbols }) {
  if (symbols.length === 0) {
    return (
      <Card className="responsive-empty-card symbol-mobile-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.grn} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>No open symbol exposure. All positions are closed.</span>
      </Card>
    )
  }
  return (
    <div className="responsive-row-list">
      {symbols.map((symbol) => (
        <Card className="responsive-row-card symbol-mobile-row" key={`mobile-${symbol.symbol}`}>
          <CardHeader className="responsive-row-head p-0">
            <div>
              <CardTitle className="responsive-row-title">{symbol.symbol}</CardTitle>
              <CardDescription className="responsive-row-sub">{symbol.accounts} accounts / {symbol.trades} trades</CardDescription>
            </div>
            <Badge variant="secondary" className="mini-tag">{symbol.category}</Badge>
          </CardHeader>
          <CardContent className="responsive-row-body p-0">
            <div><span>Lots</span><b className="symbol-number">{symbol.lots.toFixed(2)}</b></div>
            <div><span>Buy / Sell</span><b className="symbol-number">{symbol.buy} / {symbol.sell}</b></div>
            <div><span>Floating</span><b className="symbol-money" style={{ color:pclr(symbol.profit) }}>{fmtS(symbol.profit, symbol.money_context)}</b></div>
            <div><span>Category</span><b>{symbol.category}</b></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ResponsiveTradeRows({ trades, isAdmin }) {
  if (trades.length === 0) {
    return (
      <Card className="responsive-empty-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px 12px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.grn} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>No open exposure. All EAs are idle.</span>
      </Card>
    )
  }
  return (
    <div className="responsive-row-list">
      {trades.map((trade, index) => {
        const direction = String(trade.trade_type || '').toUpperCase()
        const isBuy = direction === 'BUY'
        const pnl = Number(trade.profit || 0)
        const tradeLabel = isAdmin ? `#${trade.ticket}` : `Trade ${index + 1}`
        return (
          <Card className="responsive-row-card trade-row-card" key={`${trade.account.account_number}-${trade.ticket}`}>
            <CardHeader className="responsive-row-head p-0">
              <div>
                <CardTitle className="responsive-row-title">{accountLabel(trade.account)}</CardTitle>
                <CardDescription className="responsive-row-sub">
                  {isAdmin ? maskAccountNumber(trade.account.account_number) : tradeLabel}
                </CardDescription>
              </div>
              <Badge className={`badge ${isBuy ? 'bbuy' : 'bsell'}`}>{direction || '-'}</Badge>
            </CardHeader>
            <CardContent className="responsive-row-body p-0">
              <div><span>Symbol</span><b>{trade.symbol || '-'}</b></div>
              <div><span>{isAdmin ? 'Ticket' : 'Trade'}</span><b>{tradeLabel}</b></div>
              <div><span>Lots</span><b>{Number(trade.lots || 0).toFixed(2)}</b></div>
              {isAdmin && <div><span>Open Price</span><b>{Number(trade.open_price || 0).toFixed(5)}</b></div>}
              <div><span>P&L</span><b style={{ color:pclr(pnl) }}>{fmtS(pnl, trade.account)}</b></div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ResponsiveHistoryRows({ rows }) {
  if (rows.length === 0) {
    return <Card className="responsive-empty-card">No closed history for the selected filters.</Card>
  }
  return (
    <div className="responsive-row-list">
      {rows.slice(0, 250).map((row) => (
        <Card className="responsive-row-card history-row-card" key={`${row.account_number}-${row.date}`}>
          <CardHeader className="responsive-row-head p-0">
            <div>
              <CardTitle className="responsive-row-title">{row.name}</CardTitle>
              <CardDescription className="responsive-row-sub">{row.date} / {brokerMeta(row.broker).label}</CardDescription>
            </div>
            <Badge className={`badge ${row.pnl > 0 ? 'bbuy' : row.pnl < 0 ? 'bsell' : 'bwarn'}`}>{row.pnl > 0 ? 'Profit' : row.pnl < 0 ? 'Loss' : 'Flat'}</Badge>
          </CardHeader>
          <CardContent className="responsive-row-body p-0">
            <div><span>Account</span><b>{maskAccountNumber(row.account_number)}</b></div>
            <div><span>P&L</span><b style={{ color:pclr(row.pnl) }}>{fmtS(row.pnl, row)}</b></div>
            <div><span>Closed Deals</span><b>{row.trades}</b></div>
            <div><span>Closed Lots</span><b>{row.lots.toFixed(2)}</b></div>
            <div><span>Rebate</span><b style={{ color:C.grn }}>{fmtM(row.rebate)}</b></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function DataTableShell({ kicker, title, subtitle, actions = null, controls = null, table, mobileRows, className }) {
  return (
    <Card className={cn('sec data-table-shell', className)}>
      <CardHeader className="sec-h data-table-head p-0">
        <div>
          <div className="sec-lbl">{kicker}</div>
          <CardTitle className="sec-title">{title}</CardTitle>
          {subtitle ? <CardDescription className="sec-sub">{subtitle}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      {controls ? <div className="data-table-controls">{controls}</div> : null}
      <CardContent className="data-table-content p-0">
        <div className="desktop-table-only">{table}</div>
        <div className="mobile-card-only">{mobileRows}</div>
      </CardContent>
    </Card>
  )
}

function DataFreshnessStat({ accounts, lastUpdate }) {
  const newestAge = accounts.reduce((min, account) => Math.min(min, getAge(account).seconds), Infinity)
  const staleCount = accounts.filter((account) => getAge(account).seconds >= 330).length
  const label = newestAge === Infinity ? 'Waiting' : staleCount ? `${staleCount} stale` : 'Live'
  const tone = newestAge === Infinity ? '' : staleCount ? 'r' : 'g'
  const detail = newestAge === Infinity
    ? 'no reporter update'
    : `reporter ${Math.round(newestAge)}s ago${lastUpdate ? ` / dashboard ${lastUpdate.toLocaleTimeString()}` : ''}`
  return <div className="stat"><div className="sl">Data Freshness</div><div className={`sv ${tone}`}>{label}</div><div className="ss">{detail}</div></div>
}

function OperationalBrief({ accounts, summary, snapshots = [], lastUpdate, onNavigate, isAdmin = false }) {
  const riskRows = buildRiskRows(accounts, snapshots)
  const weekend = buildWeekendExposure(accounts)
  const portfolioMoneyContext = moneyContextForItems(accounts)
  const weekendMoneyContext = moneyContextForItems(weekend.rows.map((row) => row.account))
  const criticalRows = riskRows.filter((row) => row.level === 'critical')
  const watchRows = riskRows.filter((row) => row.level === 'warning')
  const newestAge = accounts.reduce((min, account) => Math.min(min, getAge(account).seconds), Infinity)
  const staleCount = accounts.filter((account) => getAge(account).seconds >= 330).length
  const portfolioStatus = accounts.length === 0
    ? { label: 'Waiting', tone: 'muted', detail: 'No monitored portfolios yet.' }
    : criticalRows.length
      ? { label: 'Critical', tone: 'danger', detail: `${criticalRows.length} EA${criticalRows.length === 1 ? '' : 's'} need risk review.` }
      : watchRows.length
        ? { label: 'Watch', tone: 'warn', detail: `${watchRows.length} EA${watchRows.length === 1 ? '' : 's'} have open risk to review.` }
      : staleCount
        ? { label: 'Watch', tone: 'warn', detail: `${staleCount} reporter${staleCount === 1 ? '' : 's'} delayed or stale.` }
        : { label: 'Operational', tone: 'good', detail: `All ${accounts.length} monitored portfolios are updating.` }
  const attention = criticalRows[0] || watchRows[0] || riskRows[0]
  const floatingRisk = pctOfBalance(summary.floating, summary.totalBalance)
  const hasWeekendExposure = weekend.totalTrades > 0
  const briefItems = [
    {
      label: 'Portfolio Status',
      value: portfolioStatus.label,
      tone: portfolioStatus.tone,
      detail: portfolioStatus.detail,
      action: isAdmin ? 'Review health' : 'Investor safe',
      onClick: isAdmin ? () => onNavigate?.('logs') : undefined,
    },
    {
      label: `${reportingDayLabel(summary.reportingDate)} Result`,
      value: fmtS(summary.todayPnl, portfolioMoneyContext),
      tone: summary.todayPnl >= 0 ? 'good' : 'danger',
      detail: `${summary.todayTrades} closed deals / ${summary.reportingDate || 'waiting for reporter'}`,
      action: 'Open history',
      onClick: () => onNavigate?.('history'),
    },
    {
      label: 'Floating Risk',
      value: formatPercent(floatingRisk),
      tone: floatingRisk <= -5 ? 'danger' : floatingRisk <= -2 ? 'warn' : 'good',
      detail: `${fmtS(summary.floating, portfolioMoneyContext)} open P&L across ${summary.openTrades} open trades.`,
      action: 'Open trades',
      onClick: () => onNavigate?.('trades'),
    },
    {
      label: 'Weekend Exposure',
      value: hasWeekendExposure ? `${weekend.totalTrades} trades` : 'Clear',
      tone: hasWeekendExposure ? (weekend.level === 'danger' ? 'danger' : 'warn') : 'good',
      detail: hasWeekendExposure ? `${weekend.totalLots.toFixed(2)} lots / ${fmtS(weekend.totalFloating, weekendMoneyContext)} floating.` : 'No open weekend exposure right now.',
      action: 'Check preview',
      onClick: () => onNavigate?.('mt5preview'),
    },
    {
      label: 'Needs Attention',
      value: attention ? accountLabel(attention.account) : 'None',
      tone: attention?.level === 'critical' ? 'danger' : attention?.level === 'warning' ? 'warn' : 'good',
      detail: attention ? `Peak DD ${formatPercent(attention.peakDd)} / ${attention.openLots.toFixed(2)} open lots.` : 'No current risk queue items.',
      action: 'Open EAs',
      onClick: () => onNavigate?.('advisors'),
    },
  ]

  return (
    <div className="ops-brief" aria-label="Operational command brief">
      <div className="ops-brief-head">
        <div>
          <span>Operational Brief</span>
          <b>What needs your attention?</b>
        </div>
        <em>{lastUpdate ? `Dashboard refreshed ${lastUpdate.toLocaleTimeString()}` : 'Waiting for dashboard refresh'}</em>
      </div>
      <div className="ops-brief-grid">
        {briefItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`ops-card ${item.tone}`}
            onClick={item.onClick}
            disabled={!item.onClick}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
            <em>{item.action}</em>
          </button>
        ))}
      </div>
    </div>
  )
}

function AttentionRequired({ accounts, snapshots = [] }) {
  const rows = buildRiskRows(accounts, snapshots).filter((row) => row.level !== 'clear').slice(0, 5)
  return (
    <div className="sec attention-sec">
      <div className="sec-h">
        <div><div className="sec-lbl">Admin Attention</div><div className="sec-title">Attention Required</div></div>
        <span className={`badge ${rows.some((row) => row.level === 'critical') ? 'bsell' : rows.length ? 'bwarn' : 'blive'}`}>{rows.length ? `${rows.length} to review` : 'Clear'}</span>
      </div>
      <div className="attention-list">
        {rows.length === 0 ? <div className="empty-note">No current drawdown, floating-loss, or reporter-freshness alerts.</div> : rows.map((row) => (
          <div className={`attention-row ${row.level}`} key={row.account.account_number}>
            <div>
              <strong>{accountLabel(row.account)}</strong>
              <span>{row.age.label} / Current DD {formatPercent(row.currentDd)}</span>
            </div>
            <div><span>Floating</span><b style={{ color:pclr(row.floating) }}>{fmtS(row.floating, row.account)}</b></div>
            <div><span>Open</span><b>{row.openTrades} / {row.openLots.toFixed(2)} lots</b></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ label, value, tone = '', bar, meta, compact = false }) {
  const badgeVariant = tone === 'r' ? 'loss' : tone === 'g' ? 'profit' : 'secondary'
  if (compact) {
    return (
      <div className={`kpi-compact ${tone}`}>
        <span className="kl-compact">{label}</span>
        <strong className="kv-compact">{value}</strong>
        <span className="km-compact">{meta}</span>
      </div>
    )
  }
  return (
    <Card className="kpi">
      <div className="kbar" style={{ background: bar }} />
      <CardContent className="kpi-content">
        <div className="kl">{label}</div>
        <div className={`kv ${tone}`}>{value}</div>
        <Badge variant={badgeVariant} className="km">{meta}</Badge>
      </CardContent>
    </Card>
  )
}

function ActivityTimeline({ accounts, snapshots = [], isAdmin }) {
  const items = []

  accounts.forEach((account) => {
    const age = getAge(account)
    const label = isAdmin ? accountLabel(account) : maskAccountNumber(account.account_number)

    if (age.seconds > 1800) {
      items.push({
        type: 'stale',
        level: 'critical',
        time: account.last_update ? new Date(String(account.last_update).replace(' ', 'T') + 'Z') : null,
        title: `${label} reporting offline`,
        detail: `Last sync was ${age.detail}. Check MT5 connection.`
      })
    } else {
      items.push({
        type: 'sync',
        level: 'success',
        time: account.last_update ? new Date(String(account.last_update).replace(' ', 'T') + 'Z') : null,
        title: `${label} updated`,
        detail: `Synced successfully (${age.detail}).`
      })
    }

    const currentDd = Number(account.drawdown_percent || 0)
    if (currentDd >= 5) {
      items.push({
        type: 'drawdown',
        level: currentDd >= 15 ? 'critical' : 'warning',
        time: account.last_update ? new Date(String(account.last_update).replace(' ', 'T') + 'Z') : null,
        title: `${label} Drawdown Warning`,
        detail: `Current DD at ${formatPercent(currentDd)}. Peak DD is ${formatPercent(accountMaxDrawdown(account, snapshots))}.`
      })
    }
  })

  const history = buildClosedHistoryRows(accounts).slice(0, 10)
  history.forEach((row) => {
    const label = isAdmin ? row.name : maskAccountNumber(row.account_number)
    if (row.trades > 0) {
      items.push({
        type: 'deal',
        level: row.pnl >= 0 ? 'success' : 'danger',
        time: row.date ? new Date(row.date + 'T12:00:00') : null,
        title: `${label} Closed Daily Deals`,
        detail: `Closed ${row.trades} deals (${fmtLots(row.lots)} lots) for ${fmtS(row.pnl, row)} profit.`,
        dateStr: row.date
      })
    }
  })

  const sortedItems = items.sort((a, b) => {
    if (a.level === 'critical' && b.level !== 'critical') return -1
    if (b.level === 'critical' && a.level !== 'critical') return 1
    if (a.level === 'warning' && b.level === 'success') return -1
    if (b.level === 'warning' && a.level === 'success') return 1
    const tA = a.time ? a.time.getTime() : 0
    const tB = b.time ? b.time.getTime() : 0
    return tB - tA
  }).slice(0, 8)

  if (sortedItems.length === 0) {
    return (
      <div className="rp">
        <div className="rpl">Activity Feed</div>
        <div style={{ padding: 10, color: C.t3, fontSize: 11, textAlign: 'center' }}>No activities logged yet.</div>
      </div>
    )
  }

  return (
    <div className="rp timeline-rp">
      <div className="rpl">Activity Feed</div>
      <div className="timeline-list">
        {sortedItems.map((item, idx) => {
          const typeIcon = item.type === 'stale' ? Ico.alert : item.type === 'drawdown' ? Ico.stop : item.type === 'deal' ? (item.level === 'success' ? Ico.trendUp : Ico.trendDown) : Ico.sync
          return (
            <div className={`timeline-item ${item.level}`} key={idx}>
              <div className="timeline-icon">{typeIcon}</div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-title">{item.title}</span>
                  <span className="timeline-time">
                    {item.dateStr ? item.dateStr : item.time ? item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="timeline-detail">{item.detail}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


function OverviewPage({ stats, summary, equitySeries, rankings, filteredAccounts, monthlyRows, snapshots = [], sysData, lastUpdate, periodRange, isAdmin = false, onNavigate }) {
  const [tr, setTr] = useState("ALL")
  const chartWrapRef = useRef(null)
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(null)
  const [expandedMonth, setExpandedMonth] = useState(null)

  // Format equity series for the lazy-loaded chart module
  const chartPoints = equitySeries.length >= 2 ? equitySeries : [{ date: 'Baseline', value: 0 }, { date: 'Now', value: 0 }]
  const mappedEquity = chartPoints.map((pt, i) => ({ i: pt.date, v: pt.value }))

  // Slicing logic
  const slices = { ALL: Infinity, "30D": 30, "7D": 7, "24H": 4, "6H": 2, "1H": 1 }
  const requestedSize = slices[tr] || Infinity
  const visibleData = requestedSize === Infinity ? mappedEquity : mappedEquity.slice(-requestedSize)

  useEffect(() => {
    const node = chartWrapRef.current
    if (!node) return undefined

    const update = () => {
      const rect = node.getBoundingClientRect()
      setChartSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      })
    }

    update()
    if (typeof ResizeObserver === "undefined") {
      const timer = window.setTimeout(update, 50)
      return () => window.clearTimeout(timer)
    }

    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Heatmap logic
  const history = collectHistory(filteredAccounts)
  const byDate = new Map()
  history.forEach((row) => {
    const item = byDate.get(row.date) || { date: row.date, pnl: 0, trades: 0, lots: 0, rows: [] }
    item.pnl += Number(row.daily_profit || 0)
    item.trades += Number(row.daily_trades || 0)
    item.lots += Number(row.daily_lots || 0)
    item.rows.push(row)
    byDate.set(row.date, item)
  })

  const tradeDays = Array.from(byDate.values()).filter((day) => day.trades > 0)
  const totalPnl = tradeDays.reduce((sum, day) => sum + day.pnl, 0)
  const best = tradeDays.length ? Math.max(...tradeDays.map((day) => day.pnl)) : 0
  const worst = tradeDays.length ? Math.min(...tradeDays.map((day) => day.pnl)) : 0
  const selectedHeatmapDay = selectedHeatmapDate ? byDate.get(selectedHeatmapDate) : null
  const portfolioMoneyContext = moneyContextForItems(filteredAccounts)
  const historyMoneyContext = moneyContextForItems(history)
  const newestHistoryDate = tradeDays.map((day) => day.date).sort().at(-1) || dateKey(new Date())
  const activeCalendarMonth = calendarMonth || newestHistoryDate.slice(0, 7)
  const [calendarYear, calendarMonthIndex] = activeCalendarMonth.split('-').map(Number)
  const calendarStart = new Date(calendarYear, calendarMonthIndex - 1, 1)
  const daysInMonth = new Date(calendarYear, calendarMonthIndex, 0).getDate()
  const leadingEmptyDays = calendarStart.getDay()
  const calendarCells = [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const date = `${activeCalendarMonth}-${String(dayIndex + 1).padStart(2, '0')}`
      return byDate.get(date) || { date, pnl: null, trades: 0, lots: 0, rows: [] }
    }),
  ]
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)
  const calendarWeeks = Array.from({ length: calendarCells.length / 7 }, (_, weekIndex) =>
    calendarCells.slice(weekIndex * 7, weekIndex * 7 + 7),
  )
  const calendarMonthDays = calendarCells.filter(Boolean)
  const calendarMoneyContext = moneyContextForItems(calendarMonthDays.flatMap((day) => day.rows))
  const calendarMonthPnl = calendarMonthDays.reduce((sum, day) => sum + Number(day.pnl || 0), 0)
  const maxCalendarAbs = Math.max(1, ...calendarMonthDays.map((day) => Math.abs(Number(day.pnl || 0))))
  const calendarCellStyle = (day) => {
    if (!day || day.pnl === null || day.trades <= 0) return {}
    const intensity = Math.min(0.34, 0.10 + (Math.abs(Number(day.pnl || 0)) / maxCalendarAbs) * 0.24)
    return {
      background: Number(day.pnl || 0) >= 0 ? `rgba(61,214,140,${intensity})` : `rgba(240,96,122,${intensity})`,
    }
  }
  const calendarWeekSummaries = calendarWeeks.map((week, index) => {
    const days = week.filter(Boolean)
    const rows = days.flatMap((day) => day.rows)
    return {
      week: index + 1,
      pnl: days.reduce((sum, day) => sum + Number(day.pnl || 0), 0),
      trades: days.reduce((sum, day) => sum + Number(day.trades || 0), 0),
      context: moneyContextForItems(rows),
    }
  })
  const shiftCalendarMonth = (amount) => {
    const next = new Date(calendarYear, calendarMonthIndex - 1 + amount, 1)
    setCalendarMonth(dateKey(next).slice(0, 7))
    setSelectedHeatmapDate(null)
  }
  const resetCalendarMonth = () => {
    setCalendarMonth(null)
    setSelectedHeatmapDate(null)
  }

  // Split accounts logic
  const usdGroup = filteredAccounts.filter((a) => accountCurrency(a) === 'USD')
  const usdContext = moneyContextForItems(usdGroup)
  const usdBalance = usdGroup.reduce((sum, a) => sum + Number(a.balance || 0), 0)
  const usdEquity = usdGroup.reduce((sum, a) => sum + Number(a.equity || 0), 0)

  const uscGroup = filteredAccounts.filter((a) => accountCurrency(a) === 'USC')
  const uscContext = moneyContextForItems(uscGroup)
  const uscBalance = uscGroup.reduce((sum, a) => sum + Number(a.balance || 0), 0)
  const uscEquity = uscGroup.reduce((sum, a) => sum + Number(a.equity || 0), 0)

  const staleAccounts = filteredAccounts.filter((account) => getAge(account).seconds > 1800)
  const newestReporterAge = filteredAccounts.reduce((min, account) => Math.min(min, getAge(account).seconds), Infinity)
  const maxReturn = Math.max(1, ...rankings.map((row) => Math.abs(row.returnPct)))
  const rebateSummary = buildRebateSummary(filteredAccounts)
  const periodWaiting = periodRange?.id === 'custom' && periodRange.incomplete
  const latestDayLabel = reportingDayLabel(stats.reportingDate)
  const latestDayMeta = stats.reportingDate ? stats.reportingDate : 'waiting for reporter data'

  return (
    <>
      <OperationalBrief
        accounts={filteredAccounts}
        summary={summary}
        snapshots={snapshots}
        lastUpdate={lastUpdate}
        isAdmin={isAdmin}
        onNavigate={onNavigate}
      />

      <div className="kpi-dashboard-layout">
        <div className="kpi-hero-wrap">
          <MetricCard
            label="Total Balance"
            value={fmtM(stats.totalBalance, false, portfolioMoneyContext)}
            bar={C.acc}
            meta={`Equity ${fmtM(stats.totalEquity, false, portfolioMoneyContext)} | Float ${fmtS(stats.floating, portfolioMoneyContext)}`}
          />
        </div>
        <div className="kpi-strip-wrap">
          {[
            { lbl:"Floating P&L",  val:fmtS(stats.floating, portfolioMoneyContext),     cls:stats.floating >= 0 ? "g" : "r", bar:stats.floating >= 0 ? C.grn : C.red, meta:`${formatPercent(pctOfBalance(stats.floating, stats.totalBalance))} open risk` },
            { lbl:"Monthly P&L",   val:fmtS(stats.monthPnl, portfolioMoneyContext),     cls:stats.monthPnl >= 0 ? "g" : "r", bar:stats.monthPnl >= 0 ? C.grn : C.red, meta:`${formatPercent(pctOfBalance(stats.monthPnl, stats.totalBalance))} this month` },
            { lbl:"Weekly P&L",    val:fmtS(stats.weekPnl, portfolioMoneyContext),      cls:stats.weekPnl >= 0 ? "g" : "r", bar:stats.weekPnl >= 0 ? C.grn : C.red, meta:`${formatPercent(pctOfBalance(stats.weekPnl, stats.totalBalance))} this week` },
            { lbl:`${latestDayLabel} P&L`, val:fmtS(stats.dayPnl, portfolioMoneyContext), cls:stats.dayPnl >= 0 ? "g" : "r", bar:stats.dayPnl >= 0 ? C.grn : C.red, meta:latestDayMeta },
          ].map(k => (
            <MetricCard key={k.lbl} label={k.lbl} value={k.val} tone={k.cls} bar={k.bar} meta={k.meta} compact={true} />
          ))}
        </div>
      </div>

      <div className="period-insight">
        <div>
          <span>Selected Period</span>
          <b>{periodRange?.label || 'All Time'}</b>
        </div>
        <div>
          <span>Period P&L</span>
          <b style={{ color:periodWaiting ? C.t3 : pclr(stats.selectedPnl) }}>{periodWaiting ? 'Waiting for date range' : fmtS(stats.selectedPnl, portfolioMoneyContext)}</b>
        </div>
        <div>
          <span>Closed Deals / Lots</span>
          <b>{periodWaiting ? '-- / --' : `${stats.selectedTrades} / ${stats.selectedLots.toFixed(2)}`}</b>
        </div>
        <div>
          <span>Profitable / Loss Account-Days</span>
          <b>{periodWaiting ? '-- / --' : `${stats.selectedWinDays} / ${stats.selectedLossDays}`}</b>
        </div>
        <div>
          <span>Best / Worst</span>
          <b>{periodWaiting ? '-- / --' : <><em style={{ color:C.grn }}>{fmtS(stats.selectedBest, portfolioMoneyContext)}</em> <em style={{ color:C.red }}>{fmtS(stats.selectedWorst, portfolioMoneyContext)}</em></>}</b>
        </div>
      </div>

      <div className="stat-row">
        {[
          { l:"Active EAs / Live Ports", v:`${summary.activeEas} / ${summary.liveAccounts}`, c:"a", s:"reporting / configured" },
          { l:"Open Trades Exposure", v:summary.openTrades.toString(), c:"", s:"currently running trades" },
          { l:"Closed Deals / Lots Today", v:`${summary.todayTrades} / ${summary.totalLots.toFixed(2)}`, c:"", s:"closed volume" },
          { l:"Profitable Day Rate", v:formatPercent(summary.overallWinRate), c:"g", s:`${summary.tradeDays} trading days` },
        ].map(s => (
          <div className="stat" key={s.l}>
            <div className="sl">{s.l}</div>
            <div className={`sv ${s.c}`}>{s.v}</div>
            <div className="ss">{s.s}</div>
          </div>
        ))}
      </div>

      {isAdmin && <AttentionRequired accounts={filteredAccounts} snapshots={snapshots} />}

      <div className="acct-row">
        <div className="ac">
          <div className="ach2">
            <span className="an">USD Accounts</span>
            <span className="chip ca">{usdGroup.length} ports</span>
          </div>
          <div className="ag">
            {[["Balance",fmtM(usdBalance, false, usdContext)],["Equity",fmtM(usdEquity, false, usdContext)],["Floating",fmtS(usdEquity - usdBalance, usdContext)]].map(([l,v]) => (
              <div key={l}><div className="asl">{l}</div><div className="asv" style={l==="Floating"?{color:pclr(usdEquity - usdBalance)}:{}}>{v}</div></div>
            ))}
          </div>
        </div>
        {uscGroup.length > 0 && (
          <div className="ac">
            <div className="ach2">
              <span className="an">USC Accounts</span>
              <span className="chip cd">{uscGroup.length} ports</span>
            </div>
            <div className="ag">
              {[["Balance",fmtM(uscBalance, false, uscContext)],["Equity",fmtM(uscEquity, false, uscContext)],["Floating",fmtS(uscEquity - uscBalance, uscContext)]].map(([l,v]) => (
                <div key={l}><div className="asl">{l}</div><div className="asv" style={l==="Floating"?{color:pclr(uscEquity - uscBalance)}:{}}>{v}</div></div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="ov">
        <div>
          <div className="sec" style={{ marginBottom:9 }}>
            <div className="sec-h">
              <div>
                <div className="sec-lbl">Equity Curve</div>
                <div className="sec-title">{mappedEquity.length > 0 ? fmtM(mappedEquity[mappedEquity.length - 1].v, false, portfolioMoneyContext) : "$0.00"}</div>
              </div>
              <div className="tbts">
                {["1H","6H","24H","7D","30D","ALL"].map(t => (
                  <button key={t} className={`tbt${tr===t?" on":""}`} onClick={() => setTr(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="cwrap" ref={chartWrapRef}>
              {chartSize.width > 0 && chartSize.height > 0 ? (
                <React.Suspense fallback={<div className="chart-loading">Loading chart...</div>}>
                  <EquityAreaChart
                    width={chartSize.width}
                    height={chartSize.height}
                    data={visibleData}
                    accentColor={C.acc}
                    mutedColor={C.t3}
                  />
                </React.Suspense>
              ) : null}
            </div>
          </div>

          <div className="sec">
            <div className="sec-h">
              <div>
                <div className="sec-lbl">EA Performance Comparison</div>
                <div className="sec-title">Top Portfolios</div>
              </div>
              <span className="chip ca">{rankings.length} ranked</span>
            </div>
            {rankings.length === 0 ? <div style={{padding:20, color:C.t3, fontSize:12, textAlign:'center'}}>No ranking data available yet.</div> : null}
            {rankings.length > 0 ? (
              <div className="perf-bars">
                {rankings.slice(0, 8).map((p, idx) => {
                  const positive = p.returnPct >= 0
                  return (
                    <div className="perf-row" key={`perf-${p.account.account_number}`}>
                      <div className="perf-name"><span>{idx + 1}</span>{accountLabel(p.account)}</div>
                      <div className="perf-track">
                        <div
                          className={`perf-fill ${positive ? 'positive' : 'negative'}`}
                          style={{ width: `${Math.max(2, (Math.abs(p.returnPct) / maxReturn) * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <div className="perf-value" style={{ color: positive ? C.grn : C.red }}>{p.returnPct.toFixed(1)}%</div>
                    </div>
                  )
                })}
              </div>
            ) : null}
            {rankings.slice(0, 5).map((p, idx) => (
              <div className="pi" key={p.account.account_number}>
                <div className={`rk r${idx+1 < 4 ? idx+1 : 4}`}>{idx+1}</div>
                <div className="pif">
                  <div className="pn">{accountLabel(p.account)}</div>
                  <div className="pb">{p.account.broker || 'Unknown broker'}</div>
                </div>
                <div className="pst">
                  <div className="ppct">{p.returnPct.toFixed(2)}%</div>
                  <div className="pbar"><div className="pfill" style={{ width:`${Math.min(100, (p.returnPct/Math.max(1, rankings[0].returnPct))*100).toFixed(1)}%` }} /></div>
                  <div className="ppnl">{fmtS(p.closedProfit)}</div>
                  <div className="pwin">{p.winRate.toFixed(0)}% profitable account-days</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="rp">
            <div className="rpl"><span className={staleAccounts.length ? "" : "ldot"} />Data Freshness</div>
            <div style={{ fontFamily:C.fh, fontSize:17, fontWeight:600, color: staleAccounts.length ? C.red : C.grn, marginBottom:4 }}>
              {staleAccounts.length ? `${staleAccounts.length} stale` : 'Live'}
            </div>
            <div className="rps">{staleAccounts.length ? 'Reporter has not pushed current MT5 data for some accounts.' : 'All monitored accounts are updating normally.'}</div>
            <div className="freshness-meta">
              <span>Reporter {newestReporterAge === Infinity ? 'waiting' : `${Math.round(newestReporterAge)}s ago`}</span>
              <span>Dashboard {lastUpdate ? lastUpdate.toLocaleTimeString() : 'waiting'}</span>
            </div>
          </div>
          {isAdmin && (
            <>
              <div className="rp">
                <div className="rpl">Server Health</div>
                {[["CPU",sysData?.cpu_percent || 0],["RAM",sysData?.ram_percent || 0],["Disk",sysData?.disk_percent || 0]].map(([l,v]) => (
                  <div className="sv2" key={l}>
                    <span className="svl">{l}</span>
                    <div className="svb"><div className="svf" style={{ width:`${Math.max(v,0.5)}%`, background:resourceTone(v) }} /></div>
                    <span className="svv" style={{ color:resourceTone(v) }}>{v.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <div className="rp">
                <div className="rpl">Last Dashboard Sync</div>
                <div style={{ fontFamily:C.fn, fontSize:18, fontWeight:600, color:C.t1, marginTop:4 }}>{lastUpdate ? lastUpdate.toLocaleTimeString() : 'Waiting'}</div>
              </div>
            </>
          )}
          <ActivityTimeline accounts={filteredAccounts} snapshots={snapshots} isAdmin={isAdmin} />
          <WeekendExposureCard accounts={filteredAccounts} compact />
          {rebateSummary.hasData && <RebateSummaryCard accounts={filteredAccounts} />}
        </div>
      </div>

      <div className="sec" style={{ marginBottom:9 }}>
        <div className="sec-h">
          <div>
            <div className="sec-lbl">Daily P&L Heatmap</div>
            <div className="sec-title">Monthly trading calendar</div>
          </div>
          <div className="calendar-title">
            <b>{calendarStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</b>
            <span>Monthly P/L <em style={{ color:pclr(calendarMonthPnl) }}>{fmtS(calendarMonthPnl, calendarMoneyContext)}</em></span>
          </div>
        </div>
        <div className="calendar-toolbar">
          <button type="button" onClick={() => shiftCalendarMonth(-1)} aria-label="Previous month">&lt;</button>
          <button type="button" onClick={resetCalendarMonth}>Today</button>
          <button type="button" onClick={() => shiftCalendarMonth(1)} aria-label="Next month">&gt;</button>
        </div>
        <div className="monthly-calendar" role="grid" aria-label="Monthly daily profit and loss calendar">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Summary'].map((label) => (
            <div className="calendar-head-cell" key={label}>{label}</div>
          ))}
          {calendarWeeks.map((week, weekIndex) => (
            <React.Fragment key={`week-${weekIndex}`}>
              {week.map((day, dayIndex) => {
                const dayContext = day ? moneyContextForItems(day.rows) : null
                const dayNumber = day ? Number(day.date.slice(-2)) : ''
                return (
                  <button
                    key={`${weekIndex}-${dayIndex}`}
                    type="button"
                    className={cn(
                      'calendar-day',
                      !day && 'empty',
                      day?.trades > 0 && Number(day.pnl || 0) >= 0 && 'positive',
                      day?.trades > 0 && Number(day.pnl || 0) < 0 && 'negative',
                      selectedHeatmapDate === day?.date && 'selected',
                    )}
                    style={calendarCellStyle(day)}
                    disabled={!day}
                    title={day?.trades > 0 ? `${day.date} ${fmtS(day.pnl, dayContext)} / ${day.trades} closed deals` : `${day?.date || ''} No closed deals`}
                    onClick={() => day && setSelectedHeatmapDate(day.date)}
                  >
                    {day ? (
                      <>
                        <span className="calendar-date">{dayNumber}</span>
                        {day.trades > 0 ? (
                          <span className="calendar-day-body">
                            <strong style={{ color:pclr(day.pnl) }}>{fmtS(day.pnl, dayContext)}</strong>
                            <em data-short={day.trades}>{day.trades} deals</em>
                          </span>
                        ) : null}
                      </>
                    ) : null}
                  </button>
                )
              })}
              <div className="calendar-week-summary">
                <span>Week {calendarWeekSummaries[weekIndex].week}</span>
                <b style={{ color:pclr(calendarWeekSummaries[weekIndex].pnl) }}>{fmtS(calendarWeekSummaries[weekIndex].pnl, calendarWeekSummaries[weekIndex].context)}</b>
                <em>{calendarWeekSummaries[weekIndex].trades} deals</em>
              </div>
            </React.Fragment>
          ))}
        </div>
        {selectedHeatmapDay ? (
          <div className="heatmap-detail">
            <div>
              <span>{selectedHeatmapDay.date}</span>
              <b style={{ color:pclr(selectedHeatmapDay.pnl) }}>{fmtS(selectedHeatmapDay.pnl, moneyContextForItems(selectedHeatmapDay.rows))}</b>
              <em>{selectedHeatmapDay.trades} closed deals / {selectedHeatmapDay.lots.toFixed(2)} lots</em>
            </div>
            <div className="heatmap-detail-list">
              {selectedHeatmapDay.rows.slice(0, 5).map((row) => (
                <div key={`${row.account_number}-${row.date}`}>
                  <span>{row.name}</span>
                  <b style={{ color:pclr(row.daily_profit) }}>{fmtS(row.daily_profit, row)}</b>
                  <em>{Number(row.daily_trades || 0)} closed deals</em>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="heatmap-detail muted">Select any calendar day to inspect account-level P&L.</div>
        )}
        <div className="hmst">
          <div><div className="sl" style={{marginBottom:3}}>All-Time P&L</div><div style={{fontFamily:C.fn,fontSize:14,fontWeight:600,color: totalPnl >= 0 ? C.grn : C.red}}>{fmtS(totalPnl, historyMoneyContext)}</div></div>
          <div><div className="sl" style={{marginBottom:3}}>Best Day</div><div style={{fontFamily:C.fn,fontSize:14,fontWeight:600,color:C.grn}}>{fmtS(best, historyMoneyContext)}</div></div>
          <div><div className="sl" style={{marginBottom:3}}>Worst Day</div><div style={{fontFamily:C.fn,fontSize:14,fontWeight:600,color:C.red}}>{fmtS(worst, historyMoneyContext)}</div></div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-h">
          <div>
            <div className="sec-lbl">Monthly P&L Summary</div>
            <div className="sec-title">Normalized account performance</div>
          </div>
          <span className="chip cd">{monthlyRows.length} months</span>
        </div>
        {monthlyRows.length === 0 ? <div style={{padding:20, color:C.t3, fontSize:12, textAlign:'center'}}>No monthly data available.</div> : (
          <div style={{overflowX:'auto'}}>
            <table className="tbl">
              <thead><tr><th>Month</th><th>P&L</th><th>Closed Deals</th><th>Profitable / Loss Account-Days</th><th>Best</th><th>Worst</th></tr></thead>
              <tbody>
                {monthlyRows.map(row => (
                  <React.Fragment key={row.month}>
                    <tr className="expandable-row" onClick={() => setExpandedMonth((current) => current === row.month ? null : row.month)}>
                    <td data-label="Month" className="tm"><button type="button" className="expand-btn">{expandedMonth === row.month ? '-' : '+'}</button>{row.month}</td>
                    <td data-label="P&L" className="tm" style={{color:row.pnl>=0?C.grn:C.red,fontWeight:600}}>{fmtS(row.pnl, row.money_context)}</td>
                    <td data-label="Closed Deals" className="tm">{row.trades}</td>
                    <td data-label="Profitable / Loss Account-Days" className="tm" style={{color:C.grn}}>{row.winDays} / {row.lossDays}</td>
                    <td data-label="Best" className="tm" style={{color:C.grn}}>{fmtS(row.bestDay || 0, row.money_context)}</td>
                    <td data-label="Worst" className="tm" style={{color:C.red}}>{fmtS(row.worstDay || 0, row.money_context)}</td>
                    </tr>
                    {expandedMonth === row.month ? (
                      <tr className="month-detail-row">
                        <td colSpan="6">
                          <div className="month-detail-grid">
                            {row.accounts.slice(0, 8).map((account) => (
                              <div key={`${row.month}-${account.account_number}`}>
                                <span>{account.name}</span>
                                <b style={{ color:pclr(account.pnl) }}>{fmtS(account.pnl, account)}</b>
                                <em>{account.trades} closed deals / {account.lots.toFixed(2)} lots</em>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function MiniLineChart({ points }) {
  const width = 720
  const height = 150
  const chartPoints = points.length >= 2 ? points : [{ date: 'Baseline', value: 0 }, { date: 'Now', value: 0 }]
  const values = chartPoints.map((point) => Number(point.value || 0))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const coords = chartPoints.map((point, index) => {
    const x = chartPoints.length === 1 ? width : (index / (chartPoints.length - 1)) * width
    const y = height - ((Number(point.value || 0) - min) / range) * (height - 26) - 13
    return { ...point, x, y }
  })
  const pointString = coords.map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(' ')
  const area = `0,${height} ${pointString} ${width},${height}`
  return (
    <svg className="detail-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Selected EA equity trend">
      <defs>
        <linearGradient id="detailLineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={C.acc} stopOpacity="0.28" />
          <stop offset="100%" stopColor={C.acc} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={`M ${area} Z`} fill="url(#detailLineFill)" />
      <polyline points={pointString} fill="none" stroke={C.acc} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {coords.slice(-1).map((coord) => <circle key={coord.date} cx={coord.x} cy={coord.y} r="4" />)}
    </svg>
  )
}

function MiniPnlBars({ points, balance = 0 }) {
  const [activeIndex, setActiveIndex] = useState(null)
  const width = 360
  const height = 126
  const maxAbs = Math.max(1, ...points.map((point) => Math.abs(Number(point.value || 0))))
  const hasPositive = points.some((point) => Number(point.value || 0) > 0)
  const hasNegative = points.some((point) => Number(point.value || 0) < 0)
  const plotTop = 14
  const plotBottom = height - 20
  const baseline = hasPositive && hasNegative
    ? Math.round((plotTop + plotBottom) / 2)
    : hasNegative
      ? plotTop + 2
      : plotBottom - 2
  const slot = width / Math.max(points.length, 1)
  const dense = points.length > 8
  const barWidth = Math.min(dense ? 20 : 32, slot * (dense ? 0.58 : 0.48))
  const availableHeight = hasPositive && hasNegative
    ? Math.max(12, Math.min(baseline - plotTop, plotBottom - baseline) - 6)
    : hasNegative
      ? Math.max(12, plotBottom - baseline - 6)
      : Math.max(12, baseline - plotTop - 6)
  const safeBalance = Math.abs(Number(balance || 0))
  const percentOfBalance = (value) => safeBalance > 0 ? (Number(value || 0) / safeBalance) * 100 : null
  const shortPercent = (value) => {
    const percent = percentOfBalance(value)
    if (percent === null) return '--'
    const decimals = Math.abs(percent) >= 100 ? 0 : 1
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(decimals)}%`
  }
  const activePoint = activeIndex === null ? null : points[activeIndex]
  const activeValue = Number(activePoint?.value || 0)
  const activePercent = percentOfBalance(activeValue)
  const activeX = activeIndex === null ? 0 : activeIndex * slot + slot / 2
  const tooltipWidth = 156
  const tooltipX = Math.max(2, Math.min(width - tooltipWidth - 2, activeX - tooltipWidth / 2))
  return (
    <svg
      className="mini-pnl-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Period P&L chart with percentage of current balance"
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') setActiveIndex(null)
      }}
    >
      <line x1="0" x2={width} y1={baseline} y2={baseline} className="mini-axis" />
      {points.map((point, index) => {
        const value = Number(point.value || 0)
        const barHeight = value === 0 ? 0 : Math.max(5, (Math.abs(value) / maxAbs) * availableHeight)
        const x = index * slot + (slot - barWidth) / 2
        const y = value >= 0 ? baseline - barHeight : baseline
        const valueLabelY = value >= 0 ? Math.max(10, y - 5) : Math.min(height - 19, baseline + barHeight + 10)
        return (
          <g
            className={`mini-bar-group ${activeIndex === index ? 'active' : ''}`}
            key={point.key || point.label}
            tabIndex="0"
            role="button"
            aria-label={`${point.key || point.label}: ${fmtS(value)}, ${shortPercent(value)} of current balance`}
            onPointerEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
          >
            <rect
              className="mini-hit-area"
              x={index * slot}
              y="0"
              width={slot}
              height={height}
              onPointerDown={(event) => {
                event.stopPropagation()
                setActiveIndex(index)
              }}
              onClick={(event) => {
                event.stopPropagation()
                setActiveIndex(index)
              }}
            />
            {value !== 0 ? <rect className={value >= 0 ? 'mini-bar positive' : 'mini-bar negative'} x={x} y={y} width={barWidth} height={barHeight} rx="3" /> : null}
            {value !== 0 ? (
              <text
                className={`mini-pct-label ${value >= 0 ? 'positive' : 'negative'} ${dense ? 'dense' : ''}`}
                x={x + barWidth / 2}
                y={valueLabelY}
                textAnchor="middle"
              >
                {shortPercent(value)}
              </text>
            ) : null}
            <text x={x + barWidth / 2} y={height - 4} textAnchor="middle">{point.label}</text>
          </g>
        )
      })}
      {activePoint ? (
        <g className="mini-chart-tooltip" pointerEvents="none">
          <rect x={tooltipX} y="2" width={tooltipWidth} height="48" rx="7" />
          <text className="mini-tooltip-title" x={tooltipX + 10} y="17">{activePoint.key || activePoint.label}</text>
          <text className={activeValue >= 0 ? 'mini-tooltip-value positive' : 'mini-tooltip-value negative'} x={tooltipX + 10} y="32">
            {activePercent === null ? '--' : `${activePercent >= 0 ? '+' : ''}${activePercent.toFixed(2)}%`}
          </text>
          <text className="mini-tooltip-money" x={tooltipX + tooltipWidth - 10} y="32" textAnchor="end">{fmtS(activeValue)}</text>
          <text className="mini-tooltip-note" x={tooltipX + 10} y="43">% of current balance</text>
        </g>
      ) : null}
    </svg>
  )
}

function PeriodCard({ label, stats, balance, moneyContext = null }) {
  const positive = Number(stats.pnl || 0) >= 0
  const rebateLots = Number(stats.rebateLots || 0)
  const rawLots = Number(stats.lots || 0)
  const showRebateLots = rebateLots > 0 && Math.abs(rebateLots - rawLots) > 0.0001
  return (
    <div className={`period-card ${positive ? 'positive' : 'negative'}`}>
      <div className="period-card-head">
        <span>{label}</span>
        <strong>{fmtS(stats.pnl, moneyContext)}</strong>
      </div>
      <div className="period-meta">
        <span>{stats.trades} closed deals</span>
        <span>{Number(stats.lots || 0).toFixed(2)} lots</span>
        {showRebateLots && <span>{rebateLots.toFixed(4)} rebate lots</span>}
        <span>{fmtM(stats.rebate)} rebate</span>
      </div>
      <MiniPnlBars points={stats.series} balance={balance} />
    </div>
  )
}

function StatusBadge({ age }) {
  return <Badge className={`badge ${age.seconds < 330 ? 'blive' : age.seconds < 1800 ? 'bbuy' : 'bsell'}`}>{age.label}</Badge>
}

function AccountDrilldown({ account, snapshots = [] }) {
  if (!account) return null
  const stats = buildAccountPeriodStats(account)
  const equityPoints = buildEquitySeries([account], snapshots).slice(-180)
  const floating = Number(account.equity || 0) - Number(account.balance || 0)
  const closedProfit = accountClosedProfit(account)
  const profile = inferEaProfile(account, snapshots)
  const openLots = accountOpenLots(account)
  const openTrades = Number(account.open_positions || (account.open_trades || account.trades || []).length || 0)
  const closedLots = accountClosedLots(account)
  const totalRebateLots = accountRebateLots(account)
  const totalRebate = accountRebate(account)
  const rebateRate = accountRebateRate(account)
  const recentDays = (account.daily_history || []).slice(0, 7)
  return (
    <Card className="ea-detail" id="ea-detail">
      <CardHeader className="ea-detail-head p-0">
        <div>
          <div className="sec-lbl">Selected Expert Advisor</div>
          <CardTitle className="ea-detail-title">{accountLabel(account)}</CardTitle>
          <CardDescription className="ea-detail-sub">{maskAccountNumber(account.account_number)} | {account.broker || 'Unknown broker'}</CardDescription>
          <div className="tag-row">
            <Badge variant="secondary" className="mini-tag">{profile.strategy}</Badge>
            <Badge variant="outline" className={`mini-tag risk-${profile.level}`}>{profile.risk}</Badge>
          </div>
        </div>
        <div className="ea-detail-dd">
          <span>Peak DD</span>
          <strong>{formatPercent(accountMaxDrawdown(account, snapshots))}</strong>
        </div>
      </CardHeader>
      <CardContent className="ea-detail-body p-0">
        <div className="ea-detail-grid">
          <div className="ea-equity-card">
            <div className="detail-stat-row">
              <div><span>Balance</span><b>{fmtM(account.balance, false, account)}</b></div>
              <div><span>Equity</span><b>{fmtM(account.equity, false, account)}</b></div>
              <div><span>Floating</span><b style={{ color:pclr(floating) }}>{fmtS(floating, account)}</b></div>
              <div><span>Total Closed P&L</span><b style={{ color:pclr(closedProfit) }}>{fmtS(closedProfit, account)}</b></div>
            </div>
            <MiniLineChart points={equityPoints} />
            <div className="detail-risk-row">
              <div><span>Open Trades</span><b>{openTrades}</b></div>
              <div><span>Open Lots</span><b>{openLots.toFixed(2)}</b></div>
              <div><span>Closed Lots</span><b>{fmtLots(closedLots)}</b></div>
              <div><span>Rebate Lots</span><b>{fmtLots(totalRebateLots)}</b></div>
              <div><span>Total Rebate</span><b style={{ color:C.grn }}>{fmtM(totalRebate)}</b></div>
              <div><span>Rebate Rate</span><b>{fmtM(rebateRate)} / lot</b></div>
              <div><span>Peak DD Amount</span><b style={{ color:C.red }}>{fmtM(accountPeakDrawdownAmount(account), false, account)}</b></div>
            </div>
          </div>
          <div className="period-grid">
            <PeriodCard label={`${reportingDayLabel(stats.today.reportingDate)} Profit / Loss`} stats={stats.today} balance={account.balance} moneyContext={account} />
            <PeriodCard label="Weekly Profit / Loss" stats={stats.week} balance={account.balance} moneyContext={account} />
            <PeriodCard label="Monthly Profit / Loss" stats={stats.month} balance={account.balance} moneyContext={account} />
          </div>
        </div>
        <div className="detail-history">
          <div className="sec-lbl">Recent Daily Performance</div>
          <div className="detail-history-list">
            {recentDays.length === 0 ? <div className="empty-note">No daily history for this EA yet.</div> : recentDays.map((row) => (
              <div className="detail-day" key={`${account.account_number}-${row.date}`}>
                <span>{row.date}</span>
                <b style={{ color:pclr(row.daily_profit) }}>{fmtS(row.daily_profit, account)}</b>
                <em>{Number(row.daily_trades || 0)} closed deals</em>
                <em>{Number(row.daily_lots || 0).toFixed(2)} lots</em>
                {numericField(row, ['daily_rebate_lots', 'rebate_lots']) !== null && <em>{Number(numericField(row, ['daily_rebate_lots', 'rebate_lots']) || 0).toFixed(4)} rebate lots</em>}
                <em>{fmtM(numericField(row, ['daily_rebate', 'rebate', 'total_rebate']) ?? (Number(row.daily_lots || 0) * rebateRate))} rebate</em>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AdvisorsPage({ accounts, snapshots, onEditName, onDeleteAccount, isAdmin }) {
  const [sortField, setSortField] = useState('equity')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(false) }
  }

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      let valA, valB
      if (sortField === 'equity') { valA = Number(a.equity||0); valB = Number(b.equity||0) }
      else if (sortField === 'balance') { valA = Number(a.balance||0); valB = Number(b.balance||0) }
      else if (sortField === 'floating') { valA = Number(a.equity||0)-Number(a.balance||0); valB = Number(b.equity||0)-Number(b.balance||0) }
      else if (sortField === 'dd') { valA = accountMaxDrawdown(a, snapshots); valB = accountMaxDrawdown(b, snapshots) }
      else if (sortField === 'name') { valA = accountLabel(a); valB = accountLabel(b) }

      if (typeof valA === 'string') return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      return sortAsc ? valA - valB : valB - valA
    })
  }, [accounts, sortField, sortAsc])

  const selectedAccountData = accounts.find((account) => account.account_number === selectedAccount) || accounts[0] || null
  const selectAccount = (accountNumber) => {
    setSelectedAccount(accountNumber)
    window.setTimeout(() => {
      document.getElementById('ea-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 30)
  }
  const renderAdminActions = (ea) => {
    if (!isAdmin) return null
    return (
      <TooltipProvider delayDuration={150}>
        <span className="ea-admin-actions">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={`Edit ${accountLabel(ea)} name`}
                className="advisor-icon-button"
                variant="ghost"
                size="icon"
                onClick={(event) => { event.stopPropagation(); onEditName(ea) }}
              >
                {Ico.edit}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit display name</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={`Delete ${accountLabel(ea)} portfolio`}
                className="advisor-icon-button danger"
                variant="ghost"
                size="icon"
                onClick={(event) => { event.stopPropagation(); onDeleteAccount(ea) }}
              >
                {Ico.trash}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete portfolio</TooltipContent>
          </Tooltip>
        </span>
      </TooltipProvider>
    )
  }

  return (
    <>
      <div className="eagrid">
        {sortedAccounts.map(ea => {
          const floating = Number(ea.equity || 0) - Number(ea.balance || 0)
          const age = getAge(ea)
          const dailyProfit = accountTodayProfit(ea)
          const todayTrades = accountTodayTrades(ea)
          const todayLots = accountTodayLots(ea)
          const maxDrawdown = accountMaxDrawdown(ea, snapshots)
          const openLots = accountOpenLots(ea)
          const isSelected = selectedAccountData?.account_number === ea.account_number
          const profile = inferEaProfile(ea, snapshots)

          return (
            <Card
              className={cn('eac', isSelected && 'selected', 'risk-' + profile.level)}
              key={ea.account_number}
              onClick={() => selectAccount(ea.account_number)}
            >
              <div className="eatop" style={{ background: profile.level === 'high' || profile.level === 'extreme' ? C.red : profile.level === 'medium' ? C.yel : floating >= 0 ? C.grn : C.blu }} />
              <CardHeader className="each p-0">
                <div style={{minWidth:0, paddingRight:10}}>
                  <div className="eaname" style={{display:'flex', alignItems:'center', gap:6}}>
                    <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{accountLabel(ea)}</span>
                    {renderAdminActions(ea)}
                  </div>
                  <div className="eaacct">{maskAccountNumber(ea.account_number)}</div>
                  <div className="eabkr">{ea.broker || 'Unknown broker'}</div>
                  <div className="tag-row">
                    <Badge variant="secondary" className="mini-tag">{profile.strategy}</Badge>
                    <Badge variant="outline" className={`mini-tag risk-${profile.level}`}>{profile.risk}</Badge>
                  </div>
                </div>
                <StatusBadge age={age} />
              </CardHeader>
              <CardContent className="eakg-new">
                <div className="eak-full">
                  <div className="eak-balance-equity">
                    <div>
                      <span className="eakl">Balance</span>
                      <strong className="eakv">{fmtM(ea.balance, false, ea)}</strong>
                    </div>
                    <div>
                      <span className="eakl">Equity</span>
                      <strong className="eakv">{fmtM(ea.equity, false, ea)}</strong>
                    </div>
                  </div>
                </div>
                {[
                  ["Peak DD",   maxDrawdown.toFixed(2)+"%", maxDrawdown>5?"r":"y"],
                  ["Floating",  fmtS(floating, ea),    floating>=0?"g":"r"],
                  [`${reportingDayLabel(latestHistoryRow(ea)?.date)} P&L`, fmtS(dailyProfit, ea), dailyProfit>=0?"g":"r"],
                  [`${reportingDayLabel(latestHistoryRow(ea)?.date)} Rebate`, fmtM(accountTodayRebate(ea)), "g"],
                  ["Open Lots", openLots.toFixed(2), ""],
                ].map(([l,v,c]) => {
                  const isHighlight = l.includes("P&L")
                  return (
                    <div className={cn("eak", isHighlight && "eak-highlight", isHighlight && c)} key={l}>
                      <div className="eakl">{l}</div>
                      <div className={`eakv${c?" "+c:""}`}>{v}</div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
      <AccountDrilldown account={selectedAccountData} snapshots={snapshots} />
      <div className="sec">
        <div className="sec-h">
          <div>
            <div className="sec-lbl">Account Health</div>
            <div className="sec-title">Monitored Portfolios</div>
          </div>
          <span className="chip ca">{accounts.length} accounts</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{cursor:'pointer'}} onClick={()=>handleSort('name')}>Name {sortField==='name'?(sortAsc?'↑':'↓'):''}</th>
                <th>Account</th>
                <th>Broker</th>
                <th style={{cursor:'pointer'}} onClick={()=>handleSort('balance')}>Balance {sortField==='balance'?(sortAsc?'↑':'↓'):''}</th>
                <th style={{cursor:'pointer'}} onClick={()=>handleSort('equity')}>Equity {sortField==='equity'?(sortAsc?'↑':'↓'):''}</th>
                <th style={{cursor:'pointer'}} onClick={()=>handleSort('floating')}>Floating {sortField==='floating'?(sortAsc?'↑':'↓'):''}</th>
                <th style={{cursor:'pointer'}} onClick={()=>handleSort('dd')}>Peak DD {sortField==='dd'?(sortAsc?'↑':'↓'):''}</th>
                <th>Closed Lots</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedAccounts.map(ea => {
                const floating = Number(ea.equity || 0) - Number(ea.balance || 0)
                const age = getAge(ea)
                const maxDrawdown = accountMaxDrawdown(ea, snapshots)
                return (
                  <tr key={ea.account_number} className={selectedAccountData?.account_number === ea.account_number ? 'selected-row' : ''} onClick={() => selectAccount(ea.account_number)}>
                    <td data-label="Name" className="tn">
                      <div style={{display:'flex', alignItems:'center', gap:6}}>
                        {accountLabel(ea)}
                        {isAdmin && (
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  aria-label={`Edit ${accountLabel(ea)} name`}
                                  className="advisor-icon-button table-edit"
                                  variant="ghost"
                                  size="icon"
                                  onClick={(event) => { event.stopPropagation(); onEditName(ea) }}
                                >
                                  {Ico.edit}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit display name</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                    <td data-label="Account" className="tm">{maskAccountNumber(ea.account_number)}</td>
                    <td data-label="Broker" style={{color:C.t3,fontSize:11}}>{ea.broker}</td>
                    <td data-label="Balance" className="tm">{fmtM(ea.balance, false, ea)}</td>
                    <td data-label="Equity" className="tm">{fmtM(ea.equity, false, ea)}</td>
                    <td data-label="Floating" className="tm" style={{color:pclr(floating)}}>{fmtS(floating, ea)}</td>
                    <td data-label="Peak DD" className="tm" style={{color:C.yel}}>{formatPercent(maxDrawdown)}</td>
                    <td data-label="Closed Lots" className="tm">{fmtLots(accountClosedLots(ea))}</td>
                    <td data-label="Status"><StatusBadge age={age} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function SymbolsPage({ symbols }) {
  const [category, setCategory] = useState('all')
  const categories = Array.from(new Set(symbols.map((symbol) => symbol.category))).sort()
  const visibleSymbols = category === 'all' ? symbols : symbols.filter((symbol) => symbol.category === category)
  const symbolsMoneyContext = moneyContextForItems(visibleSymbols.map((symbol) => symbol.money_context).filter(Boolean))
  const summary = visibleSymbols.reduce((acc, symbol) => ({
    trades: acc.trades + symbol.trades,
    lots: acc.lots + symbol.lots,
    profit: acc.profit + symbol.profit,
    accounts: acc.accounts + symbol.accounts,
  }), { trades: 0, lots: 0, profit: 0, accounts: 0 })
  const maxLots = Math.max(1, ...visibleSymbols.map((symbol) => Math.abs(symbol.lots)))
  return (
    <>
      <div className="history-summary symbols-summary">
        <MetricCard label="Open Symbols" value={visibleSymbols.length} tone="a" bar={C.acc} meta={category === 'all' ? 'all categories' : category} />
        <MetricCard label="Open Trades" value={summary.trades} bar={C.blu} meta="symbol exposure" />
        <MetricCard label="Total Lots" value={summary.lots.toFixed(2)} bar={C.yel} meta="combined volume" />
        <MetricCard label="Floating P&L" value={fmtS(summary.profit, symbolsMoneyContext)} tone={summary.profit >= 0 ? 'g' : 'r'} bar={summary.profit >= 0 ? C.grn : C.red} meta="unrealized" />
      </div>
      <Card className="sec">
        <CardHeader className="sec-h symbol-section-head p-0">
          <div><div className="sec-lbl">Symbol Performance Analysis</div><div className="sec-title">Lots, direction, and floating exposure</div></div>
          <div className="ftabs">
            <Button variant="ghost" className={`ftab${category === 'all' ? ' on' : ''}`} onClick={() => setCategory('all')}>All <span className="fcnt">{symbols.length}</span></Button>
            {categories.map((item) => (
              <Button key={item} variant="ghost" className={`ftab${category === item ? ' on' : ''}`} onClick={() => setCategory(item)}>
                {item} <span className="fcnt">{symbols.filter((symbol) => symbol.category === item).length}</span>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="symbol-grid p-0">
          {visibleSymbols.length === 0 ? <div style={{color:C.t3, fontSize:13}}>No open exposure.</div> : visibleSymbols.map(sym => (
            <Card className="symcard" key={sym.symbol}>
              <CardHeader className="symrow p-0">
                <CardTitle className="symname">{sym.symbol}</CardTitle>
                <Badge variant="secondary" className="mini-tag">{sym.category}</Badge>
              </CardHeader>
              <div className="symgrid">
                {[
                  ["Open Trades", sym.trades,  C.t1,  "across all EAs", "symbol-number"],
                  ["Total Lots",  sym.lots.toFixed(2), C.acc,  "combined exposure", "symbol-number"],
                  ["Floating P&L",fmtS(sym.profit, sym.money_context), pclr(sym.profit), "unrealized", "symbol-money"],
                ].map(([l,v,clr,sub,cls]) => (
                  <div key={l}>
                    <div className="sl" style={{ marginBottom:6 }}>{l}</div>
                    <div className={`symval ${cls}`} style={{ color:clr }}>{v}</div>
                    <div style={{ fontSize:10, color:C.t3, marginTop:4 }}>{sub}</div>
                  </div>
                ))}
              </div>
              <div className="symbol-bar">
                <span>Lots intensity</span>
                <div><i style={{ width: `${Math.max(3, (Math.abs(sym.lots) / maxLots) * 100).toFixed(1)}%` }} /></div>
              </div>
              <div className="symbol-meta-row">
                <span>BUY {sym.buy}</span>
                <span>SELL {sym.sell}</span>
                <span>{sym.accounts} accounts</span>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
      <DataTableShell
        className="symbols-table"
        kicker="Exposure Table"
        title="Ranked by lots"
        actions={<Badge variant="secondary" className="chip cd">{visibleSymbols.length} rows</Badge>}
        table={(
          <Table className="tbl">
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Trades</TableHead>
                <TableHead>Lots</TableHead>
                <TableHead>Buy / Sell</TableHead>
                <TableHead>Accounts</TableHead>
                <TableHead>Floating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSymbols.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="7" className="empty-table-cell">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: C.t3 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.grn} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>No open symbol exposure. All positions are closed.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : visibleSymbols.map((symbol) => (
                <TableRow key={`row-${symbol.symbol}`}>
                  <TableCell data-label="Symbol" className="tn">{symbol.symbol}</TableCell>
                  <TableCell data-label="Category"><Badge variant="secondary" className="mini-tag">{symbol.category}</Badge></TableCell>
                  <TableCell data-label="Trades" className="tm symbol-number">{symbol.trades}</TableCell>
                  <TableCell data-label="Lots" className="tm symbol-number">{symbol.lots.toFixed(2)}</TableCell>
                  <TableCell data-label="Buy / Sell" className="tm symbol-number">{symbol.buy} / {symbol.sell}</TableCell>
                  <TableCell data-label="Accounts" className="tm symbol-number">{symbol.accounts}</TableCell>
                  <TableCell data-label="Floating" className="tm symbol-money" style={{ color:pclr(symbol.profit), fontWeight:600 }}>{fmtS(symbol.profit, symbol.money_context)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        mobileRows={<ResponsiveSymbolRows symbols={visibleSymbols} />}
      />
    </>
  )
}

function TradesPage({ accounts, isAdmin = false, lastUpdate = null }) {
  const [tab, setTab] = useState("all")
  const [direction, setDirection] = useState("all")
  const [symbolFilter, setSymbolFilter] = useState("all")

  const tradeRows = accounts.flatMap((account) =>
    (account.open_trades || account.trades || []).map((trade) => ({
      ...trade,
      account,
    })),
  )
  const accountsWithTrades = accounts.filter((account) => (account.open_trades || account.trades || []).length > 0)
  const symbols = Array.from(new Set(tradeRows.map((trade) => trade.symbol).filter(Boolean))).sort()
  const visibleTrades = tradeRows.filter((trade) => {
    const tabOk = tab === 'all' || trade.account.account_number === tab
    const directionOk = direction === 'all' || String(trade.trade_type || '').toLowerCase() === direction
    const symbolOk = symbolFilter === 'all' || trade.symbol === symbolFilter
    return tabOk && directionOk && symbolOk
  })
  const tradeSummary = visibleTrades.reduce((acc, trade) => {
    const type = String(trade.trade_type || '').toUpperCase()
    return {
      lots: acc.lots + Number(trade.lots || 0),
      pnl: acc.pnl + Number(trade.profit || 0),
      buy: acc.buy + (type === 'BUY' ? 1 : 0),
      sell: acc.sell + (type === 'SELL' ? 1 : 0),
      worst: Math.min(acc.worst, Number(trade.profit || 0)),
    }
  }, { lots: 0, pnl: 0, buy: 0, sell: 0, worst: 0 })
  const exportTrades = () => {
    downloadCsv('the-entity-open-trades.csv', [
      ['ea_name', 'account', 'ticket', 'symbol', 'direction', 'lots', 'open_price', 'current_price', 'floating_pnl'],
      ...visibleTrades.map((trade) => [
        accountLabel(trade.account),
        trade.account.account_number,
        trade.ticket,
        trade.symbol,
        String(trade.trade_type || '').toUpperCase(),
        Number(trade.lots || 0).toFixed(2),
        Number(trade.open_price || 0),
        Number(trade.current_price || 0),
        Number(trade.profit || 0).toFixed(2),
      ]),
    ])
  }

  return (
    <>
      <div className="history-summary">
        <div className="stat"><div className="sl">Visible Trades</div><div className="sv">{visibleTrades.length}</div><div className="ss">after filters</div></div>
        <div className="stat"><div className="sl">Open Lots</div><div className="sv">{tradeSummary.lots.toFixed(2)}</div><div className="ss">combined exposure</div></div>
        <div className="stat"><div className="sl">Floating P&L</div><div className={`sv ${tradeSummary.pnl >= 0 ? 'g' : 'r'}`}>{fmtS(tradeSummary.pnl)}</div><div className="ss">open positions</div></div>
        <div className="stat"><div className="sl">Buy / Sell</div><div className="sv">{tradeSummary.buy} / {tradeSummary.sell}</div><div className="ss">direction mix</div></div>
        <DataFreshnessStat accounts={accounts} lastUpdate={lastUpdate} />
      </div>
      <DataTableShell
        className="trades-history-table"
        kicker="Active Trades"
        title="Open Positions"
        actions={isAdmin && <Button className="btn b-acc" onClick={exportTrades}>Export CSV</Button>}
        controls={(
          <>
            <div className="ftabs">
              <Button variant="ghost" className={`ftab${tab==="all"?" on":""}`} onClick={() => setTab("all")}>
                All Open <span className="fcnt">{tradeRows.length}</span>
              </Button>
              {accountsWithTrades.map((acc) => (
                <Button key={acc.account_number} variant="ghost" className={`ftab${tab===acc.account_number?" on":""}`} onClick={() => setTab(acc.account_number)}>
                  {accountLabel(acc)} <span className="fcnt">{(acc.open_trades || acc.trades || []).length}</span>
                </Button>
              ))}
            </div>
            <div className="trade-filters">
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger className="fctl"><SelectValue placeholder="All directions" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All directions</SelectItem>
                    <SelectItem value="buy">BUY only</SelectItem>
                    <SelectItem value="sell">SELL only</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select value={symbolFilter} onValueChange={setSymbolFilter}>
                <SelectTrigger className="fctl"><SelectValue placeholder="All symbols" /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All symbols</SelectItem>
                    {symbols.map((symbol) => <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        table={(
          <Table className="tbl">
            <TableHeader>
              <TableRow>
                <TableHead>EA / Account</TableHead>
                <TableHead>{isAdmin ? 'Ticket' : 'Trade'}</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Lots</TableHead>
                {isAdmin && <TableHead>Open Price</TableHead>}
                <TableHead>P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="empty-table-cell">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: C.t3 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.grn} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>No open exposure. All EAs are idle.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : visibleTrades.map((t, index) => (
                <TableRow key={`${t.account.account_number}-${t.ticket}`}>
                  <TableCell data-label="EA / Account">
                    <div style={{ fontWeight:600, color:C.t1, fontSize:12.5 }}>{accountLabel(t.account)}</div>
                    {isAdmin && <div style={{ fontFamily:C.fn, fontSize:10, color:C.t3, marginTop:1 }}>{maskAccountNumber(t.account.account_number)}</div>}
                  </TableCell>
                  <TableCell data-label={isAdmin ? 'Ticket' : 'Trade'} className="tm" style={{ color:C.t3 }}>{isAdmin ? `#${t.ticket}` : `Trade ${index + 1}`}</TableCell>
                  <TableCell data-label="Symbol" style={{ fontFamily:C.fn, fontSize:13, fontWeight:600, color:C.yel }}>{t.symbol}</TableCell>
                  <TableCell data-label="Direction"><Badge className={`badge ${String(t.trade_type).toUpperCase()==="BUY"?"bbuy":"bsell"}`}>{String(t.trade_type).toUpperCase()}</Badge></TableCell>
                  <TableCell data-label="Lots" className="tm">{Number(t.lots).toFixed(2)}</TableCell>
                  {isAdmin && <TableCell data-label="Open Price" className="tm">{Number(t.open_price).toFixed(5)}</TableCell>}
                  <TableCell data-label="P&L" className="tm" style={{ fontWeight:600, color:pclr(t.profit) }}>{fmtS(t.profit, t.account)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        mobileRows={<ResponsiveTradeRows trades={visibleTrades} isAdmin={isAdmin} />}
      />
    </>
  )
}

function marginLevel(account) {
  const margin = Number(account.margin || 0)
  if (margin <= 0) return null
  return (Number(account.equity || 0) / margin) * 100
}

function mt5AccountState(account, snapshots = []) {
  const trades = account.open_trades || account.trades || []
  const active = trades.length > 0
  const floating = Number(account.equity || 0) - Number(account.balance || 0)
  const floatingPct = pctOfBalance(floating, account.balance)
  const currentDd = Number(account.drawdown_percent || 0)
  const peakDd = accountMaxDrawdown(account, snapshots)
  const openLots = accountOpenLots(account)
  const profile = inferEaProfile(account, snapshots)
  const ml = marginLevel(account)

  if (currentDd >= 10 || floatingPct <= -8 || openLots >= 20) {
    return { key: 'danger', label: 'Critical Exposure', tone: 'danger', active, floating, floatingPct, currentDd, peakDd, openLots, profile, ml, trades }
  }
  if (active) {
    return { key: 'active', label: 'Active Exposure', tone: 'active', active, floating, floatingPct, currentDd, peakDd, openLots, profile, ml, trades }
  }
  if (currentDd >= 3 || floatingPct <= -3) {
    return { key: 'watch', label: 'Idle Watch', tone: 'watch', active, floating, floatingPct, currentDd, peakDd, openLots, profile, ml, trades }
  }
  return { key: 'healthy', label: 'Healthy Idle', tone: 'healthy', active, floating, floatingPct, currentDd, peakDd, openLots, profile, ml, trades }
}

function MT5TerminalCard({ account, state, expanded, onToggle }) {
  const meta = brokerMeta(account.broker)
  const age = getAge(account)
  const todayPnl = accountTodayProfit(account)
  const todayTrades = accountTodayTrades(account)
  const closedLots = accountClosedLots(account)
  const marginColor = state.ml !== null && state.ml < 500 ? C.yel : C.t1
  return (
    <Card className={`terminal-card ${state.tone}${expanded ? ' open' : ''}`}>
      <Button className="terminal-shell" variant="ghost" type="button" onClick={onToggle}>
        <CardHeader className="terminal-top p-0">
          <div className={`broker-logo mini ${meta.tone}`}>{meta.asset ? <img src={meta.asset} alt={`${meta.label} logo`} /> : meta.logo}</div>
          <div className="terminal-title">
            <strong>{accountLabel(account)}</strong>
            <span>{maskAccountNumber(account.account_number)}</span>
          </div>
          <Badge className={`terminal-live ${state.active ? 'on' : 'off'}`}>{state.active ? 'Live' : 'Idle'}</Badge>
        </CardHeader>
        <div className="terminal-meta">{meta.label}</div>
        <div className="terminal-tags">
          <Badge variant="secondary" className="terminal-tag">{state.profile.strategy}</Badge>
          <Badge variant="outline" className={`terminal-tag ${state.profile.level}`}>{state.profile.risk}</Badge>
        </div>
        <CardContent className="terminal-body p-0">
        <div className="terminal-balance">
          <span>Equity</span>
          <b className="symbol-money">{fmtM(account.equity, false, account)}</b>
          <em className="symbol-money" style={{ color:pclr(state.floating) }}>{fmtS(state.floating, account)}</em>
        </div>
        <div className="terminal-grid">
          <div><span>Balance</span><b>{fmtM(account.balance, false, account)}</b></div>
          <div><span>Current DD</span><b style={{ color: state.currentDd >= 10 ? C.red : state.currentDd >= 3 ? C.yel : C.t1 }}>{formatPercent(state.currentDd)}</b></div>
          <div><span>Open Lots</span><b>{state.openLots.toFixed(2)}</b></div>
          <div><span>Open Trades</span><b>{state.trades.length}</b></div>
          <div><span>{reportingDayLabel(latestHistoryRow(account)?.date)} P&L</span><b style={{ color:pclr(todayPnl) }}>{fmtS(todayPnl, account)}</b></div>
          <div><span>{reportingDayLabel(latestHistoryRow(account)?.date)} Closed Deals</span><b>{todayTrades}</b></div>
          <div><span>Closed Lots</span><b>{closedLots === null ? '-' : fmtLots(closedLots)}</b></div>
          <div><span>Margin Lv</span><b style={{ color:marginColor }}>{state.ml === null ? '-' : `${state.ml.toFixed(0)}%`}</b></div>
        </div>
        <div className="terminal-foot">
          <span>{age.detail}</span>
          <b>{expanded ? 'Hide positions' : 'View terminal'}</b>
        </div>
        </CardContent>
      </Button>
      {expanded ? (
        <CardContent className="terminal-positions p-0">
          {state.trades.length === 0 ? (
            <div className="empty-note">No open positions on this account.</div>
          ) : state.trades.slice(0, 14).map((trade) => (
            <div className="terminal-position" key={`${account.account_number}-${trade.ticket}`}>
              <span>{trade.symbol}</span>
              <b className={String(trade.trade_type || '').toUpperCase() === 'BUY' ? 'buy' : 'sell'}>{String(trade.trade_type || '').toUpperCase()}</b>
              <em>{Number(trade.lots || 0).toFixed(2)} lots</em>
              <strong style={{ color:pclr(trade.profit) }}>{fmtS(trade.profit, account)}</strong>
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  )
}

function MT5PreviewPage({ accounts, snapshots = [], lastUpdate = null }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('floating-desc')
  const [expanded, setExpanded] = useState(null)
  const rows = accounts.map((account) => ({ account, state: mt5AccountState(account, snapshots) }))
  const filtered = rows.filter(({ account, state }) => {
    const active = state.active
    if (filter === 'active') return active
    if (filter === 'idle') return !active
    if (filter === 'usd') return accountCurrency(account) === 'USD'
    if (filter === 'usc') return accountCurrency(account) === 'USC'
    if (filter === 'danger') return state.key === 'danger'
    return true
  })
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'name') return accountLabel(a.account).localeCompare(accountLabel(b.account))
    if (sort === 'positions-desc') return b.state.trades.length - a.state.trades.length
    if (sort === 'margin-asc') return Number(a.state.ml ?? Infinity) - Number(b.state.ml ?? Infinity)
    if (sort === 'dd-desc') return b.state.currentDd - a.state.currentDd
    if (sort === 'pnl-asc') return a.state.floating - b.state.floating
    return b.state.floating - a.state.floating
  })
  const groupOrder = [
    { key: 'danger', label: 'Danger Drawdown', tone: 'danger', note: 'DD, floating, or lots need attention' },
    { key: 'active', label: 'Active Exposure', tone: 'active', note: 'Accounts currently holding orders' },
    { key: 'watch', label: 'Idle Watch', tone: 'watch', note: 'No open orders but risk history is elevated' },
    { key: 'healthy', label: 'Healthy Idle', tone: 'healthy', note: 'No open positions and normal risk' },
  ]
  const grouped = groupOrder
    .map((group) => {
      const items = sorted.filter((row) => row.state.key === group.key)
      const floating = items.reduce((sum, row) => sum + row.state.floating, 0)
      const lots = items.reduce((sum, row) => sum + row.state.openLots, 0)
      const positions = items.reduce((sum, row) => sum + row.state.trades.length, 0)
      const currentDd = items.reduce((max, row) => Math.max(max, row.state.currentDd), 0)
      return { ...group, items, floating, lots, positions, currentDd }
    })
    .filter((group) => group.items.length > 0)
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)
  const totalEquity = accounts.reduce((sum, account) => sum + Number(account.equity || 0), 0)
  const totalPositions = accounts.reduce((sum, account) => sum + Number(account.open_positions || (account.open_trades || []).length || 0), 0)
  const totalLots = accounts.reduce((sum, account) => sum + accountOpenLots(account), 0)
  const dangerCount = rows.filter((row) => row.state.key === 'danger').length
  return (
    <>
      <div className="history-summary">
        <div className="stat"><div className="sl">Balance</div><div className="sv">{fmtM(totalBalance)}</div><div className="ss">all previewed ports</div></div>
        <div className="stat"><div className="sl">Equity</div><div className="sv">{fmtM(totalEquity)}</div><div className="ss">live equity</div></div>
        <div className="stat"><div className="sl">Floating</div><div className={`sv ${totalEquity - totalBalance >= 0 ? 'g' : 'r'}`}>{fmtS(totalEquity - totalBalance)}</div><div className="ss">open P&L</div></div>
        <div className="stat"><div className="sl">Positions / Lots</div><div className="sv a">{totalPositions} / {totalLots.toFixed(2)}</div><div className="ss">MT5 exposure</div></div>
        <DataFreshnessStat accounts={accounts} lastUpdate={lastUpdate} />
      </div>
      <Card className="sec mt5-preview-shell">
        <CardHeader className="sec-h p-0">
          <div>
            <div className="sec-lbl">MT5 Preview</div>
            <CardTitle className="sec-title">Grouped terminal board</CardTitle>
            <CardDescription className="sec-sub">Compact MT5-style snapshots grouped by risk and live exposure.</CardDescription>
          </div>
          <div className="trade-filters">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="fctl"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All ({accounts.length})</SelectItem>
                  <SelectItem value="danger">Danger ({dangerCount})</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="usc">USC</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="fctl wide"><SelectValue placeholder="P&L high to low" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="floating-desc">P&L high to low</SelectItem>
                  <SelectItem value="pnl-asc">P&L low to high</SelectItem>
                  <SelectItem value="dd-desc">Current DD high to low</SelectItem>
                  <SelectItem value="margin-asc">Margin level watch</SelectItem>
                  <SelectItem value="positions-desc">Positions high to low</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <div className="mt5-board">
          {grouped.length === 0 ? <div className="empty-note">No account matches this preview filter.</div> : grouped.map((group) => (
            <Card className={`mt5-group ${group.tone}`} key={group.key}>
              <CardHeader className="mt5-group-head p-0">
                <div>
                  <div className="mt5-group-kicker">{group.note}</div>
                  <CardTitle>{group.label}</CardTitle>
                </div>
                <div className="mt5-group-stats">
                  <Badge className={`mt5-group-status ${group.tone}`}>{group.items.length} accounts</Badge>
                  <b style={{ color:pclr(group.floating) }}>{fmtS(group.floating)}</b>
                  <em>{group.positions} positions / {group.lots.toFixed(2)} lots / current DD {formatPercent(group.currentDd)}</em>
                </div>
              </CardHeader>
              <CardContent className="terminal-grid-board p-0">
                {group.items.map(({ account, state }) => {
                  const isOpen = expanded === account.account_number
                  return (
                    <MT5TerminalCard
                      key={account.account_number}
                      account={account}
                      state={state}
                      expanded={isOpen}
                      onToggle={() => setExpanded(isOpen ? null : account.account_number)}
                    />
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </Card>
    </>
  )
}

function AlertsPage({ accounts, snapshots, sysData }) {
  const alerts = buildAlerts(accounts, snapshots, sysData)
  const critical = alerts.filter((alert) => alert.level === 'critical').length
  const warning = alerts.filter((alert) => alert.level === 'warning').length
  const info = alerts.filter((alert) => alert.level === 'info').length
  return (
    <>
      <div className="alert-summary">
        <div className="alert-kpi critical"><span>Critical</span><b>{critical}</b></div>
        <div className="alert-kpi warning"><span>Warning</span><b>{warning}</b></div>
        <div className="alert-kpi info"><span>Info</span><b>{info}</b></div>
      </div>
      <WeekendExposureCard accounts={accounts} />
      <div className="sec">
        <div className="sec-h">
          <div><div className="sec-lbl">Notification Center</div><div className="sec-title">Portfolio Alerts</div></div>
          <span className="chip ca">{alerts.length} alerts</span>
        </div>
        <div className="alert-list">
          {alerts.length === 0 ? <div className="empty-note">No alerts. Portfolio is within current monitoring thresholds.</div> : alerts.map((alert, index) => (
            <div className={`alert-row ${alert.level}`} key={`${alert.title}-${index}`}>
              <div className="alert-dot" />
              <div>
                <div className="alert-title">{alert.title}</div>
                <div className="alert-detail">{alert.detail}</div>
              </div>
              <span className="chip cd">{alert.scope}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function HistoryPage({ accounts, isAdmin = false }) {
  const [range, setRange] = useState('30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [accountFilter, setAccountFilter] = useState('all')
  const [brokerFilter, setBrokerFilter] = useState('all')
  const [pnlFilter, setPnlFilter] = useState('all')
  const [query, setQuery] = useState('')
  const rows = useMemo(() => buildClosedHistoryRows(accounts), [accounts])
  const brokers = useMemo(() => Array.from(new Set(accounts.map((account) => account.broker).filter(Boolean))).sort(), [accounts])
  const customState = useMemo(() => {
    if (range !== 'custom') return null
    if (customStart && customEnd && customStart <= customEnd) return { label: `${customStart} to ${customEnd}`, complete: true, invalid: false }
    if (customStart && customEnd && customStart > customEnd) return { label: 'Custom: invalid range', complete: false, invalid: true }
    return { label: customStart || customEnd ? 'Custom: complete dates' : 'Custom: select dates', complete: false, invalid: false }
  }, [range, customStart, customEnd])
  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase()
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    if (range !== 'all' && range !== 'custom') cutoff.setDate(cutoff.getDate() - Number(range || 0))
    return rows.filter((row) => {
      let dateOk = true
      if (range === 'custom') {
        dateOk = Boolean(customStart && customEnd && customStart <= customEnd && row.date >= customStart && row.date <= customEnd)
      } else if (range !== 'all') {
        dateOk = new Date(`${row.date}T00:00:00`) >= cutoff
      }
      const accountOk = accountFilter === 'all' || String(row.account_number) === accountFilter
      const brokerOk = brokerFilter === 'all' || row.broker === brokerFilter
      const pnlOk =
        pnlFilter === 'all' ||
        (pnlFilter === 'profit' && row.pnl > 0) ||
        (pnlFilter === 'loss' && row.pnl < 0) ||
        (pnlFilter === 'traded' && row.trades > 0)
      const queryOk = !term || [row.name, row.broker, row.account_number].some((value) => String(value || '').toLowerCase().includes(term))
      return dateOk && accountOk && brokerOk && pnlOk && queryOk
    })
  }, [rows, range, customStart, customEnd, accountFilter, brokerFilter, pnlFilter, query])
  const summary = filteredRows.reduce((acc, row) => ({
    pnl: acc.pnl + row.pnl,
    trades: acc.trades + row.trades,
    lots: acc.lots + row.lots,
    rebateLots: acc.rebateLots + Number(row.rebateLots || 0),
    rebate: acc.rebate + row.rebate,
    winDays: acc.winDays + (row.trades > 0 && row.pnl > 0 ? 1 : 0),
    lossDays: acc.lossDays + (row.trades > 0 && row.pnl < 0 ? 1 : 0),
  }), { pnl: 0, trades: 0, lots: 0, rebateLots: 0, rebate: 0, winDays: 0, lossDays: 0 })
  const historyMoneyContext = moneyContextForItems(filteredRows)
  const exportHistory = () => {
    downloadCsv('the-entity-closed-history.csv', [
      ['date', 'ea_name', 'account', 'broker', 'result', 'pnl', 'closed_deals', 'closed_lots', 'rebate_lots', 'rebate_usd'],
      ...filteredRows.map((row) => [row.date, row.name, row.account_number, row.broker, row.pnl > 0 ? 'profit' : row.pnl < 0 ? 'loss' : 'flat', row.pnl.toFixed(2), row.trades, row.lots.toFixed(2), Number(row.rebateLots || 0).toFixed(4), row.rebate.toFixed(2)]),
    ])
  }
  return (
    <>
      <div className="history-summary">
        <div className="stat"><div className="sl">Closed P&L</div><div className={`sv ${summary.pnl >= 0 ? 'g' : 'r'}`}>{fmtS(summary.pnl, historyMoneyContext)}</div><div className="ss">selected period</div></div>
        <div className="stat"><div className="sl">Closed Lots</div><div className="sv">{summary.lots.toFixed(2)}</div><div className="ss">reported volume</div></div>
        <div className="stat"><div className="sl">Rebate</div><div className="sv g">{fmtM(summary.rebate)}</div><div className="ss">{summary.rebateLots.toFixed(4)} rebate lots</div></div>
        <div className="stat"><div className="sl">Closed Deals</div><div className="sv">{summary.trades}</div><div className="ss">daily history total</div></div>
        <div className="stat"><div className="sl">Profitable / Loss Account-Days</div><div className="sv">{summary.winDays} / {summary.lossDays}</div><div className="ss">account-days with deals</div></div>
      </div>
      <DataTableShell
        className="trades-history-table"
        kicker="Closed Performance"
        title="Trade History Summary"
        actions={isAdmin && <Button className="btn b-acc" onClick={exportHistory}>Export CSV</Button>}
        controls={(
          <div className="history-controls">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="fctl"><SelectValue placeholder="Last 30 days" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="all">All history</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {range === 'custom' ? (
              <div className="history-custom-range" aria-label="Custom history date range">
                <Input className="fctl" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} aria-label="History custom start date" />
                <Input className="fctl" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} aria-label="History custom end date" />
                <span className={`history-custom-state${customState?.invalid ? ' invalid' : ''}`}>{customState?.label}</span>
              </div>
            ) : null}
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="fctl wide"><SelectValue placeholder="All accounts" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => <SelectItem key={account.account_number} value={String(account.account_number)}>{accountLabel(account)}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={brokerFilter} onValueChange={setBrokerFilter}>
              <SelectTrigger className="fctl wide"><SelectValue placeholder="All brokers" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All brokers</SelectItem>
                  {brokers.map((broker) => <SelectItem key={broker} value={broker}>{brokerMeta(broker).label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={pnlFilter} onValueChange={setPnlFilter}>
              <SelectTrigger className="fctl"><SelectValue placeholder="All results" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All results</SelectItem>
                  <SelectItem value="profit">Profit days</SelectItem>
                  <SelectItem value="loss">Loss days</SelectItem>
                  <SelectItem value="traded">Trade days only</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input className="fctl search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search history" />
          </div>
        )}
        table={(
          <Table className="tbl">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>EA</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Closed Deals</TableHead>
                <TableHead>Closed Lots</TableHead>
                <TableHead>Rebate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow><TableCell colSpan="8" className="empty-table-cell">No closed history for the selected filters.</TableCell></TableRow>
              ) : filteredRows.slice(0, 250).map((row) => (
                <TableRow key={`${row.account_number}-${row.date}`}>
                  <TableCell data-label="Date" className="tm">{row.date}</TableCell>
                  <TableCell data-label="EA" className="tn">{row.name}</TableCell>
                  <TableCell data-label="Account" className="tm">{maskAccountNumber(row.account_number)}</TableCell>
                  <TableCell data-label="Broker" style={{ color:C.t3, fontSize:11 }}>{row.broker}</TableCell>
                  <TableCell data-label="P&L" className="tm"><Badge className={`badge ${row.pnl > 0 ? 'bbuy' : row.pnl < 0 ? 'bsell' : 'bwarn'}`}>{fmtS(row.pnl, row)}</Badge></TableCell>
                  <TableCell data-label="Closed Deals" className="tm">{row.trades}</TableCell>
                  <TableCell data-label="Closed Lots" className="tm">{row.lots.toFixed(2)}</TableCell>
                  <TableCell data-label="Rebate" className="tm" style={{ color:C.grn }}>{fmtM(row.rebate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        mobileRows={<ResponsiveHistoryRows rows={filteredRows} />}
      />
    </>
  )
}

function ConfigField({ label, value, helper, masked = false, disabled = false }) {
  const [revealed, setRevealed] = useState(false)
  const [copyState, setCopyState] = useState('idle')
  const displayValue = masked && !revealed
    ? value ? '*'.repeat(Math.min(36, String(value).length)) : 'Admin only'
    : value || 'Not configured'
  const copyValue = async () => {
    if (!value || disabled) return
    const ok = await copyToClipboard(value)
    setCopyState(ok ? 'copied' : 'failed')
    window.setTimeout(() => setCopyState('idle'), 1400)
  }
  const copyTooltip = disabled
    ? 'Admin only'
    : copyState === 'copied'
      ? 'Copied'
      : copyState === 'failed'
        ? 'Copy failed'
        : `Copy ${label}`
  return (
    <Card className="config-field">
      <CardHeader className="config-field-head">
        <CardTitle className="config-label">{label}</CardTitle>
      </CardHeader>
      <CardContent className="config-field-body">
        <div className="config-box">
          <Input
            className="config-input"
            value={displayValue}
            readOnly
            aria-label={label}
          />
          <TooltipProvider delayDuration={150}>
            {masked && value ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="config-action"
                    onClick={() => setRevealed((next) => !next)}
                  >
                    {revealed ? 'Hide' : 'Show'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{revealed ? 'Hide private key' : 'Reveal private key'}</TooltipContent>
              </Tooltip>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn('config-action', copyState === 'copied' && 'copy-ok', copyState === 'failed' && 'copy-fail')}
                  onClick={copyValue}
                  disabled={!value || disabled}
                  aria-label={copyTooltip}
                >
                  {Ico.copy}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copyTooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {helper ? <CardDescription className="config-help">{helper}</CardDescription> : null}
      </CardContent>
    </Card>
  )
}

function ReporterPage({ accounts = [], lastUpdate = null, isAdmin = false }) {
  const [mt5Config, setMt5Config] = useState({ api_key: '', configured: false })
  const [configError, setConfigError] = useState('')
  useEffect(() => {
    if (!isAdmin) return undefined
    let alive = true
    fetch(`${API_URL}/api/mt5/config`, { credentials: 'include' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`MT5 config ${response.status}`)))
      .then((config) => { if (alive) setMt5Config(config) })
      .catch((err) => { if (alive) setConfigError(err.message) })
    return () => { alive = false }
  }, [isAdmin])

  const activeAccounts = accounts.filter((account) => getAge(account).seconds <= 60).length
  const latestAge = accounts.reduce((min, account) => Math.min(min, getAge(account).seconds), Infinity)
  const syncLabel = latestAge === Infinity ? 'Waiting' : latestAge <= 60 ? 'Healthy' : 'Stale'
  const syncTone = latestAge === Infinity ? C.yel : latestAge <= 60 ? C.grn : C.red
  const syncAgeText = latestAge === Infinity ? 'No reporter sync yet' : `${latestAge.toFixed(0)}s ago`
  const allowListUrl = window.location.origin
  return (
    <>
      <Card className="reporter-hero sec">
        <CardHeader className="sec-h reporter-head">
          <div>
            <div className="sec-lbl">MT5 Reporter</div>
            <CardTitle className="sec-title">Connect terminals without Python</CardTitle>
            <CardDescription className="sec-sub">Reporter v1.07 backfills up to 365 days of MT5 closed-deal history, supports USC account scaling, and keeps routine MT5 Journal logs quiet by default.</CardDescription>
          </div>
          <Badge className="chip cb">MQL5 WebRequest</Badge>
        </CardHeader>
        <CardContent className="reporter-grid">
          <ConfigField
            label="Endpoint URL"
            value={INGEST_ENDPOINT}
            helper="Use this URL in DashboardEndpoint."
          />
          <ConfigField
            label="WebRequest allow-list"
            value={allowListUrl}
            helper="MT5: Tools -> Options -> Expert Advisors -> Allow WebRequest for listed URL."
          />
          <ConfigField
            label="API key (DashboardApiKey)"
            value={isAdmin ? mt5Config.api_key : ''}
            masked
            disabled={!isAdmin}
            helper={isAdmin ? (configError || 'Keep this private. Rotate from server .env if leaked.') : 'Admin only. Demo users cannot view or copy the ingest key.'}
          />
          <Card className="reporter-status-card">
            <CardHeader className="config-field-head">
              <CardTitle className="config-label">Last reporter sync</CardTitle>
            </CardHeader>
            <CardContent className="reporter-status-body">
            <div className="reporter-status-line">
              <span className="status-dot" style={{ background: syncTone }} />
              <strong style={{ color: syncTone }}>{syncLabel}</strong>
              <Badge className="badge blive">200 OK</Badge>
            </div>
            <p>{syncAgeText} · {activeAccounts}/{accounts.length} accounts live</p>
            {lastUpdate ? <em>Dashboard refresh {lastUpdate.toLocaleTimeString('en-US')}</em> : null}
            </CardContent>
          </Card>
        </CardContent>
        <div className="reporter-downloads">
          <Button asChild className="dlbtn primary"><a href={REPORTER_PATH} download>{Ico.sync} Download MQ5 Source</a></Button>
          <Button asChild variant="outline" className="dlbtn"><a href={REPORTER_EX5_PATH} download>{Ico.lock} Download Compiled EX5</a></Button>
        </div>
      </Card>

      <Card className="sec setup-sec">
        <CardHeader className="sec-h">
          <div><div className="sec-lbl">Setup checklist</div><CardTitle className="sec-title">Install one reporter per terminal</CardTitle></div>
          <Badge className="chip ca">{accounts.length} accounts detected</Badge>
        </CardHeader>
        <CardContent className="setup-list">
          {[
            ['Place the EX5 file', 'Drop it into MT5 -> MQL5 -> Experts folder, then restart MT5.'],
            ['Enable WebRequest', "Tools -> Options -> Expert Advisors -> tick 'Allow WebRequest for listed URL' and add the allow-list URL above."],
            ['Attach to a chart', "Drag 'MT5DashboardReporter' EA onto any chart. Symbol does not matter."],
            ['Set inputs', 'DashboardEndpoint = endpoint URL / DashboardApiKey = API key shown above / IncludeDailyHistory = true / EnableStatusLogs = false.'],
            ['Verify telemetry', 'Open Mission / Logs or MT5 Preview. You should see a fresh heartbeat within one sync cycle.'],
          ].map(([title, detail], index) => (
            <div className="setup-step" key={title}>
              <span>{index + 1}</span>
              <div><strong>{title}</strong><p>{detail}</p></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="sec troubleshoot-sec">
        <CardHeader className="sec-h">
          <div><div className="sec-lbl">Troubleshooting</div><CardTitle className="sec-title">Common reporter issues</CardTitle></div>
          <Badge className="chip cd">Fast checks</Badge>
        </CardHeader>
        <CardContent className="trouble-list">
          {[
            ['WebRequest blocked', 'Re-check the allow-list URL exactly matches the endpoint host, scheme, and port. MT5 is strict.'],
            ['No data after install', 'Confirm Algo Trading is ON and the EA enabled icon appears on the chart.'],
            ['401 Unauthorized', 'API key mismatch. Copy DashboardApiKey again and restart the EA.'],
            ['Connection timeout', 'Firewall or VPS security list is blocking outbound HTTP from the MT5 terminal.'],
            ['Journal messages are noisy', 'Keep EnableStatusLogs=false. Set EnableErrorLogs=false only when you intentionally want a silent reporter.'],
          ].map(([title, detail]) => (
            <div className="trouble-row" key={title}>
              <span>OK</span>
              <div><strong>{title}</strong><p>{detail}</p></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

function ResponsiveHealthRows({ accounts }) {
  if (!accounts.length) return <div className="empty-card">No reporter accounts found.</div>
  return (
    <div className="responsive-row-list">
      {accounts.map((account) => {
        const age = getAge(account)
        const statusClass = age.seconds < 330 ? 'blive' : age.seconds < 1800 ? 'bbuy' : 'bsell'
        return (
          <Card className="responsive-row-card" key={account.account_number}>
            <div className="responsive-row-head">
              <div>
                <div className="responsive-row-title">{accountLabel(account)}</div>
                <div className="responsive-row-sub">{maskAccountNumber(account.account_number)} / {brokerMeta(account.broker).label}</div>
              </div>
              <Badge className={`badge ${statusClass}`}>{age.label}</Badge>
            </div>
            <CardContent className="responsive-row-body p-0">
              <div><span>Broker</span><b>{brokerMeta(account.broker).label}</b></div>
              <div><span>Last update</span><b>{age.detail}</b></div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function LogsPage({ sysData, accounts = [], lastUpdate = null }) {
  const liveAccounts = accounts.filter((account) => getAge(account).seconds < 330)
  const staleAccounts = accounts.filter((account) => getAge(account).seconds >= 330)
  const newestAge = accounts.reduce((min, account) => Math.min(min, getAge(account).seconds), Infinity)
  const syncState = newestAge === Infinity ? 'Waiting' : newestAge < 330 ? 'Healthy' : 'Stale'
  const syncColor = syncState === 'Healthy' ? C.grn : syncState === 'Stale' ? C.red : C.yel
  return (
    <>
      <div className="loggrid">
        {[["CPU",sysData?.cpu_percent||0],["RAM",sysData?.ram_percent||0],["Disk",sysData?.disk_percent||0]].map(([l,v]) => (
          <Card className="logsc" key={l}>
            <div className="logsl">{l}</div>
            <div className="logsv" style={{ color:resourceTone(v) }}>{v.toFixed(2)}%</div>
            <div className="logbar"><div className="logfill" style={{ width:`${Math.max(v,.3)}%`, background:resourceTone(v) }} /></div>
          </Card>
        ))}
      </div>
      <Card className="sec">
        <CardHeader className="sec-h">
          <div><div className="sec-lbl">Forex System Health</div><CardTitle className="sec-title">Reporter heartbeat</CardTitle></div>
          <Badge className="chip ca">{liveAccounts.length}/{accounts.length} live</Badge>
        </CardHeader>
        <CardContent className="system-health-grid">
          <Card className="system-health-card">
            <CardHeader className="config-field-head"><CardTitle className="config-label">Sync status</CardTitle></CardHeader>
            <CardContent className="system-health-body">
            <strong style={{ color: syncColor }}>{syncState}</strong>
            <p>{newestAge === Infinity ? 'No MT5 reporter heartbeat detected yet.' : `Newest reporter update ${newestAge.toFixed(0)}s ago.`}</p>
            {lastUpdate ? <em>Dashboard refreshed {lastUpdate.toLocaleTimeString('en-US')}</em> : null}
            </CardContent>
          </Card>
          <Card className="system-health-card">
            <CardHeader className="config-field-head"><CardTitle className="config-label">Account coverage</CardTitle></CardHeader>
            <CardContent className="system-health-body">
            <strong>{liveAccounts.length}/{accounts.length}</strong>
            <p>{staleAccounts.length ? `${staleAccounts.length} accounts need reporter attention.` : 'All monitored accounts are updating inside the live threshold.'}</p>
            </CardContent>
          </Card>
          <Card className="system-health-card">
            <CardHeader className="config-field-head"><CardTitle className="config-label">Admin note</CardTitle></CardHeader>
            <CardContent className="system-health-body">
            <strong>Internal logs hidden</strong>
            <p>Raw server and TFM job logs are no longer shown in the product UI. Use VPS access for deep diagnostics.</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      <DataTableShell
        kicker="Reporter Status"
        title="Per-account freshness"
        actions={<Badge className="chip cd">{accounts.length} accounts</Badge>}
        className="health-status-table"
        table={(
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EA</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead>Last update</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const age = getAge(account)
                const statusClass = age.seconds < 330 ? 'blive' : age.seconds < 1800 ? 'bbuy' : 'bsell'
                return (
                  <TableRow key={account.account_number}>
                    <TableCell className="tn">{accountLabel(account)}</TableCell>
                    <TableCell className="tm">{maskAccountNumber(account.account_number)}</TableCell>
                    <TableCell>{brokerMeta(account.broker).label}</TableCell>
                    <TableCell className="tm">{age.detail}</TableCell>
                    <TableCell><Badge className={`badge ${statusClass}`}>{age.label}</Badge></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
        mobileRows={<ResponsiveHealthRows accounts={accounts} />}
      />
    </>
  )
}

// โ”€โ”€ ROOT โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
const ACCOUNT_GATE_STATUSES = ['APPROVED', 'PAUSED', 'BLOCKED']
const ACCOUNT_GATE_STATUS_LABELS = { APPROVED: 'Approve', PAUSED: 'Pause', BLOCKED: 'Block' }
const ACCOUNT_GATE_EAS = ['SteadyFlow', 'JANUS', 'Hybrid']

function statusBadgeClass(status) {
  if (status === 'APPROVED') return 'blive'
  if (status === 'BLOCKED') return 'bsell'
  if (status === 'PAUSED') return 'bbuy'
  return 'bmuted'
}

function AuditLogTable({ rows = [] }) {
  if (!rows.length) return <div className="empty-card">No audit events yet.</div>
  return (
    <DataTableShell
      kicker="Security"
      title="Audit Log"
      table={(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="tm">{row.created_at}</TableCell>
                <TableCell>{row.actor}<div className="ts">{row.actor_role}</div></TableCell>
                <TableCell>{row.action}</TableCell>
                <TableCell>{row.account_login}<div className="tm">{row.broker_server}</div></TableCell>
                  <TableCell><span className="tm">{row.old_status || '-'}</span>{' -> '}<Badge className={`badge ${statusBadgeClass(row.new_status)}`}>{row.new_status || '-'}</Badge></TableCell>
                <TableCell>{row.reason || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      mobileRows={(
        <div className="responsive-row-list">
          {rows.map((row) => (
            <Card className="responsive-row-card" key={row.id}>
              <div className="responsive-row-head">
                <div><div className="responsive-row-title">{row.action}</div><div className="responsive-row-sub">{row.created_at}</div></div>
                <Badge className={`badge ${statusBadgeClass(row.new_status)}`}>{row.new_status || '-'}</Badge>
              </div>
              <CardContent className="responsive-row-body p-0">
                <div><span>Account</span><b>{row.account_login || '-'}</b></div>
                <div><span>Actor</span><b>{row.actor || '-'}</b></div>
                <div><span>Reason</span><b>{row.reason || '-'}</b></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    />
  )
}

function AgentTokensPanel() {
  const [tokens, setTokens] = useState([])
  const [name, setName] = useState('MT5 EA Agent')
  const [newToken, setNewToken] = useState('')
  const [error, setError] = useState('')

  const loadTokens = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/agent-tokens`, { credentials: 'include' })
      if (!response.ok) throw new Error(`Agent token API ${response.status}`)
      const result = await response.json()
      setTokens(result.tokens || [])
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => { loadTokens() }, [loadTokens])

  const createToken = async (event) => {
    event.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/admin/agent-tokens`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || `Create token API ${response.status}`)
      setNewToken(result.token || '')
      await loadTokens()
    } catch (err) {
      setError(err.message)
    }
  }

  const revokeToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/agent-tokens/${token.id}/revoke`, {
        method: 'POST',
        credentials: 'include',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || `Revoke token API ${response.status}`)
      await loadTokens()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Card className="sec">
      <CardHeader className="sec-h">
        <div>
          <div className="sec-lbl">EA License</div>
          <CardTitle className="sec-title">Agent Tokens</CardTitle>
          <CardDescription>Create per-agent bearer tokens for MT5 EA license checks. Tokens are shown once.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {error ? <div className="app-notice danger">{error}</div> : null}
        <form className="registry-token-form" onSubmit={createToken}>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Token name" />
          <Button type="submit">{Ico.lock} Create Agent Token</Button>
        </form>
        {newToken ? (
          <div className="registry-token-once">
            <div>
              <div className="sec-lbl">Copy now</div>
              <div className="tm registry-token-value">{newToken}</div>
              <CardDescription>This raw token cannot be shown again after you leave this panel.</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={() => copyToClipboard(newToken)}>{Ico.copy} Copy token</Button>
          </div>
        ) : null}
        <div className="registry-token-list">
          {tokens.map((token) => (
            <div className="registry-token-row" key={token.id}>
              <div>
                <b>{token.name}</b>
                <div className="tm">created {token.created_at || '-'} - last used {token.last_used_at || 'never'}</div>
              </div>
              <div className="registry-actions">
                <Badge className={`badge ${token.status === 'ACTIVE' ? 'blive' : 'bsell'}`}>{token.status}</Badge>
                {token.status === 'ACTIVE' ? <Button type="button" size="sm" variant="outline" className="b-danger" onClick={() => revokeToken(token)}>Revoke</Button> : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AdminAccountsPage() {
  const initialForm = {
    account_login: '',
    broker_name: '',
    broker_server: '',
    account_type: 'live',
    symbol: 'XAUUSD.c',
    ib_group: '',
    referral_tag: '',
    owner_name: '',
    note: '',
    allowed_eas: ['SteadyFlow'],
    allowed_version: '',
    allowed_build_hash: '',
    allowed_preset: '',
    risk_profile: '',
    status: 'PAUSED',
    reason: 'Initial pause',
    expiry_date: '',
  }
  const [accounts, setAccounts] = useState([])
  const [audit, setAudit] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({ status: 'all', broker: '', server: '', ea: 'all', risk_profile: '', search: '' })
  const [form, setForm] = useState(initialForm)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusReason, setStatusReason] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingRegistry, setDeletingRegistry] = useState(false)
  const [historyTarget, setHistoryTarget] = useState(null)
  const [historyRows, setHistoryRows] = useState([])
  const [customEa, setCustomEa] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importReport, setImportReport] = useState([])

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.broker.trim()) params.set('broker', filters.broker.trim())
      if (filters.server.trim()) params.set('server', filters.server.trim())
      if (filters.ea !== 'all') params.set('ea', filters.ea)
      if (filters.risk_profile.trim()) params.set('risk_profile', filters.risk_profile.trim())
      if (filters.search.trim()) params.set('search', filters.search.trim())
      const response = await fetch(`${API_URL}/api/admin/accounts?${params.toString()}`, { credentials: 'include' })
      if (!response.ok) throw new Error(`Account registry API ${response.status}`)
      const result = await response.json()
      setAccounts(result.accounts || [])
      setAudit(result.audit || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.broker, filters.server, filters.ea, filters.risk_profile, filters.search])

  useEffect(() => { loadAccounts() }, [loadAccounts])

  const eaFilterOptions = useMemo(() => {
    const names = new Set(ACCOUNT_GATE_EAS)
    accounts.forEach((account) => (account.allowed_eas || []).forEach((ea) => names.add(ea)))
    return [{ value: 'all', label: 'All EAs' }, ...Array.from(names).sort().map((ea) => ({ value: ea, label: ea }))]
  }, [accounts])

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const toggleEa = (ea) => setForm((current) => ({
    ...current,
    allowed_eas: current.allowed_eas.includes(ea)
      ? current.allowed_eas.filter((item) => item !== ea)
      : [...current.allowed_eas, ea],
  }))
  const addCustomEa = () => {
    const ea = customEa.trim()
    if (!ea) return
    setForm((current) => ({
      ...current,
      allowed_eas: current.allowed_eas.includes(ea) ? current.allowed_eas : [...current.allowed_eas, ea],
    }))
    setCustomEa('')
  }

  const createAccount = async (event) => {
    event.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/admin/accounts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || `Create account API ${response.status}`)
      setForm(initialForm)
      await loadAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  const openStatusDialog = (account, status) => {
    setStatusTarget({ account, status })
    setStatusReason(`${status.toLowerCase().replaceAll('_', ' ')} by admin`)
  }

  const changeStatus = async (event) => {
    event.preventDefault()
    if (!statusTarget) return
    try {
      const response = await fetch(`${API_URL}/api/admin/accounts/${statusTarget.account.id}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusTarget.status, reason: statusReason }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || `Status API ${response.status}`)
      setStatusTarget(null)
      setStatusReason('')
      await loadAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteRegistryAccount = async () => {
    if (!deleteTarget) return
    setDeletingRegistry(true)
    try {
      const params = new URLSearchParams({ confirm_account_login: deleteConfirm.trim() })
      const response = await fetch(`${API_URL}/api/admin/accounts/${deleteTarget.id}?${params.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || `Delete registry API ${response.status}`)
      setDeleteTarget(null)
      await loadAccounts()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingRegistry(false)
    }
  }

  const openHistory = async (account) => {
    setHistoryTarget(account)
    setHistoryRows([])
    try {
      const response = await fetch(`${API_URL}/api/admin/accounts/${account.id}/audit`, { credentials: 'include' })
      if (!response.ok) throw new Error(`Account audit API ${response.status}`)
      const result = await response.json()
      setHistoryRows(result.audit || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const importAccounts = async (event) => {
    event.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/admin/accounts/import-csv`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_text: importText }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || `Import API ${response.status}`)
      setImportReport(result.report || [])
      await loadAccounts()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      {error ? <div className="app-notice danger">{error}</div> : null}
      <AgentTokensPanel />
      <Card className="sec">
        <CardHeader className="sec-h">
          <div>
            <div className="sec-lbl">License Gate</div>
            <CardTitle className="sec-title">Account Registry</CardTitle>
            <CardDescription>Approve, pause, or block MT5 accounts without storing trade passwords.</CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>Import CSV</Button>
        </CardHeader>
        <CardContent>
          <form className="registry-form" onSubmit={createAccount}>
            <Input placeholder="account_login" value={form.account_login} onChange={(event) => updateForm('account_login', event.target.value)} required />
            <Input placeholder="broker_server" value={form.broker_server} onChange={(event) => updateForm('broker_server', event.target.value)} required />
            <Input placeholder="broker_name" value={form.broker_name} onChange={(event) => updateForm('broker_name', event.target.value)} />
            <Input placeholder="symbol" value={form.symbol} onChange={(event) => updateForm('symbol', event.target.value)} />
            <DashboardSelect value={form.account_type} onValueChange={(value) => updateForm('account_type', value)} options={[{ value: 'cent', label: 'cent' }, { value: 'standard', label: 'standard' }, { value: 'demo', label: 'demo' }, { value: 'live', label: 'live' }]} />
            <DashboardSelect value={form.status} onValueChange={(value) => updateForm('status', value)} options={ACCOUNT_GATE_STATUSES.map((status) => ({ value: status, label: status }))} />
            <Input placeholder="owner/client note" value={form.owner_name} onChange={(event) => updateForm('owner_name', event.target.value)} />
            <Input placeholder="risk profile / preset" value={form.risk_profile} onChange={(event) => updateForm('risk_profile', event.target.value)} />
            <Input placeholder="allowed version" value={form.allowed_version} onChange={(event) => updateForm('allowed_version', event.target.value)} />
            <Input placeholder="build hash" value={form.allowed_build_hash} onChange={(event) => updateForm('allowed_build_hash', event.target.value)} />
            <Input placeholder="expiry_date YYYY-MM-DD" value={form.expiry_date} onChange={(event) => updateForm('expiry_date', event.target.value)} />
            <Input placeholder="reason" value={form.reason} onChange={(event) => updateForm('reason', event.target.value)} />
            <div className="registry-ea-picks">
              {ACCOUNT_GATE_EAS.map((ea) => (
                <Button key={ea} type="button" variant={form.allowed_eas.includes(ea) ? 'default' : 'outline'} onClick={() => toggleEa(ea)}>{ea}</Button>
              ))}
              <div className="registry-custom-ea">
                <Input placeholder="custom EA name" value={customEa} onChange={(event) => setCustomEa(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustomEa() } }} />
                <Button type="button" variant="outline" onClick={addCustomEa}>Add EA</Button>
              </div>
            </div>
            <Button type="submit">Add registry account</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="sec">
        <CardHeader className="sec-h">
          <div><div className="sec-lbl">Filters</div><CardTitle className="sec-title">Registered Accounts</CardTitle></div>
          <div className="registry-toolbar">
            <DashboardSelect value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={[{ value: 'all', label: 'All status' }, ...ACCOUNT_GATE_STATUSES.map((status) => ({ value: status, label: status }))]} />
            <DashboardSelect value={filters.ea} onValueChange={(value) => setFilters((current) => ({ ...current, ea: value }))} options={eaFilterOptions} />
            <Input placeholder="Broker" value={filters.broker} onChange={(event) => setFilters((current) => ({ ...current, broker: event.target.value }))} />
            <Input placeholder="Server" value={filters.server} onChange={(event) => setFilters((current) => ({ ...current, server: event.target.value }))} />
            <Input placeholder="Risk profile" value={filters.risk_profile} onChange={(event) => setFilters((current) => ({ ...current, risk_profile: event.target.value }))} />
            <Input placeholder="Search account/server/client" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
          </div>
        </CardHeader>
        <CardContent>
          <DataTableShell
            kicker="IB Accounts"
            title={loading ? 'Loading registry...' : `${accounts.length} accounts`}
            table={(
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Broker / Server</TableHead>
                    <TableHead>EA / Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last check</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell><div className="tn">{account.account_login}</div><div className="ts">{account.owner_name || account.note || 'No owner note'}</div></TableCell>
                      <TableCell><div>{account.broker_name || '-'}</div><div className="tm">{account.broker_server}</div></TableCell>
                      <TableCell><div>{(account.allowed_eas || []).join(', ') || 'Any EA'}</div><div className="tm">{account.allowed_version || 'Any version'}</div></TableCell>
                      <TableCell><Badge className={`badge ${statusBadgeClass(account.status)}`}>{account.status}</Badge></TableCell>
                      <TableCell className="tm">{account.last_license_check_at || 'Never'}</TableCell>
                      <TableCell>
                        <div className="registry-actions">
                          {ACCOUNT_GATE_STATUSES.map((status) => (
                            <Button key={status} type="button" size="sm" variant={status === account.status ? 'default' : 'outline'} onClick={() => openStatusDialog(account, status)}>{ACCOUNT_GATE_STATUS_LABELS[status] || status}</Button>
                          ))}
                          <Button type="button" size="sm" variant="outline" onClick={() => openHistory(account)}>{Ico.eye} History</Button>
                          <Button type="button" size="sm" variant="outline" className="b-danger" onClick={() => { setDeleteConfirm(''); setDeleteTarget(account) }}>{Ico.trash} Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            mobileRows={(
              <div className="responsive-row-list">
                {accounts.map((account) => (
                  <Card className="responsive-row-card" key={account.id}>
                    <div className="responsive-row-head">
                      <div><div className="responsive-row-title">{account.account_login}</div><div className="responsive-row-sub">{account.broker_server}</div></div>
                      <Badge className={`badge ${statusBadgeClass(account.status)}`}>{account.status}</Badge>
                    </div>
                    <CardContent className="responsive-row-body p-0">
                      <div><span>EA</span><b>{(account.allowed_eas || []).join(', ') || 'Any'}</b></div>
                      <div><span>Last check</span><b>{account.last_license_check_at || 'Never'}</b></div>
                      <div className="registry-actions mobile">
                        {ACCOUNT_GATE_STATUSES.map((status) => <Button key={status} type="button" size="sm" variant="outline" onClick={() => openStatusDialog(account, status)}>{ACCOUNT_GATE_STATUS_LABELS[status] || status}</Button>)}
                        <Button type="button" size="sm" variant="outline" onClick={() => openHistory(account)}>{Ico.eye} History</Button>
                        <Button type="button" size="sm" variant="outline" className="b-danger" onClick={() => { setDeleteConfirm(''); setDeleteTarget(account) }}>{Ico.trash} Delete</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card className="sec">
        <CardHeader className="sec-h"><div><div className="sec-lbl">Audit</div><CardTitle className="sec-title">Recent Registry Events</CardTitle></div></CardHeader>
        <CardContent><AuditLogTable rows={audit.slice(0, 50)} /></CardContent>
      </Card>

      <Dialog open={Boolean(statusTarget)} onOpenChange={(open) => { if (!open) setStatusTarget(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change account status</DialogTitle><DialogDescription>{statusTarget ? `${statusTarget.account.account_login} -> ${statusTarget.status}` : ''}</DialogDescription></DialogHeader>
          <form onSubmit={changeStatus} className="dialog-form">
            <Input value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Reason is required" required />
            <DialogFooter><Button type="button" variant="outline" onClick={() => setStatusTarget(null)}>Cancel</Button><Button type="submit">Save status</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deletingRegistry) { setDeleteTarget(null); setDeleteConfirm('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete registry account?</DialogTitle>
            <DialogDescription>{deleteTarget ? `${deleteTarget.account_login} / ${deleteTarget.broker_server}` : ''}</DialogDescription>
          </DialogHeader>
          <div className="dialog-warning">This removes the account from License Gate approval. Existing dashboard portfolio/trade history is not deleted.</div>
          <Input
            value={deleteConfirm}
            onChange={(event) => setDeleteConfirm(event.target.value)}
            placeholder={deleteTarget ? `Type ${deleteTarget.account_login} to confirm` : 'Type account login to confirm'}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirm('') }} disabled={deletingRegistry}>Cancel</Button>
            <Button type="button" className="b-danger" onClick={deleteRegistryAccount} disabled={deletingRegistry || deleteConfirm.trim() !== String(deleteTarget?.account_login || '')}>{Ico.trash} {deletingRegistry ? 'Deleting...' : 'Delete registry account'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyTarget)} onOpenChange={(open) => { if (!open) { setHistoryTarget(null); setHistoryRows([]) } }}>
        <DialogContent className="wide-dialog">
          <DialogHeader>
            <DialogTitle>License Check History</DialogTitle>
            <DialogDescription>{historyTarget ? `${historyTarget.account_login} / ${historyTarget.broker_server}` : ''}</DialogDescription>
          </DialogHeader>
          <AuditLogTable rows={historyRows} />
          <DialogFooter><Button type="button" variant="outline" onClick={() => { setHistoryTarget(null); setHistoryRows([]) }}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import account registry CSV</DialogTitle><DialogDescription>Required columns: account_login, broker_server. Optional: broker_name, status, allowed_eas, symbol, account_type.</DialogDescription></DialogHeader>
          <form onSubmit={importAccounts} className="dialog-form">
            <textarea className="registry-textarea" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="account_login,broker_server,broker_name,status,allowed_eas" rows={8} />
            {importReport.length ? <div className="import-report">{importReport.slice(0, 8).map((row, index) => <div key={index}>{row.row}: {row.status} {row.reason || row.account_login || ''}</div>)}</div> : null}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setImportOpen(false)}>Close</Button><Button type="submit">Import</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AuditLogPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    fetch(`${API_URL}/api/admin/audit-log`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error(`Audit API ${response.status}`)
        return response.json()
      })
      .then((result) => { if (active) setRows(result.audit || []) })
      .catch((err) => { if (active) setError(err.message) })
    return () => { active = false }
  }, [])
  return (
    <>
      {error ? <div className="app-notice danger">{error}</div> : null}
      <Card className="sec">
        <CardHeader className="sec-h">
          <div><div className="sec-lbl">Admin Security</div><CardTitle className="sec-title">Audit Log</CardTitle><CardDescription>Status changes, license checks, import events, and failed account checks.</CardDescription></div>
          <Badge className="chip cd">{rows.length} events</Badge>
        </CardHeader>
        <CardContent><AuditLogTable rows={rows} /></CardContent>
      </Card>
    </>
  )
}

export default function App() {
  const [page, setPage] = useState("overview")
  const [time, setTime] = useState(new Date())
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [data, setData] = useState(null)
  const [sysData, setSysData] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const [brokerFilter, setBrokerFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortMode, setSortMode] = useState('equity-desc')
  const [strategyFilter, setStrategyFilter] = useState('all')
  const [periodKey, setPeriodKey] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingAccount, setEditingAccount] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingPortfolio, setDeletingPortfolio] = useState(false)
  const [notice, setNotice] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  const isAdmin = user?.role === 'admin'

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (user) setCommandOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [user])

  // Auth & Fetch
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      if (!response.ok) throw new Error('No session')
      const currentUser = await response.json()
      if (!currentUser.authenticated) throw new Error('No session')
      setUser(currentUser)
    } catch {
      setUser(null)
      setData(null)
    } finally {
      setAuthChecked(true)
    }
  }, [])

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard`, { headers: { 'Content-Type': 'application/json' }, credentials: 'include' })
      if (response.status === 401) { setUser(null); setData(null); return }
      if (!response.ok) throw new Error(`Dashboard API ${response.status}`)
      const result = await response.json()
      setData(normalizeDashboardPayload(result))
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSystem = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/system`, { credentials: 'include' })
      if (response.ok) setSysData(await response.json())
    } catch {}
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/logs`, { credentials: 'include' })
      if (response.ok) setLogs((await response.json()).logs || [])
    } catch {}
  }, [])

  const logout = useCallback(async () => {
    try { await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }) } catch {}
    setUser(null)
    setData(null)
    setPage('overview')
  }, [])

  const syncNow = useCallback(() => {
    fetchDashboard()
    if (isAdmin) {
      fetchSystem()
      fetchLogs()
    }
  }, [fetchDashboard, fetchLogs, fetchSystem, isAdmin])

  useEffect(() => { checkSession() }, [checkSession])

  useEffect(() => {
    if (!user) return
    fetchDashboard()
    if (isAdmin) {
      fetchSystem()
      fetchLogs()
    }
  }, [fetchDashboard, fetchSystem, fetchLogs, user, isAdmin])

  useEffect(() => {
    if (!autoRefresh || !user) return undefined
    const timer = window.setInterval(() => {
      fetchDashboard()
      if (isAdmin) {
        fetchSystem()
        if (page === 'logs') fetchLogs()
      }
    }, 10000)
    return () => window.clearInterval(timer)
  }, [autoRefresh, fetchDashboard, fetchSystem, fetchLogs, page, user, isAdmin])

  const openNameEditor = useCallback((account) => {
    setEditingAccount(account)
    setEditingName(account?.display_name || '')
  }, [])

  const closeNameEditor = useCallback(() => {
    if (savingName) return
    setEditingAccount(null)
    setEditingName('')
  }, [savingName])

  const saveAccountName = useCallback(async (event) => {
    event.preventDefault()
    if (!editingAccount || !isAdmin) return
    setSavingName(true)
    try {
      const response = await fetch(`${API_URL}/api/accounts/${encodeURIComponent(editingAccount.account_number)}/name`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ display_name: editingName }),
      })
      if (!response.ok) throw new Error(`Save name API ${response.status}`)
      const updated = await response.json()
      setData((current) => {
        if (!current?.accounts) return current
        return {
          ...current,
          accounts: current.accounts.map((account) =>
            account.account_number === updated.account_number ? { ...account, display_name: updated.display_name } : account,
          ),
        }
      })
      setEditingAccount(null)
      setEditingName('')
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingName(false)
    }
  }, [editingAccount, editingName, isAdmin])

  const openDeleteDialog = useCallback((account) => {
    setDeletingAccount(account)
    setDeleteConfirmation('')
  }, [])

  const closeDeleteDialog = useCallback(() => {
    if (deletingPortfolio) return
    setDeletingAccount(null)
    setDeleteConfirmation('')
  }, [deletingPortfolio])

  const deletePortfolio = useCallback(async (event) => {
    event.preventDefault()
    if (!deletingAccount || !isAdmin || deleteConfirmation !== 'DELETE') return
    setDeletingPortfolio(true)
    try {
      const response = await fetch(`${API_URL}/api/accounts/${encodeURIComponent(deletingAccount.account_number)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.detail || `Delete portfolio API ${response.status}`)
      setData((current) => current ? {
        ...current,
        accounts: (current.accounts || []).filter((account) => account.account_number !== deletingAccount.account_number),
        equity_snapshots: (current.equity_snapshots || []).filter((snapshot) => snapshot.account_number !== deletingAccount.account_number),
      } : current)
      setDeletingAccount(null)
      setDeleteConfirmation('')
      setError(null)
      setNotice(`${accountLabel(deletingAccount)} deleted. Disable its MT5 Reporter to keep it removed.`)
      window.setTimeout(() => setNotice(''), 7000)
      await fetchDashboard()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingPortfolio(false)
    }
  }, [deletingAccount, deleteConfirmation, fetchDashboard, isAdmin])

  const accounts = data?.accounts || []
  const brokers = useMemo(() => Array.from(new Set(accounts.map((a) => a.broker).filter(Boolean))).sort(), [accounts])
  const periodRange = useMemo(() => getPeriodRange(periodKey, customStart, customEnd), [periodKey, customStart, customEnd])
  const strategyOptions = useMemo(() => {
    const values = new Set(accounts.map((account) => inferEaProfile(account, data?.equity_snapshots || []).strategy))
    return Array.from(values).sort()
  }, [accounts, data?.equity_snapshots])

  const filteredAccounts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const getStatus = (account) => {
      const age = getAge(account).seconds
      if (age < 330) return 'live'
      if (age < 1800) return 'stale'
      return 'offline'
    }

    const next = accounts.filter((account) => {
      const brokerMatch = brokerFilter === 'all' || account.broker === brokerFilter
      const statusMatch = statusFilter === 'all' || getStatus(account) === statusFilter
      const strategyMatch = strategyFilter === 'all' || inferEaProfile(account, data?.equity_snapshots || []).strategy === strategyFilter
      const searchMatch = !term || [
        accountLabel(account),
        account.account_number,
        account.broker,
      ].some((value) => String(value || '').toLowerCase().includes(term))
      return brokerMatch && statusMatch && strategyMatch && searchMatch
    })

    const numeric = (account, key) => Number(account[key] || 0)
    return [...next].sort((a, b) => {
      if (sortMode === 'equity-asc') return numeric(a, 'equity') - numeric(b, 'equity')
      if (sortMode === 'floating-desc') return (Number(b.equity || 0) - Number(b.balance || 0)) - (Number(a.equity || 0) - Number(a.balance || 0))
      if (sortMode === 'floating-asc') return (Number(a.equity || 0) - Number(a.balance || 0)) - (Number(b.equity || 0) - Number(b.balance || 0))
      if (sortMode === 'dd-desc') return accountMaxDrawdown(b, data?.equity_snapshots || []) - accountMaxDrawdown(a, data?.equity_snapshots || [])
      if (sortMode === 'name-asc') return accountLabel(a).localeCompare(accountLabel(b))
      return numeric(b, 'equity') - numeric(a, 'equity')
    })
  }, [accounts, brokerFilter, statusFilter, strategyFilter, sortMode, searchTerm, data?.equity_snapshots])

  const brokerScopedAccounts = useMemo(() => {
    if (brokerFilter === 'all') return accounts
    return accounts.filter((account) => account.broker === brokerFilter)
  }, [accounts, brokerFilter])

  const summary = useMemo(() => summarize(filteredAccounts, data?.equity_snapshots || []), [filteredAccounts, data?.equity_snapshots])
  const periodStats = useMemo(() => buildPeriodStats(filteredAccounts, periodRange), [filteredAccounts, periodRange])
  const equitySeries = useMemo(() => buildEquitySeries(filteredAccounts, data?.equity_snapshots || []), [filteredAccounts, data?.equity_snapshots])
  const rankings = useMemo(() => buildRankings(filteredAccounts, periodRange), [filteredAccounts, periodRange])
  const monthlyRows = useMemo(() => buildMonthlyRows(filteredAccounts, periodRange), [filteredAccounts, periodRange])
  const symbols = useMemo(() => buildSymbolExposure(accounts), [accounts])

  if (!authChecked || (user && loading)) {
    return <LoadingSkeleton />
  }

  if (!user) {
    return <LoginScreen onLogin={(nextUser) => { setUser(nextUser); setLoading(true) }} />
  }

  const NAV = [
    { id:"overview", label:"Overview",       icon:Ico.overview  },
    { id:"advisors", label:"Expert Advisors", icon:Ico.advisors  },
    { id:"symbols",  label:"Symbols",         icon:Ico.symbols   },
    { id:"trades",   label:"Active Trades",   icon:Ico.trades    },
    { id:"mt5preview", label:"MT5 Preview",    icon:Ico.reporter  },
    { id:"history",  label:"History",         icon:Ico.trades    },
    ...(isAdmin ? [
      { id:"accounts", label:"IB Accounts",     icon:Ico.lock      },
      { id:"reporter", label:"MT5 Reporter",    icon:Ico.reporter  },
      { id:"logs",     label:"System Health",   icon:Ico.logs      },
      { id:"audit",    label:"Audit Log",       icon:Ico.logs      },
    ] : [])
  ]

  const PAGE_TITLES = {
    overview:"Overview", advisors:"Expert Advisors", symbols:"Symbols",
    trades:"Active Trades", mt5preview:"MT5 Preview", history:"History",
    accounts:"IB Accounts", reporter:"MT5 Reporter", logs:"System Health", audit:"Audit Log",
  }

  const showFilterBar = ['overview', 'advisors', 'trades', 'mt5preview'].includes(page)
  const showPeriodFilter = page === 'overview'
  const showAccountTools = page === 'advisors'
  const MOBILE_PRIMARY_IDS = ['overview', 'advisors', 'trades', 'mt5preview', 'history']
  const MOBILE_NAV = NAV.filter((item) => MOBILE_PRIMARY_IDS.includes(item.id))
  const MOBILE_MORE_NAV = NAV.filter((item) => !MOBILE_PRIMARY_IDS.includes(item.id))
  const mobileLabel = (item) => item.id === 'advisors' ? 'EAs'
    : item.id === 'trades' ? 'Trades'
    : item.id === 'mt5preview' ? 'Preview'
    : item.id === 'history' ? 'Reports'
    : item.id === 'accounts' ? 'Accounts'
    : item.id === 'reporter' ? 'Reporter'
    : item.id === 'logs' ? 'Health'
    : item.id === 'audit' ? 'Audit'
    : item.label

  const PAGES = {
    overview: <OverviewPage stats={periodStats} summary={summary} equitySeries={equitySeries} rankings={rankings} filteredAccounts={filteredAccounts} monthlyRows={monthlyRows} snapshots={data?.equity_snapshots || []} sysData={sysData} lastUpdate={lastUpdate} periodRange={periodRange} isAdmin={isAdmin} onNavigate={setPage} />,
    advisors: <AdvisorsPage accounts={filteredAccounts} snapshots={data?.equity_snapshots || []} onEditName={openNameEditor} onDeleteAccount={openDeleteDialog} isAdmin={isAdmin} />,
    symbols:  <SymbolsPage symbols={symbols} />,
    trades:   <TradesPage accounts={brokerScopedAccounts} isAdmin={isAdmin} lastUpdate={lastUpdate} />,
    mt5preview: <MT5PreviewPage accounts={brokerScopedAccounts} snapshots={data?.equity_snapshots || []} lastUpdate={lastUpdate} />,
    history:  <HistoryPage accounts={accounts} isAdmin={isAdmin} />,
    accounts: <AdminAccountsPage />,
    reporter: <ReporterPage accounts={accounts} lastUpdate={lastUpdate} isAdmin={isAdmin} />,
    logs:     <LogsPage sysData={sysData} accounts={accounts} lastUpdate={lastUpdate} />,
    audit:    <AuditLogPage />
  }

  return (
    <>
      <div className="dash">
        {/* Sidebar (Desktop) */}
        <div className="sb">
          <div className="sb-logo">
            <div className="sb-icon">TE</div>
            <div>
              <div className="sb-brand">The Entity</div>
              <div className="sb-sub">Portfolio Monitor</div>
            </div>
          </div>
          <div className="sb-nav">
            {NAV.map(n => (
              <div key={n.id} className={cn('ni', page === n.id && 'on')} onClick={() => { setPage(n.id); setMobileMenuOpen(false); }}>
                {n.icon} {n.label}
              </div>
            ))}
          </div>
          <div className="sb-foot">
            <div className="lpill"><span className="ldot" />{user.role} / Live</div>
            <div className="sb-foot-stats">
              <div>Sync: {lastUpdate ? lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Waiting'}</div>
              <div>Active: {accounts.filter((account) => getAge(account).seconds < 1800).length} EAs</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="tb">
            <div className="tb-l">
              <span className="tb-sec">The Entity</span>
              <span className="tb-title">{PAGE_TITLES[page]}</span>
            </div>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button className="mobile-menu-btn" variant="ghost" size="icon" type="button" aria-label="Open mobile menu" aria-expanded={mobileMenuOpen}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.t1} strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(360px,calc(100vw-24px))] border-border/70 bg-[#111926] p-3 text-foreground sm:max-w-sm">
                <SheetHeader className="p-1 pb-2">
                  <SheetTitle className="truncate font-['Chakra_Petch'] text-base text-foreground">{user.username || user.role}</SheetTitle>
                  <SheetDescription className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.08em] text-primary">{user.role}</SheetDescription>
                </SheetHeader>
                <Separator className="my-2 bg-border/70" />
                <div className="mobile-page-grid">
                  {NAV.map((item) => (
                    <Button
                      key={`mobile-menu-${item.id}`}
                      type="button"
                      variant="ghost"
                      className={cn(page === item.id && 'on')}
                      onClick={() => { setPage(item.id); setMobileMenuOpen(false); }}
                    >
                      {item.icon}<span>{mobileLabel(item)}</span>
                    </Button>
                  ))}
                </div>
                <Separator className="my-2 bg-border/70" />
                {isAdmin && (
                  <label className="mobile-action-row">
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} aria-label="Toggle auto sync" />
                    Auto sync
                  </label>
                )}
                {isAdmin && (
                  <Button className="mobile-action-row" type="button" variant="ghost" onClick={() => { syncNow(); setMobileMenuOpen(false); }}>
                    {Ico.sync} Sync now
                  </Button>
                )}
                <Button className="mobile-action-row" type="button" variant="ghost" onClick={() => { setCommandOpen(true); setMobileMenuOpen(false); }}>
                  {Ico.overview} Command palette
                </Button>
                <Button className="mobile-action-row danger" type="button" variant="ghost" onClick={logout}>
                  {Ico.logout} Logout
                </Button>
              </SheetContent>
            </Sheet>

            <div className="tb-r">
              <span className="tb-time">{time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button data-shell-action className="h-8 border-border/60 bg-secondary/70 px-3 font-['JetBrains_Mono'] text-[11px] text-muted-foreground hover:bg-secondary hover:text-primary" onClick={() => setCommandOpen(true)} type="button" variant="outline">
                      Search
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open command palette</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {isAdmin && (
                <label className="ach">
                  <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} aria-label="Toggle auto sync" />
                  Auto sync
                </label>
              )}
              {isAdmin && (
                <Button data-shell-action className="h-8 bg-primary px-3 text-primary-foreground hover:bg-primary/90" onClick={syncNow}>
                  {Ico.sync} Sync
                </Button>
              )}
              <Button data-shell-action className="h-8 border-border/60 bg-secondary/70 px-3 text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={logout} variant="outline">
                {Ico.logout} Logout
              </Button>
            </div>
          </div>

          {error && <div style={{ background: C.redD, color: C.red, padding: '10px 20px', fontSize: 13, borderBottom: `1px solid ${C.red}` }}>{error}</div>}
          {notice && <div className="app-notice">{notice}</div>}

          {/* Page-specific filters */}
          {showFilterBar && (
            <div className="filter-shell">
              <div className="filter-bar">
                <BrokerAccountFilter brokers={brokers} accounts={accounts} selected={brokerFilter} onSelect={setBrokerFilter} />
                {showPeriodFilter && (
                  <PeriodFilter
                  value={periodKey}
                  onChange={setPeriodKey}
                  range={periodRange}
                  customStart={customStart}
                    customEnd={customEnd}
                    onCustomStart={setCustomStart}
                    onCustomEnd={setCustomEnd}
                  />
                )}
                {showAccountTools && (
                  <AccountFilterControls
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortMode={sortMode}
                    setSortMode={setSortMode}
                    strategyFilter={strategyFilter}
                    setStrategyFilter={setStrategyFilter}
                    strategyOptions={strategyOptions}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                  />
                )}
              </div>
            </div>
          )}

          <div className="page" key={page}>{PAGES[page]}</div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className={cn('mobile-nav', mobileMenuOpen && 'open')}>
        {MOBILE_NAV.map(n => (
          <div key={n.id} className={cn('mobile-ni', page === n.id && 'on')} onClick={() => { setPage(n.id); setMobileMenuOpen(false); }}>
            {n.icon} <span>{mobileLabel(n)}</span>
          </div>
        ))}
        {MOBILE_MORE_NAV.length > 0 && (
          <div className={cn('mobile-ni', MOBILE_MORE_NAV.some((item) => item.id === page) && 'on')} onClick={() => setMobileMenuOpen(true)}>
            {Ico.logs} <span>More</span>
          </div>
        )}
      </div>

      {isAdmin && <AccountNameDialog account={editingAccount} value={editingName} onChange={setEditingName} onCancel={closeNameEditor} onSave={saveAccountName} saving={savingName} />}
      {isAdmin && <DeleteAccountDialog account={deletingAccount} confirmation={deleteConfirmation} onConfirmationChange={setDeleteConfirmation} onCancel={closeDeleteDialog} onDelete={deletePortfolio} deleting={deletingPortfolio} />}
      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={setPage}
        onSync={syncNow}
        isAdmin={isAdmin}
        accounts={filteredAccounts}
      />
    </>
  )
}
