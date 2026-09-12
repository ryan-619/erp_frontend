// ====================================================================
// Module: Students
// Page: Bulk Import (CSV)
//
// Pick the target class/section → upload the standard student CSV → import.
// The CSV has no class column, so every row goes into the chosen class.
//
// Data Source: student.service.js → POST /api/student/import
// ====================================================================

import { useRef, useState } from 'react'
import { Upload, Download, FileSpreadsheet, Loader as Loader2, CheckCircle2, XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { ClassSectionPicker } from '@/components/ClassSectionPicker'
import { studentService } from '@/services/student.service'
import { toast } from '@/hooks/use-toast'

// The columns the importer understands (matches the sample file).
const TEMPLATE_HEADERS = [
  'admission_no', 'roll_no', 'first_name', 'middlename', 'last_name', 'gender',
  'date_of_birth', 'category', 'religion', 'caste', 'mobile_no', 'email',
  'admission_date', 'blood_group', 'student_house', 'height', 'weight',
  'measurement_date', 'father_name', 'father_phone', 'father_occupation',
  'mother_name', 'mother_phone', 'mother_occupation', 'guardian_is',
  'guardian_name', 'guardian_relation', 'guardian_email', 'guardian_phone',
  'guardian_occupation', 'guardian_address', 'current_address', 'permanent_address',
  'bank_account_no', 'bank_name', 'ifsc_code', 'national_identification_no',
  'local_identification_no', 'rte', 'previous_school', 'note',
]

export default function StudentImportPage() {
  const [picker, setPicker] = useState({ class_name: '', section: '' })
  const [file, setFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  const downloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(',') + '\n'
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const pickFile = (f) => {
    if (!f) return
    if (!/\.csv$/i.test(f.name)) {
      toast({ title: 'CSV required', description: 'Please choose a .csv file (export/save your Excel sheet as CSV).', variant: 'destructive' })
      return
    }
    setFile(f)
    setResult(null)
  }

  const runImport = async () => {
    if (!picker.class_name) { toast({ title: 'Pick a class', description: 'Choose the class to import students into.', variant: 'destructive' }); return }
    if (!file) { toast({ title: 'Choose a file', description: 'Select a CSV file to import.', variant: 'destructive' }); return }
    setImporting(true)
    setResult(null)
    try {
      const data = await studentService.importCsv(file, picker)
      setResult(data)
      if (data.created > 0) toast({ title: 'Import complete', description: `${data.created} of ${data.total} students imported.` })
      else toast({ title: 'Nothing imported', description: 'No rows were imported — see the details below.', variant: 'destructive' })
    } catch (e) {
      toast({ title: 'Import failed', description: e?.message || 'Please check the file and try again.', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students' }, { label: 'Bulk Import' }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">Bulk Import Students</h1>
          <p className="text-sm text-muted-foreground">Upload a CSV to add a whole class at once. Every row goes into the class you pick.</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="mr-1.5 h-4 w-4" /> Download template</Button>
      </div>

      {/* Step 1 — target class */}
      <Card><CardContent className="space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1 · Import into</p>
        <ClassSectionPicker value={picker} onChange={setPicker} />
      </CardContent></Card>

      {/* Step 2 — file */}
      <Card><CardContent className="space-y-3 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">2 · CSV file</p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]) }}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
          {file ? (
            <div className="flex items-center gap-2 text-sm font-medium">
              {file.name}
              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null) }} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium">Drop your CSV here, or click to browse</p>
              <p className="text-xs text-muted-foreground">Standard student format · max 5 MB · 1000 rows</p>
            </>
          )}
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>
      </CardContent></Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={runImport} disabled={importing || !file || !picker.class_name}>
          {importing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…</> : <><Upload className="mr-2 h-4 w-4" /> Import Students</>}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <Card><CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-5 w-5 text-success" /> <b>{result.created}</b> imported</div>
            {result.failed > 0 && <div className="flex items-center gap-2 text-sm"><XCircle className="h-5 w-5 text-destructive" /> <b>{result.failed}</b> failed</div>}
            <div className="text-sm text-muted-foreground">of {result.total} rows</div>
          </div>

          {result.errors?.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/40 text-left">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Admission&nbsp;No</th>
                  <th className="px-3 py-2 font-medium">Problem</th>
                </tr></thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 tabular-nums">{e.row}</td>
                      <td className="px-3 py-2">{e.admission_no || '—'}</td>
                      <td className="px-3 py-2 text-destructive">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.created > 0 && (
            <Button variant="outline" size="sm" onClick={() => (window.location.href = `/students?class_name=${encodeURIComponent(picker.class_name)}`)}>
              View imported students
            </Button>
          )}
        </CardContent></Card>
      )}
    </div>
  )
}
