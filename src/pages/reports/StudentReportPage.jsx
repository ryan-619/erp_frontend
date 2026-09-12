// ====================================================================
// Module: Reports
// Page: Student Report — filter students and export.
// ====================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Users, Loader as Loader2, Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { ClassSectionPicker } from '@/components/ClassSectionPicker'
import { reportsService } from '@/services/reports.service'
import { toast } from '@/hooks/use-toast'

function downloadCsv(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}

export default function StudentReportPage() {
  const [picker, setPicker] = useState({ class_name: '', section: '' })
  const [gender, setGender] = useState('all')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await reportsService.studentReport({
        class_name: picker.class_name || undefined,
        section: picker.section || undefined,
        gender: gender === 'all' ? undefined : gender,
      })
      setData(d)
    } catch (e) {
      toast({ title: 'Could not load report', description: e?.message || 'Try again.', variant: 'destructive' }); setData(null)
    } finally { setLoading(false) }
  }, [picker.class_name, picker.section, gender])
  useEffect(() => { load() }, [load])

  const rows = useMemo(() => {
    const list = data?.students || []
    const q = search.trim().toLowerCase()
    return q ? list.filter((s) => s.name.toLowerCase().includes(q) || String(s.roll_number).includes(q) || String(s.admission_no).includes(q)) : list
  }, [data, search])

  const exportCsv = () => {
    if (!data) return
    downloadCsv('student-report.csv', [
      ['Admission No', 'Name', 'Roll', 'Class', 'Section', 'Gender', 'Mobile', 'Guardian', 'Guardian Phone', 'Status'],
      ...data.students.map((s) => [s.admission_no, s.name, s.roll_number, s.class_name, s.section, s.gender, s.mobile, s.guardian, s.guardian_phone, s.status]),
    ])
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Reports' }, { label: 'Student Report' }]} />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Student Report</h1>
        <p className="text-sm text-muted-foreground">Filter students and export the list.</p>
      </div>

      <Card><CardContent className="flex flex-wrap items-end gap-4 p-4">
        <ClassSectionPicker value={picker} onChange={setPicker} />
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Gender</label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {loading && <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}

      {!loading && data && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 font-semibold"><Users className="h-4 w-4" /> {data.count} students</span>
            {data.by_gender.map((g) => <span key={g.gender} className="text-muted-foreground">· {g.count} {g.gender}</span>)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name / roll / admission…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" /> Export CSV</Button>
          </div>
          <Card><CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Adm. No</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Class</th>
                <th className="px-3 py-2">Sec</th><th className="px-3 py-2">Gender</th><th className="px-3 py-2">Guardian</th><th className="px-3 py-2">Phone</th>
              </tr></thead>
              <tbody>
                {rows.slice(0, 500).map((s) => (
                  <tr key={s.student_id} className="border-b last:border-0">
                    <td className="px-3 py-2 tabular-nums">{s.admission_no || '—'}</td>
                    <td className="px-3 py-2 font-medium">{s.name} <span className="text-xs text-muted-foreground">· roll {s.roll_number || '—'}</span></td>
                    <td className="px-3 py-2">{s.class_name || '—'}</td>
                    <td className="px-3 py-2">{s.section || '—'}</td>
                    <td className="px-3 py-2 capitalize">{s.gender || '—'}</td>
                    <td className="px-3 py-2">{s.guardian || '—'}</td>
                    <td className="px-3 py-2">{s.guardian_phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 500 && <p className="px-3 py-2 text-xs text-muted-foreground">Showing first 500 of {rows.length} — refine filters or export for the full list.</p>}
          </CardContent></Card>
        </>
      )}
    </div>
  )
}
