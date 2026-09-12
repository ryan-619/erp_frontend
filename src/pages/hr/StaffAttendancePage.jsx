// ====================================================================
// Module: HR
// Page: Staff Attendance (roster)
//
// Pick a date → every staff member loads pre-marked Present → flip the
// exceptions → one Save (idempotent). Mirrors the student roster.
//
// Data Source: hr.service.js
//   GET  /api/hr/staff-attendance-roster
//   POST /api/hr/staff-attendance-roster
// ====================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Loader as Loader2, Save, Search, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { hrService } from '@/services/hr.service'
import { toast } from '@/hooks/use-toast'
import { initials } from '@/utils/format'
import { cn } from '@/lib/utils'

const STATUSES = [
  { key: 'present',  label: 'Present',  cls: 'bg-success/15 text-success border-success/30' },
  { key: 'absent',   label: 'Absent',   cls: 'bg-destructive/15 text-destructive border-destructive/30' },
  { key: 'late',     label: 'Late',     cls: 'bg-warning/15 text-warning border-warning/30' },
  { key: 'excused',  label: 'Excused',  cls: 'bg-primary/10 text-primary border-primary/30' },
  { key: 'half-day', label: 'Half-day', cls: 'bg-chart-4/15 text-chart-4 border-chart-4/30' },
  { key: 'leave',    label: 'Leave',    cls: 'bg-muted text-muted-foreground border-border' },
]
const today = () => new Date().toISOString().slice(0, 10)

export default function StaffAttendancePage() {
  const [date, setDate] = useState(today())
  const [roster, setRoster] = useState([])
  const [alreadyMarked, setAlreadyMarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!date) return
    setLoading(true)
    try {
      const data = await hrService.getStaffRoster({ date })
      setRoster((data?.staff || []).map((s) => ({ ...s })))
      setAlreadyMarked(Boolean(data?.already_marked))
    } catch (e) {
      toast({ title: 'Could not load staff', description: e?.message || 'Please try again.', variant: 'destructive' })
      setRoster([])
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load])

  const setStatus = (id, status) => setRoster((p) => p.map((s) => (s.staff_id === id ? { ...s, status } : s)))
  const markAll = (status) => setRoster((p) => p.map((s) => ({ ...s, status })))

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, leave: 0 }
    roster.forEach((s) => { c[s.status] = (c[s.status] || 0) + 1 })
    return c
  }, [roster])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roster
    return roster.filter((s) => s.name.toLowerCase().includes(q) || String(s.employee_id).toLowerCase().includes(q))
  }, [roster, search])

  const save = async () => {
    if (!roster.length) return
    setSaving(true)
    try {
      await hrService.saveStaffRoster({ date, marks: roster.map((s) => ({ staff_id: s.staff_id, status: s.status })) })
      toast({ title: 'Staff attendance saved', description: `${roster.length} staff · ${counts.present} present, ${counts.absent} absent.` })
      setAlreadyMarked(true)
    } catch (e) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'HR' }, { label: 'Staff Attendance' }]} />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Staff Attendance</h1>
        <p className="text-sm text-muted-foreground">Everyone starts <span className="font-medium text-success">Present</span> — just flip the exceptions and save.</p>
      </div>

      <Card><CardContent className="flex flex-wrap items-end gap-4 p-4">
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
          <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        </div>
      </CardContent></Card>

      {loading && <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading staff…</div>}

      {!loading && roster.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">No staff found</p>
          <p className="text-xs text-muted-foreground">Add staff in the directory to mark their attendance.</p>
        </CardContent></Card>
      )}

      {!loading && roster.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{roster.length} staff</span>
              <span className="text-success">· {counts.present} present</span>
              <span className="text-destructive">· {counts.absent} absent</span>
              {counts.leave > 0 && <span className="text-muted-foreground">· {counts.leave} leave</span>}
              {alreadyMarked && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Already marked</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => markAll('present')}><CheckCheck className="mr-1.5 h-4 w-4" /> All present</Button>
              <Button variant="outline" size="sm" onClick={() => markAll('absent')}>All absent</Button>
            </div>
          </div>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search staff or ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <Card><CardContent className="divide-y p-0">
            {visible.map((s) => (
              <div key={s.staff_id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(s.name)}</div>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.employee_id || '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((st) => (
                    <button key={st.key} type="button" onClick={() => setStatus(s.staff_id, st.key)}
                      className={cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', s.status === st.key ? st.cls : 'border-transparent text-muted-foreground hover:bg-accent')}>
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent></Card>

          <div className="sticky bottom-4 flex justify-end">
            <Button size="lg" onClick={save} disabled={saving} className="shadow-lg">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Save className="mr-2 h-4 w-4" /> Save Attendance</>}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
