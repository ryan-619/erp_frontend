// ====================================================================
// Module: Attendance
// Page: Take Attendance (class roster)
//
// The fast workflow: pick a class + section + date → every student loads
// pre-marked Present → flip only the exceptions → one Save (idempotent).
//
// Data Source: attendance.service.js
//   GET  /api/attendance/roster   → roster with default-present marks
//   POST /api/attendance/roster   → bulk idempotent upsert
// ====================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Loader as Loader2, Save, Search, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { ClassSectionPicker } from '@/components/ClassSectionPicker'
import { attendanceService } from '@/services/attendance.service'
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

export default function StudentAttendancePage() {
  const [picker, setPicker] = useState({ class_name: '', section: '' })
  const [date, setDate] = useState(today())
  const [roster, setRoster] = useState([])
  const [alreadyMarked, setAlreadyMarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')

  const loadRoster = useCallback(async () => {
    if (!picker.class_name || !date) return
    setLoading(true)
    try {
      const data = await attendanceService.getRoster({
        class_name: picker.class_name,
        section: picker.section || undefined,
        date,
      })
      setRoster((data?.students || []).map((s) => ({ ...s })))
      setAlreadyMarked(Boolean(data?.already_marked))
      setLoaded(true)
    } catch (e) {
      toast({ title: 'Could not load roster', description: e?.message || 'Please try again.', variant: 'destructive' })
      setRoster([]); setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [picker.class_name, picker.section, date])

  // Auto-load whenever the class/section/date changes.
  useEffect(() => { loadRoster() }, [loadRoster])

  const setStatus = (studentId, status) =>
    setRoster((prev) => prev.map((s) => (s.student_id === studentId ? { ...s, status } : s)))

  const markAll = (status) => setRoster((prev) => prev.map((s) => ({ ...s, status })))

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0, 'half-day': 0, leave: 0 }
    roster.forEach((s) => { c[s.status] = (c[s.status] || 0) + 1 })
    return c
  }, [roster])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roster
    return roster.filter((s) => s.name.toLowerCase().includes(q) || String(s.roll_number).toLowerCase().includes(q))
  }, [roster, search])

  const save = async () => {
    if (!roster.length) return
    setSaving(true)
    try {
      await attendanceService.saveRoster({
        class_name: picker.class_name,
        section: picker.section || undefined,
        date,
        marks: roster.map((s) => ({ student_id: s.student_id, status: s.status })),
      })
      toast({ title: 'Attendance saved', description: `${roster.length} students · ${counts.present} present, ${counts.absent} absent.` })
      setAlreadyMarked(true)
    } catch (e) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance' }, { label: 'Take Attendance' }]} />

      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Take Attendance</h1>
        <p className="text-sm text-muted-foreground">Pick a class — everyone starts <span className="font-medium text-success">Present</span>. Just flip the exceptions and save.</p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <ClassSectionPicker value={picker} onChange={setPicker} />
          <div className="min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
            <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Empty prompt */}
      {!picker.class_name && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Select a class to begin</p>
          <p className="text-xs text-muted-foreground">Choose a class (and optionally a section) above to load its students.</p>
        </CardContent></Card>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading roster…
        </div>
      )}

      {/* Roster */}
      {!loading && loaded && picker.class_name && roster.length === 0 && (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">
          No students found in {picker.class_name}{picker.section ? ` · ${picker.section}` : ''}.
        </CardContent></Card>
      )}

      {!loading && roster.length > 0 && (
        <>
          {/* Summary + bulk actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{roster.length} students</span>
              <span className="text-success">· {counts.present} present</span>
              <span className="text-destructive">· {counts.absent} absent</span>
              {counts.late > 0 && <span className="text-warning">· {counts.late} late</span>}
              {counts.leave > 0 && <span className="text-muted-foreground">· {counts.leave} leave</span>}
              {alreadyMarked && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Already marked today</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => markAll('present')}><CheckCheck className="mr-1.5 h-4 w-4" /> All present</Button>
              <Button variant="outline" size="sm" onClick={() => markAll('absent')}>All absent</Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search student or roll no…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Student rows */}
          <Card><CardContent className="divide-y p-0">
            {visible.map((s) => (
              <div key={s.student_id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(s.name)}</div>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Roll {s.roll_number || '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setStatus(s.student_id, st.key)}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                        s.status === st.key ? st.cls : 'border-transparent text-muted-foreground hover:bg-accent',
                      )}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent></Card>

          {/* Save */}
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
