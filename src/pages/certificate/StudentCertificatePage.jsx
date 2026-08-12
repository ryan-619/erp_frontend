// ====================================================================
// Module: Certificate
// Page: Student Certificate
//
// Purpose:
// Manage student certificate templates.
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
import { Textarea } from '@/components/ui/textarea'
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
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'certificate_name', label: 'Certificate Name' },
  { key: 'template', label: 'Template' },
  { key: 'header', label: 'Header' },
  { key: 'createdAt', label: 'Created At' },
]

export default function StudentCertificatePage() {
  const { toast } = useToast()
  const { data: certificates, isLoading, refetch } = useAsyncData(() => certificateService.getStudentCertificates(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = certificates || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.certificate_name || '').toLowerCase().includes(q) ||
      (r.template || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'certificate_name',
      header: 'Certificate',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Award className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.certificate_name || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.template || 'No template'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'header', header: 'Header', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.header || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await certificateService.updateStudentCertificate(id, payload)
        toast({ title: 'Certificate updated successfully' })
        setEditRow(null)
      } else {
        await certificateService.createStudentCertificate(payload)
        toast({ title: 'Certificate created successfully' })
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
      await certificateService.deleteStudentCertificate(id)
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificate' }, { label: 'Student Certificate' }]} />
      <PageHeader
        title="Student Certificate"
        description="Manage student certificate templates."
        icon={Award}
        actions={<Button onClick={() => setAddOpen(true)}><Award className="mr-2 h-4 w-4" /> Add Certificate</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Certificates" value={stats.total} icon={Award} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or template…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="student-certificates" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No certificates found" description="Add a certificate to get started." actionLabel="Add Certificate" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Certificate' : 'Add Certificate'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update certificate details' : 'Add a new student certificate template'}</DialogDescription>
          </DialogHeader>
          <CertificateForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Certificate Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Certificate Name', value: viewRow.certificate_name || '—' },
              { label: 'Template', value: viewRow.template || '—' },
              { label: 'Header', value: viewRow.header || '—' },
              { label: 'Body Text', value: viewRow.body_text || '—' },
              { label: 'Created', value: formatDate(viewRow.createdAt) },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium whitespace-pre-wrap">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
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

function CertificateForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    certificate_name: '', template: '', header: '', body_text: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        certificate_name: initial.certificate_name || '', template: initial.template || '', header: initial.header || '', body_text: initial.body_text || '',
      })
    } else {
      setFormData({
        certificate_name: '', template: '', header: '', body_text: '',
      })
    }
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="certificate_name">Certificate Name *</Label>
        <Input id="certificate_name" value={formData.certificate_name} onChange={(e) => setFormData({ ...formData, certificate_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="template">Template *</Label>
        <Input id="template" value={formData.template} onChange={(e) => setFormData({ ...formData, template: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="header">Header</Label>
        <Input id="header" value={formData.header} onChange={(e) => setFormData({ ...formData, header: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="body_text">Body Text</Label>
        <Textarea id="body_text" value={formData.body_text} onChange={(e) => setFormData({ ...formData, body_text: e.target.value })} placeholder="Certificate body text..." rows={4} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
