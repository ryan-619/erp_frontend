// ====================================================================
// Module: Examinations
// Page: Design Admit Card
//
// Purpose: Visual builder for admit card template with live preview.
// Payload Schema: { header, school_logo }
// ====================================================================

import { useState, useRef } from 'react'
import { IdCard, RotateCcw, Printer, Download, Save, Upload, Trash2, User } from 'lucide-react'
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
  school_logo: '',
}

const ADMIT_CARD_DETAILS = [
  { label: 'Admission No', val: '10234' },
  { label: 'Roll No', val: '18' },
  { label: 'Student Name', val: 'Rahul Sharma' },
  { label: 'Father Name', val: 'Rajesh Sharma' },
  { label: 'Class', val: 'X-A' },
  { label: 'Exam Group', val: 'Annual Exam 2026' },
  { label: 'Reporting Time', val: '08:30 AM' },
  { label: 'Exam Time', val: '09:00 AM' },
  { label: 'Exam Hall / Room', val: 'Hall A (Room 102)' },
]

export default function DesignAdmitCardPage() {
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

    setIsSaving(true)
    try {
      const payload = {
        header: form.header.trim(),
        school_logo: form.school_logo.trim(),
      }
      if (examinationService.updateAdmitCardTemplate) {
        await examinationService.updateAdmitCardTemplate(payload)
      } else if (examinationService.createAdmitCardDesign) {
        await examinationService.createAdmitCardDesign(payload)
      }
      toast({ title: '✓ Admit Card Template Saved Successfully' })
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error?.response?.data?.message || error?.message || 'Failed to save admit card template.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = () => window.print()

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-admit-card, #printable-admit-card * { visibility: visible; }
          #printable-admit-card {
            position: absolute; left: 0; top: 0; width: 100% !important;
            margin: 0 !important; padding: 20px !important; box-shadow: none !important;
          }
        }
      `}</style>

      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Examinations', to: '/examinations/exam-groups' },
          { label: 'Design Admit Card' },
        ]}
      />

      <PageHeader
        title="Design Admit Card"
        description="Visual builder for the admit card template with live preview."
        icon={IdCard}
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
            {/* Hardcoded light mode white paper for authentic print view */}
            <div
              id="printable-admit-card"
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
                <p className="text-xs font-semibold text-gray-700 mt-0.5">ANNUAL EXAMINATION</p>
                <p className="text-xs font-black text-gray-900 tracking-wider uppercase underline decoration-gray-400 decoration-1 underline-offset-4 mt-1">
                  ADMIT CARD
                </p>
              </div>

              {/* Admit Card Content & Candidate Photo */}
              <div className="grid grid-cols-12 gap-4 items-start">
                {/* Details Grid */}
                <div className="col-span-8 border border-gray-300 bg-gray-50 rounded p-3 text-xs space-y-1.5">
                  {ADMIT_CARD_DETAILS.map((info) => (
                    <div key={info.label} className="flex justify-between border-b border-gray-200 pb-1 last:border-b-0 last:pb-0">
                      <span className="font-semibold text-gray-600">{info.label} :</span>
                      <span className="font-bold text-black text-right">{info.val}</span>
                    </div>
                  ))}
                </div>

                {/* Candidate Photo Box */}
                <div className="col-span-4 flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-300 bg-gray-50 rounded p-2 text-center">
                  <User className="h-12 w-12 text-gray-400 mb-1" />
                  <span className="text-[10px] font-semibold text-gray-500 uppercase">Candidate Photo</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">Affix Stamp Size Photo</span>
                </div>
              </div>

              {/* Instructions Disclaimer */}
              <div className="border-t border-b border-gray-200 py-2 text-[10px] text-gray-600 space-y-0.5">
                <p className="font-bold text-gray-800">Important Instructions for Candidate:</p>
                <p>1. Please bring this Admit Card to the Examination Hall on all exam days.</p>
                <p>2. Report to the examination hall at least 30 minutes before commencement of the exam.</p>
              </div>

              {/* Principal Signature */}
              <div className="mt-8 flex justify-end text-xs pt-4 text-black">
                <div className="text-center">
                  <div className="mb-1 w-36 border-b border-gray-400" />
                  <span className="font-bold text-black">Principal Signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}