// ====================================================================
// Module: Reports
// Page: Fee Collection — totals by date range, payment mode and day.
// ====================================================================

import { useCallback, useEffect, useState } from 'react'
import { IndianRupee, Loader as Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { reportsService } from '@/services/reports.service'
import { toast } from '@/hooks/use-toast'

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}
const today = () => new Date().toISOString().slice(0, 10)
const monthAgo = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10) }
const money = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n ?? 0)

export default function FeeCollectionReportPage() {
  const [from, setFrom] = useState(monthAgo())
  const [to, setTo] = useState(today())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await reportsService.feeCollection({ from, to })) }
    catch (e) { toast({ title: 'Could not load report', description: e?.message || 'Try again.', variant: 'destructive' }); setData(null) }
    finally { setLoading(false) }
  }, [from, to])
  useEffect(() => { load() }, [load])

  const exportCsv = () => {
    if (!data) return
    downloadCsv(`fee-collection-${from}_to_${to}.csv`, [
      ['Receipt', 'Student', 'Class', 'Amount', 'Mode', 'Date'],
      ...data.payments.map((p) => [p.receipt_no, p.student, p.class_name, p.amount, p.mode, p.date ? new Date(p.date).toISOString().slice(0, 10) : '']),
    ])
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Reports' }, { label: 'Fee Collection' }]} />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Fee Collection Report</h1>
        <p className="text-sm text-muted-foreground">What was collected in a period, by mode and by day.</p>
      </div>

      <Card><CardContent className="flex flex-wrap items-end gap-4 p-4">
        <div><label className="mb-1 block text-xs font-medium text-muted-foreground">From</label><Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label className="mb-1 block text-xs font-medium text-muted-foreground">To</label><Input type="date" value={to} max={today()} onChange={(e) => setTo(e.target.value)} /></div>
      </CardContent></Card>

      {loading && <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}

      {!loading && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total collected</p><p className="mt-1 flex items-center text-2xl font-bold"><IndianRupee className="h-5 w-5" />{money(data.total)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Payments</p><p className="mt-1 text-2xl font-bold">{data.count}</p></CardContent></Card>
            {data.by_mode.slice(0, 2).map((m) => (
              <Card key={m.mode}><CardContent className="p-4"><p className="text-xs capitalize text-muted-foreground">{m.mode}</p><p className="mt-1 text-2xl font-bold">₹{money(m.amount)}</p></CardContent></Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data.payments.length}><Download className="mr-1.5 h-4 w-4" /> Export CSV</Button>
          </div>

          {data.payments.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No payments recorded in this period.</CardContent></Card>
          ) : (
            <Card><CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Receipt</th><th className="px-3 py-2">Student</th><th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2">Mode</th><th className="px-3 py-2">Date</th>
                </tr></thead>
                <tbody>
                  {data.payments.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2">{p.receipt_no || '—'}</td>
                      <td className="px-3 py-2 font-medium">{p.student}</td>
                      <td className="px-3 py-2">{p.class_name || '—'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">₹{money(p.amount)}</td>
                      <td className="px-3 py-2 capitalize">{p.mode || '—'}</td>
                      <td className="px-3 py-2">{p.date ? new Date(p.date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  )
}
