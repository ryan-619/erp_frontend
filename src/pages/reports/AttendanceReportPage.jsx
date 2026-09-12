// ====================================================================
// Module: Reports
// Page: Attendance Summary — monthly attendance % per student with a
// shortage flag (<75%), the number schools actually act on.
// ====================================================================

import { useCallback, useEffect, useState } from 'react'
import { CalendarCheck, Loader as Loader2, Download, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { ClassSectionPicker } from '@/components/ClassSectionPicker'
import { reportsService } from '@/services/reports.service'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}
const thisMonth = () => new Date().toISOString().slice(0, 7)

export default function AttendanceReportPage() {
  const [picker, setPicker] = useState({ class_name: '', section: '' })
  const [month, setMonth] = useState(thisMonth())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const ready = picker.class_name && month
  const load = useCallback(async () => {
    if (!ready) { setData(null); return }
    setLoading(true)
    try { setData(await reportsService.attendanceSummary({ class_name: picker.class_name, section: picker.section || undefined, month })) }
    catch (e) { toast({ title: 'Could not load report', description: e?.message || 'Try again.', variant: 'destructive' }); setData(null) }
    finally { setLoading(false) }
  }, [ready, picker.class_name, picker.section, month])
  useEffect(() => { load() }, [load])

  const exportCsv = () => {
    if (!data) return
    downloadCsv(`attendance-${picker.class_name}-${month}.csv`, [
      ['Name', 'Roll', 'Present', 'Absent', 'Leave', 'Days marked', 'Percentage', 'Shortage'],
      ...data.students.map((s) => [s.name, s.roll_number, s.present, s.absent, s.leave, s.marked_days, s.percentage ?? '', s.shortage ? 'YES' : '']),
    ])
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Reports' }, { label: 'Attendance' }]} />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Attendance Report</h1>
        <p className="text-sm text-muted-foreground">Monthly attendance per student, with shortage flagged below 75%.</p>
      </div>

      <Card><CardContent className="flex flex-wrap items-end gap-4 p-4">
        <ClassSectionPicker value={picker} onChange={setPicker} />
        <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Month</label><Input type="month" value={month} max={thisMonth()} onChange={(e) => setMonth(e.target.value)} /></div>
      </CardContent></Card>

      {!ready && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Select a class and month</p>
        </CardContent></Card>
      )}

      {loading && <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}

      {!loading && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Students</p><p className="mt-1 text-2xl font-bold">{data.stats.total_students}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Days recorded</p><p className="mt-1 text-2xl font-bold">{data.stats.days_recorded}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Below 75%</p><p className={cn('mt-1 text-2xl font-bold', data.stats.shortage_count && 'text-destructive')}>{data.stats.shortage_count}</p></CardContent></Card>
          </div>

          {data.stats.days_recorded === 0 && (
            <Card><CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-warning" /> No attendance was marked for this class in {month}. Mark it in Attendance → Take Attendance.
            </CardContent></Card>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" /> Export CSV</Button>
          </div>

          <Card><CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Student</th><th className="px-3 py-2 text-right">Present</th><th className="px-3 py-2 text-right">Absent</th>
                <th className="px-3 py-2 text-right">Leave</th><th className="px-3 py-2 text-right">Days</th><th className="px-3 py-2 text-right">%</th>
              </tr></thead>
              <tbody>
                {data.students.map((s, i) => (
                  <tr key={i} className={cn('border-b last:border-0', s.shortage && 'bg-destructive/5')}>
                    <td className="px-3 py-2"><span className="font-medium">{s.name}</span> <span className="text-xs text-muted-foreground">· {s.roll_number || '—'}</span></td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.present}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.absent}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.leave}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.marked_days}</td>
                    <td className={cn('px-3 py-2 text-right tabular-nums font-medium', s.shortage && 'text-destructive')}>{s.percentage == null ? '—' : `${s.percentage}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </>
      )}
    </div>
  )
}
