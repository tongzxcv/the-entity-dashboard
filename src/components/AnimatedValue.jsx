import { useEffect, useRef, useState } from 'react'

// ponytail: stdlib only (requestAnimationFrame), no count-up library.
// Known ceiling: count-up is smoothest for ~6-figure money; larger values
// still animate but the easing is less perceptible. Upgrade trigger: if
// portfolio equity regularly exceeds 7 figures, raise DURATION or skip animation.
const DURATION = 600
const REDUCED = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

// Parses the leading numeric portion of a formatted string like "+$1,234.56",
// "-$0.00", "34.21%", "12 / 8". Returns { prefix, number, suffix } where the
// animated output is `${prefix}${animatedNumber}${suffix}`.
function parseNumericString(str) {
  const text = String(str ?? '')
  // Match a sign, then anything up to and including the number (allow thousands
  // separators and decimals). Capture prefix (incl. currency symbol / sign
  // position) and the numeric core separately.
  const match = text.match(/^([^0-9-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/)
  if (!match) return null
  const [, prefix, num, suffix] = match
  const cleanNumber = num.replace(/,/g, '')
  const parsed = Number(cleanNumber)
  if (!Number.isFinite(parsed)) return null
  // Detect decimal places so the animated value keeps the same precision.
  const decimals = num.includes('.') ? num.split('.')[1].length : 0
  return { prefix, suffix, from: 0, to: parsed, decimals, hadSign: num.trim().startsWith('-') }
}

function formatNumber(value, decimals) {
  const abs = Math.abs(value)
  const fixed = abs.toFixed(decimals)
  // Re-insert thousands separators.
  const [intPart, decPart] = fixed.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decPart ? `${grouped}.${decPart}` : grouped
}

// AnimatedValue: count-up from 0 on mount, then a short flash-glow when the
// value changes (green for increase, red for decrease). Renders the same
// formatted text the parent would have rendered, so it is a drop-in for
// {fmtS(...)} / {fmtM(...)} / {formatPercent(...)} children.
//
// Props:
//  - value: the formatted string (e.g. "+$1,234.56") OR a number.
//  - tone: 'pnl' | 'plain' — 'pnl' colors the flash by direction; 'plain'
//    uses the accent flash. Default 'plain'.
//  - className: optional wrapper class.
export default function AnimatedValue({ value, tone = 'plain', className, children }) {
  // Prefer explicit value; fall back to children for drop-in replacement.
  const raw = value !== undefined ? value : children
  const [display, setDisplay] = useState(() => REDUCED ? raw : null)
  const [flash, setFlash] = useState('') // '' | 'up' | 'down'
  const rafRef = useRef(null)
  const prevParsedRef = useRef(null)
  const flashTimerRef = useRef(null)

  useEffect(() => {
    if (REDUCED) {
      setDisplay(raw)
      return undefined
    }

    const parsed = typeof raw === 'number' && Number.isFinite(raw)
      ? { prefix: '', suffix: '', from: prevParsedRef.current?.to ?? 0, to: raw, decimals: 0, hadSign: false }
      : parseNumericString(raw)

    // If we can't parse (e.g. "-- / --", "Waiting"), just render the text.
    if (!parsed) {
      setDisplay(raw)
      return undefined
    }

    const isFirst = prevParsedRef.current === null
    const startFrom = isFirst ? 0 : parsed.from
    // Determine direction for flash (only on subsequent updates).
    const previousTo = prevParsedRef.current?.to
    const direction = (previousTo !== undefined && parsed.to > previousTo)
      ? 'up'
      : (previousTo !== undefined && parsed.to < previousTo ? 'down' : '')

    const start = performance.now()
    const tick = (now) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / DURATION)
      const eased = easeOutCubic(t)
      const current = startFrom + (parsed.to - startFrom) * eased
      setDisplay(`${parsed.prefix}${formatNumber(current, parsed.decimals)}${parsed.suffix}`)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(raw) // snap to exact final string (preserves original formatting quirks)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    if (direction) {
      setFlash(direction === 'up' ? 'up' : 'down')
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
      flashTimerRef.current = window.setTimeout(() => setFlash(''), 900)
    }

    prevParsedRef.current = parsed
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    }
  }, [raw])

  // Fallback: if display never set (first render race), show raw.
  const shown = display === null ? raw : display
  const flashClass = tone === 'pnl'
    ? (flash === 'up' ? ' av-flash-up' : flash === 'down' ? ' av-flash-down' : '')
    : (flash ? ' av-flash-accent' : '')

  return (
    <span className={`av${flashClass}${className ? ' ' + className : ''}`}>
      {shown}
    </span>
  )
}
