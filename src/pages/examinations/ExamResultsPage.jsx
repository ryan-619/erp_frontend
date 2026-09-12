// ====================================================================
// Module: Examinations
// Page: Marks Entry (roster)
//
// Pick an exam + subject + class/section → every student loads in a grid →
// enter marks in bulk → one Save (idempotent bulk upsert). This is the
// "view all students in bulk for the fields (marks)" workflow.
//
// Data Source: examination.service.js
//   GET  /api/exam/marks-roster
//   POST /api/exam/marks-roster
// ====================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, Loader as Loader2, Save, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { ClassSectionPicker } from '@/components/ClassSectionPicker'
import { examinationService } from '@/services/examination.service'
import { academicsService } from '@/services/academics.service'
import { toast } from '@/hooks/use-toast'
import { initials } from '@/utils/format'

export default function ExamResultsPage() {
  const [examGroups, setExamGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [examGroupId, setExamGroupId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [picker, setPicker] = useState({ class_name: '', section: '' })

  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Load pickers' option lists once.
  useEffect(() => {
    let active = true
    Promise.all([examinationService.getExamGroups({ limit: 500 }), academicsService.subjects({ limit: 500 })])
      .then(([g, s]) => {
        if (!active) return
        setExamGroups(Array.isArray(g) ? g : g?.data || [])
        setSubjects(Array.isArray(s) ? s : s?.data || [])
      })
      .catch(() => { if (active) { setExamGroups([]); setSubjects([]) } })
    return () => { active = false }
  }, [])

  const ready = examGroupId && subjectId && picker.class_name

  const load = useCallback(async () => {
    if (!ready) { setRoster([]); return }
    setLoading(true)
    try {
      const data = await examinationService.getMarksRoster({
        exam_group_id: examGroupId, subject_id: subjectId,
        class_name: picker.class_name, section: picker.section || undefined,
      })
      setRoster((data?.students || []).map((s) => ({ ...s })))
    } catch (e) {
      toast({ title: 'Could not load roster', description: e?.message || 'Please try again.', variant: 'destructive' })
      setRoster([])
    } finally {
      setLoading(false)
    }
  }, [ready, examGroupId, subjectId, picker.class_name, picker.section])

  useEffect(() => { load() }, [load])

  const setField = (id, field, value) =>
    setRoster((p) => p.map((s) => (s.student_id === id ? { ...s, [field]: value } : s)))

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roster
    return roster.filter((s) => s.name.toLowerCase().includes(q) || String(s.roll_number).toLowerCase().includes(q))
  }, [roster, search])

  const enteredCount = useMemo(
    () => roster.filter((s) => s.marks_obtained !== '' && s.marks_obtained != null).length,
    [roster],
  )

  const save = async () => {
    if (!roster.length) return
    setSaving(true)
    try {
      await examinationService.saveMarksRoster({
        exam_group_id: examGroupId, subject_id: subjectId,
        marks: roster.map((s) => ({ student_id: s.student_id, marks_obtained: s.marks_obtained, total_marks: s.total_marks })),
      })
      toast({ title: 'Marks saved', description: `${enteredCount} of ${roster.length} students.` })
    } catch (e) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Examinations' }, { label: 'Marks Entry' }]} />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Marks Entry</h1>
        <p className="text-sm text-muted-foreground">Pick an exam, subject and class — enter marks for the whole class in one go.</p>
      </div>

      <Card><CardContent className="flex flex-wrap items-end gap-4 p-4">
        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Exam</label>
          <Select value={examGroupId} onValueChange={setExamGroupId}>
            <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
            <SelectContent>
              {examGroups.length === 0
                ? <SelectItem value="__none" disabled>No exams found</SelectItem>
                : examGroups.map((g) => <SelectItem key={g._id} value={g._id}>{g.exam_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Subject</label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {subjects.length === 0
                ? <SelectItem value="__none" disabled>No subjects found</SelectItem>
                : subjects.map((s) => <SelectItem key={s._id} value={s._id}>{s.subject_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <ClassSectionPicker value={picker} onChange={setPicker} />
      </CardContent></Card>

      {!ready && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Choose exam, subject and class</p>
          <p className="text-xs text-muted-foreground">Pick all three above to load the class and enter marks.</p>
        </CardContent></Card>
      )}

      {loading && <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading students…</div>}

      {!loading && ready && roster.length === 0 && (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No students found in {picker.class_name}{picker.section ? ` · ${picker.section}` : ''}.</CardContent></Card>
      )}

      {!loading && roster.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm"><span className="font-semibold">{roster.length} students</span> <span className="text-muted-foreground">· {enteredCount} with marks entered</span></div>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search student…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <Card><CardContent className="divide-y p-0">
            <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className="flex-1">Student</span>
              <span className="w-24 text-center">Marks</span>
              <span className="w-24 text-center">Out of</span>
            </div>
            {visible.map((s) => (
              <div key={s.student_id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(s.name)}</div>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Roll {s.roll_number || '—'}</p>
                  </div>
                </div>
                <Input type="number" min="0" className="w-24 text-center" value={s.marks_obtained ?? ''} onChange={(e) => setField(s.student_id, 'marks_obtained', e.target.value)} placeholder="—" />
                <Input type="number" min="0" className="w-24 text-center" value={s.total_marks ?? ''} onChange={(e) => setField(s.student_id, 'total_marks', e.target.value)} placeholder="100" />
              </div>
            ))}
          </CardContent></Card>

          <div className="sticky bottom-4 flex justify-end">
            <Button size="lg" onClick={save} disabled={saving} className="shadow-lg">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <><Save className="mr-2 h-4 w-4" /> Save Marks</>}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
