// ====================================================================
// CSV Export Utility
//
// Purpose:
// Generates and downloads a CSV file from tabular data entirely client-side,
// avoiding the need for a server round-trip on every export action.
//
// Used by:
//   - DataTable (bulk export of visible or selected rows)
//   - ExportButtons (standalone export on list pages)
//
// Why client-side:
//   The dataset is already in memory (fetched for the table), so building
//   the CSV in-browser is faster and keeps the backend stateless.
// ====================================================================

// Escapes a single cell value per RFC 4180 — quotes fields containing commas, quotes, or newlines and doubles embedded quotes.
function escapeCsv(value) {
  if (value == null) return ''
  const str = String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Builds the CSV string from `rows`/`columns`, creates a Blob, and triggers a browser download.
export function exportToCsv(rows, columns, filename = 'export') {
  if (!rows || !rows.length) return
  const header = columns.map((c) => escapeCsv(c.label)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escapeCsv(row[c.key])).join(','))
    .join('\n')
  const csv = `${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default exportToCsv
