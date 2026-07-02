// Unified empty-state component. Consolidates the ad-hoc .empty-note /
// .empty-table-cell / inline-styled "No X" messages into one consistent
// look: muted icon tile + title + optional message.
//
// Props:
//  - title: short label, e.g. "No open exposure"
//  - message: optional longer description
//  - icon: optional svg node (defaults to a check-style mark)
//  - variant: 'block' (default, standalone) | 'cell' (inside a table cell)
//  - tone: 'muted' (default) | 'success' | 'warn'
export default function EmptyState({ title, message, icon, variant = 'block', tone = 'muted' }) {
  const defaultIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  )
  return (
    <div className={`empty-state ${variant !== 'block' ? variant : ''} tone-${tone}`}>
      <span className="empty-state-icon">{icon || defaultIcon}</span>
      {title ? <div className="empty-state-title">{title}</div> : null}
      {message ? <div className="empty-state-msg">{message}</div> : null}
    </div>
  )
}
