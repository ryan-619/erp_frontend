// ====================================================================
// Formatting Helpers
//
// Purpose:
// Centralizes value formatting (numbers, currency, dates, names) so every
// module renders consistent labels without duplicating Intl logic.
//
// Reused by:
//   - DataTable cells and export columns
//   - StatCard / dashboard KPIs
//   - Every module's list and detail pages
//
// Why separate from UI:
//   Keeping formatters pure (no JSX) makes them trivially testable and
//   reusable in both render and CSV-export contexts.
// ====================================================================

// Formats integers with locale-aware thousands separators; null/undefined renders an em-dash.
export function formatNumber(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

// Formats a numeric amount as currency, dropping cents for compactness in tables.
export function formatCurrency(value, currency = 'USD') {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

// Shortens large numbers (1.2K, 3.4M) for use in KPI cards where space is limited.
export function formatCompact(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value)
}

// Formats dates as "MMM d, yyyy" by default; callers can override via opts.
export function formatDate(date, opts = {}) {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...opts,
  }).format(d)
}

// Renders "2 hours ago"-style timestamps for activity feeds and timelines, falling back to formatDate beyond 30 days.
export function formatRelativeTime(date) {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const mins = Math.round(diff / 60000)
  if (Math.abs(mins) < 60) return rtf.format(-mins, 'minute')
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return rtf.format(-days, 'day')
  return formatDate(d)
}

// Accepts a plain string or the backend's nested { first, last } name object.
// Normalizes both shapes so components don't need to know the API structure.
export function fullName(name) {
  if (!name) return ''
  if (typeof name === 'string') return name
  return [name.first, name.last].filter(Boolean).join(' ')
}

// Derives up to two uppercase initials for avatar placeholders.
export function initials(name = '') {
  const full = typeof name === 'string' ? name : fullName(name)
  return full
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Joins truthy class strings; lightweight alternative to cn() for non-Tailwind contexts.
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// Returns a debounced wrapper that delays `fn` until input settles — used by search inputs.
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
