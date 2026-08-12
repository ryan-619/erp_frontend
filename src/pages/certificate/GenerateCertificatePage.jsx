// ====================================================================
// Module: Certificate
// Page: Generate Certificate
//
// Purpose:
// Generate certificates for students.
//
// Data Source:
// certificate.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Award, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { certificateService } from '@/services/certificate.service'
import { studentService } from '@/services/student.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'student_name', label: 'Student' },
  { key: 'certificate_name', label: 'Certificate' },
  { key: 'generated_date', label: 'Generated Date' },
  { key: 'issued_by', label: 'Issued By' },
]

export default function GenerateCertificatePage() {
  const { toast } = useToast()
  const { data: generated, isLoading, refetch } = useAsyncData(() => certificateService.getGeneratedCertificates(), [])
  const { data: certificates, isLoading: certsLoading } = useAsyncData(() => certificateService.getStudentCertificates(), [])
  const { data: students, isLoading: studentsLoading } = useAsyncData(() => studentService.list(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = generated || []
  const allCertificates = certificates || []
  const allStudents = students || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const student = allStudents.find(s => s._id === r.student_id)
    const cert = allCertificates.find(c => c._id === r.certificate_id)
    const studentName = !student ? 'Unknown' : typeof student === 'string' ? student : student?.name ? `${student.name.first} ${student.name.last}` : 'Unknown'
    return !q || 
      studentName.toLowerCase().includes(q) ||
      (cert?.certificate_name || '').toLowerCase().includes(q)
  }), [rows, search, allStudents, allCertificates])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'student_id',
      header: 'Student',
      cell: ({ row }) => {
        const student = allStudents.find(s => s._id === row.original.student_id)
        const studentName = !student ? 'Unknown' : typeof student === 'string' ? student : student?.name ? `${student.name.first} ${student.name.last}` : 'Unknown'
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Award className="h-4 w-4" />
            </div>
            <span className="font-medium hover:underline">{studentName}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'certificate_id',
      header: 'Certificate',
      cell: ({ row }) => {
        const cert = allCertificates.find(c => c._id === row.original.certificate_id)
        return <span className="text-sm">{cert?.certificate_name || 'Unknown'}</span>
      },
    },
    { accessorKey: 'generated_date', header: 'Generated', cell: ({ row }) => row.original.generated_date ? formatDate(row.original.generated_date) : '—' },
    { accessorKey: 'issued_by', header: 'Issued By', cell: ({ row }) => row.original.issued_by || '—' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allStudents, allCertificates])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await certificateService.updateGeneratedCertificate(id, payload)
        toast({ title: 'Certificate updated successfully' })
        setEditRow(null)
      } else {
        await certificateService.createGeneratedCertificate(payload)
        toast({ title: 'Certificate generated successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save certificate:', error)
      toast({ title: 'Failed to save certificate', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await certificateService.deleteGeneratedCertificate(id)
      toast({ title: 'Certificate deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete certificate:', error)
      toast({ title: 'Failed to delete certificate', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificate' }, { label: 'Generate Certificate' }]} />
      <PageHeader
        title="Generate Certificate"
        description="Generate certificates for students."
        icon={Award}
        actions={<Button onClick={() => setAddOpen(true)}><Award className="mr-2 h-4 w-4" /> Generate Certificate</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Generated" value={stats.total} icon={Award} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student or certificate…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => {
              const student = allStudents.find(s => s._id === r.student_id)
              const cert = allCertificates.find(c => c._id === r.certificate_id)
              const studentName = !student ? 'Unknown' : typeof student === 'string' ? student : student?.name ? `${student.name.first} ${student.name.last}` : 'Unknown'
              return {
                ...r,
                student_name: studentName,
                certificate_name: cert?.certificate_name || 'Unknown',
              }
            })} 
            columns={EXPORT_COLS} 
            filename="generated-certificates" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No certificates found" description="Generate a certificate to get started." actionLabel="Generate Certificate" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Certificate' : 'Generate Certificate'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update certificate details' : 'Generate a new certificate'}</DialogDescription>
          </DialogHeader>
          <GenerateForm initial={editRow} certificates={allCertificates} students={allStudents} certsLoading={certsLoading} studentsLoading={studentsLoading} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Certificate Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (() => {
          const student = allStudents.find(s => s._id === viewRow.student_id)
          const cert = allCertificates.find(c => c._id === viewRow.certificate_id)
          const studentName = !student ? 'Unknown' : typeof student === 'string' ? student : student?.name ? `${student.name.first} ${student.name.last}` : 'Unknown'
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Student', value: studentName },
                { label: 'Certificate', value: cert?.certificate_name || 'Unknown' },
                { label: 'Generated Date', value: viewRow.generated_date ? formatDate(viewRow.generated_date) : '—' },
                { label: 'Issued By', value: viewRow.issued_by || '—' },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )
        })()}
      </Drawer>

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Certificate</DialogTitle>
            <DialogDescription>Are you sure you want to delete this certificate? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteRow._id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GenerateForm({ initial, certificates, students, certsLoading, studentsLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    student_id: '', certificate_id: '', generated_date: '', issued_by: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        student_id: initial.student_id || '', certificate_id: initial.certificate_id || '', generated_date: initial.generated_date ? initial.generated_date.split('T')[0] : '', issued_by: initial.issued_by || '',
      })
    } else {
      setFormData({
        student_id: students.length > 0 ? students[0]._id : '', certificate_id: certificates.length > 0 ? certificates[0]._id : '', generated_date: new Date().toISOString().split('T')[0], issued_by: '',
      })
    }
  }, [initial, students, certificates])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getStudentName = (student) => {
    if (!student) return 'Unnamed'
    if (typeof student === 'string') return student
    return student?.name ? `${student.name.first} ${student.name.last}` : 'Unnamed'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="student_id">Student *</Label>
        <select id="student_id" value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} disabled={studentsLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>{getStudentName(s)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="certificate_id">Certificate *</Label>
        <select id="certificate_id" value={formData.certificate_id} onChange={(e) => setFormData({ ...formData, certificate_id: e.target.value })} disabled={certsLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select certificate</option>
          {certificates.map((c) => (
            <option key={c._id} value={c._id}>{c.certificate_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="generated_date">Generated Date *</Label>
        <Input id="generated_date" type="date" value={formData.generated_date} onChange={(e) => setFormData({ ...formData, generated_date: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="issued_by">Issued By</Label>
        <Input id="issued_by" value={formData.issued_by} onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
