// ====================================================================
// Module: Reports
// Page: Exam Result Analysis ("report card analysis")
//
// Pick an exam + class/section → class-wide result analysis: pass/fail,
// average, high/low, toppers, grade distribution, and a ranked per-student
// table. Exports to CSV.
// ====================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, Loader as Loader2, Download, Trophy, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { ClassSectionPicker } from '@/components/ClassSectionPicker'
import { reportsService } from '@/services/reports.service'
import { examinationService } from '@/services/examination.service'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const Stat = ({ label, value, tone }) => (
  <Card><CardContent className="p-4">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className={cn('mt-1 text-2xl font-bold tracking-tight', tone)}>{value}</p>
  </CardContent></Card>
)

export default function ExamAnalysisPage() {
  const [examGroups, setExamGroups] = useState([])
  const [examGroupId, setExamGroupId] = useState('')
  const [picker, setPicker] = useState({ class_name: '', section: '' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    examinationService.getExamGroups({ limit: 500 })
      .then((g) => setExamGroups(Array.isArray(g) ? g : g?.data || []))
      .catch(() => setExamGroups([]))
  }, [])

  const ready = examGroupId && picker.class_name
  const load = useCallback(async () => {
    if (!ready) { setData(null); return }
    setLoading(true)
    try {
      const d = await reportsService.examAnalysis({ exam_group_id: examGroupId, class_name: picker.class_name, section: picker.section || undefined })
      setData(d)
    } catch (e) {
      toast({ title: 'Could not load analysis', description: e?.message || 'Try again.', variant: 'destructive' })
      setData(null)
    } finally { setLoading(false) }
  }, [ready, examGroupId, picker.class_name, picker.section])
  useEffect(() => { load() }, [load])

  const rows = useMemo(() => {
    const list = data?.students || []
    const q = search.trim().toLowerCase()
    return q ? list.filter((s) => s.name.toLowerCase().includes(q) || String(s.roll_number).includes(q)) : list
  }, [data, search])

  const exportCsv = () => {
    if (!data) return
    downloadCsv(`exam-analysis-${picker.class_name}.csv`, [
      ['Rank', 'Name', 'Roll', 'Subjects', 'Obtained', 'Total', 'Percentage', 'Grade', 'Result'],
      ...data.students.map((s) => [s.rank ?? '', s.name, s.roll_number, s.subjects, s.obtained, s.total, s.percentage, s.grade ?? '', s.result]),
    ])
  }

  const s = data?.stats

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Reports' }, { label: 'Exam Analysis' }]} />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Exam Result Analysis</h1>
        <p className="text-sm text-muted-foreground">Class-wide performance for an exam — pass rate, toppers, grades and a ranked list.</p>
      </div>

      <Card><CardContent className="flex flex-wrap items-end gap-4 p-4">
        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Exam</label>
          <Select value={examGroupId} onValueChange={setExamGroupId}>
            <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
            <SelectContent>
              {examGroups.length === 0 ? <SelectItem value="__none" disabled>No exams</SelectItem>
                : examGroups.map((g) => <SelectItem key={g._id} value={g._id}>{g.exam_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <ClassSectionPicker value={picker} onChange={setPicker} />
      </CardContent></Card>

      {!ready && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Choose an exam and class</p>
          <p className="text-xs text-muted-foreground">Pick both above to generate the analysis.</p>
        </CardContent></Card>
      )}

      {loading && <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</div>}

      {!loading && s && (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Appeared" value={`${s.appeared}/${s.total_students}`} />
            <Stat label="Pass rate" value={`${s.pass_percentage}%`} tone="text-success" />
            <Stat label="Passed" value={s.passed} tone="text-success" />
            <Stat label="Failed" value={s.failed} tone={s.failed ? 'text-destructive' : ''} />
            <Stat label="Average" value={`${s.average}%`} />
            <Stat label="High / Low" value={`${s.highest}/${s.lowest}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2"><CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Trophy className="h-4 w-4 text-warning" /> Toppers</div>
              <div className="flex flex-wrap gap-3">
                {s.toppers.length ? s.toppers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15 text-xs font-bold text-warning">{i + 1}</span>
                    <span className="text-sm font-medium">{t.name}</span>
                    <span className="text-sm font-semibold text-success">{t.percentage}%</span>
                  </div>
                )) : <span className="text-sm text-muted-foreground">No marks entered yet.</span>}
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="mb-3 text-sm font-semibold">Grade distribution</div>
              {s.grade_distribution.length ? (
                <ul className="space-y-1.5 text-sm">
                  {s.grade_distribution.map((g) => (
                    <li key={g.grade} className="flex items-center justify-between">
                      <span className="text-muted-foreground">Grade {g.grade}</span>
                      <span className="font-medium">{g.count}</span>
                    </li>
                  ))}
                </ul>
              ) : <span className="text-sm text-muted-foreground">Define grades in Examinations → Marks Grade.</span>}
            </CardContent></Card>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search student…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" /> Export CSV</Button>
          </div>

          <Card><CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Rank</th><th className="px-3 py-2">Student</th><th className="px-3 py-2 text-right">Marks</th>
                <th className="px-3 py-2 text-right">%</th><th className="px-3 py-2 text-center">Grade</th><th className="px-3 py-2 text-center">Result</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.student_id} className="border-b last:border-0">
                    <td className="px-3 py-2 tabular-nums">{r.rank ?? '—'}</td>
                    <td className="px-3 py-2"><span className="font-medium">{r.name}</span> <span className="text-xs text-muted-foreground">· {r.roll_number || '—'}</span></td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.total > 0 ? `${r.obtained}/${r.total}` : '—'}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{r.total > 0 ? `${r.percentage}%` : '—'}</td>
                    <td className="px-3 py-2 text-center">{r.grade || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium',
                        r.result === 'Pass' ? 'bg-success/15 text-success' : r.result === 'Fail' ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground')}>{r.result}</span>
                    </td>
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
