// ====================================================================
// Module: Examinations
// Page: Design Marksheet
//
// Payload Schema: { header, footer, school_logo }
// ====================================================================

import { useState, useRef, useMemo } from 'react'
import { FileBadge, RotateCcw, Printer, Download, Save, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { FormSection } from '@/components/FormSection'
import { examinationService } from '@/services/examination.service'
import { useToast } from '@/hooks/use-toast'

const INITIAL_FORM = {
  header: 'ABC PUBLIC SCHOOL',
  footer: 'Principal Signature',
  school_logo: '',
}

const PREVIEW_SUBJECTS = [
  { subject: 'English', max: 100, obtained: 91, grade: 'A+', remarks: 'Excellent' },
  { subject: 'Mathematics', max: 100, obtained: 95, grade: 'A+', remarks: 'Outstanding' },
  { subject: 'Science', max: 100, obtained: 88, grade: 'A', remarks: 'Very Good' },
  { subject: 'Social Science', max: 100, obtained: 90, grade: 'A+', remarks: 'Excellent' },
  { subject: 'Hindi', max: 100, obtained: 85, grade: 'B+', remarks: 'Good' },
]

export default function DesignMarksheetPage() {
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [isSaving, setIsSaving] = useState(false)

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please select an image file.', variant: 'destructive' })
      return
    }
    const reader = new FileReader()
    reader.onload = (evt) => {
      setForm((f) => ({ ...f, school_logo: evt.target?.result || '' }))
      toast({ title: 'Logo Uploaded' })
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.header.trim()) {
      toast({ title: 'Validation Error', description: 'School Header is required.', variant: 'destructive' })
      return
    }
    if (!form.footer.trim()) {
      toast({ title: 'Validation Error', description: 'Footer signature text is required.', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        header: form.header.trim(),
        footer: form.footer.trim(),
        school_logo: form.school_logo.trim(),
      }
      await examinationService.createMarksheetDesign(payload)
      toast({ title: '✓ Template Saved Successfully' })
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error?.response?.data?.message || error?.message || 'Failed to save template.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => window.print()

  const studentInfo = useMemo(() => [
    { label: 'Student Name', val: 'Rahul Sharma' },
    { label: 'Admission No', val: '10234' },
    { label: 'Roll No', val: '18' },
    { label: 'Class', val: 'X-A' },
    { label: 'Session', val: '2026-27' },
  ], [])

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-marksheet, #printable-marksheet * { visibility: visible; }
          #printable-marksheet {
            position: absolute; left: 0; top: 0; width: 100% !important;
            margin: 0 !important; padding: 20px !important; box-shadow: none !important;
          }
        }
      `}</style>

      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Examinations', to: '/examinations/exam-groups' },
          { label: 'Design Marksheet' },
        ]}
      />

      <PageHeader
        title="Design Marksheet"
        description="Create and customize printable marksheet templates with live preview."
        icon={FileBadge}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setForm(INITIAL_FORM)}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Download className="mr-1.5 h-4 w-4" /> Download PDF
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="mr-1.5 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT SIDE: Template Settings */}
        <div className="lg:col-span-5 space-y-4 rounded-xl border bg-card p-5 shadow-sm h-fit">
          <h3 className="text-sm font-semibold border-b pb-2">Template Settings</h3>
          <FormSection columns={1}>
            <div className="space-y-1.5">
              <Label className="text-xs">
                School Header <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.header}
                onChange={(e) => setForm((f) => ({ ...f, header: e.target.value }))}
                placeholder="e.g. ABC PUBLIC SCHOOL"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Footer <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.footer}
                onChange={(e) => setForm((f) => ({ ...f, footer: e.target.value }))}
                placeholder="e.g. Principal Signature"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">School Logo</Label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              {form.school_logo ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-2.5">
                  <div className="flex items-center gap-3">
                    <img src={form.school_logo} alt="Logo Preview" className="h-9 w-9 object-contain rounded border bg-white p-0.5" />
                    <span className="text-xs font-medium text-emerald-600">✓ logo.png uploaded</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => setForm((f) => ({ ...f, school_logo: '' }))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" /> Upload Logo
                </Button>
              )}
            </div>
          </FormSection>
        </div>

        {/* RIGHT SIDE: Live Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <span>Live Preview</span>
          </div>

          <div className="overflow-y-auto max-h-[85vh] p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl border flex justify-center">
            {/* Always rendered in white paper mode regardless of theme */}
            <div
              id="printable-marksheet"
              className="w-full max-w-[210mm] bg-white text-black border border-gray-300 shadow-xl rounded-sm p-6 space-y-5"
            >
              {/* Header Section */}
              <div className="text-center border-b border-gray-300 pb-3">
                {form.school_logo ? (
                  <img src={form.school_logo} alt="School Logo" className="mx-auto mb-2 h-14 w-14 object-contain" />
                ) : (
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 font-bold text-xs border">
                    LOGO
                  </div>
                )}
                <h1 className="text-lg font-black tracking-wide text-black uppercase">
                  {form.header || 'SCHOOL NAME'}
                </h1>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">Annual Examination 2026</p>
                <p className="text-[10px] text-gray-500">Affiliated to CBSE, New Delhi</p>
              </div>

              {/* Student Information */}
              <div className="border border-gray-300 bg-gray-50 rounded p-3 text-xs grid grid-cols-2 gap-y-1.5 gap-x-4">
                {studentInfo.map((info) => (
                  <div key={info.label} className={info.label === 'Session' ? 'col-span-2' : ''}>
                    <span className="font-semibold text-gray-600">{info.label} : </span>
                    <span className="font-bold text-black">{info.val}</span>
                  </div>
                ))}
              </div>

              {/* Subject Table */}
              <table className="w-full border-collapse text-xs border border-gray-300 text-black">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-gray-300 text-gray-800">
                    <th className="border-r border-gray-300 px-2.5 py-1.5 text-left">Subject</th>
                    <th className="border-r border-gray-300 px-2.5 py-1.5 text-center">Max Marks</th>
                    <th className="border-r border-gray-300 px-2.5 py-1.5 text-center">Obtained</th>
                    <th className="border-r border-gray-300 px-2.5 py-1.5 text-center">Grade</th>
                    <th className="px-2.5 py-1.5 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW_SUBJECTS.map((item) => (
                    <tr key={item.subject} className="border-b border-gray-200">
                      <td className="border-r border-gray-300 px-2.5 py-1.5 font-medium">{item.subject}</td>
                      <td className="border-r border-gray-300 px-2.5 py-1.5 text-center">{item.max}</td>
                      <td className="border-r border-gray-300 px-2.5 py-1.5 text-center font-bold">{item.obtained}</td>
                      <td className="border-r border-gray-300 px-2.5 py-1.5 text-center font-semibold">{item.grade}</td>
                      <td className="px-2.5 py-1.5 text-gray-600">{item.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Results Summary */}
              <div className="border border-gray-300 bg-gray-50 rounded p-2.5 text-xs flex justify-between items-center font-semibold text-black">
                <span>Total Marks : 449 / 500</span>
                <span>Percentage : 89.8%</span>
                <span>Overall Grade : A+</span>
                <span className="text-emerald-700 font-bold">Result : PASS</span>
              </div>

              {/* Signatures */}
              <div className="mt-12 flex justify-between text-xs pt-6 text-black">
                <div className="text-center">
                  <div className="mb-1 w-32 border-b border-gray-400" />
                  <span className="font-medium text-gray-700">Class Teacher</span>
                </div>
                <div className="text-center">
                  <div className="mb-1 w-32 border-b border-gray-400" />
                  <span className="font-bold text-black">{form.footer || 'Principal Signature'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}