// ====================================================================
// Module: Certificate
// Page: Student ID Card
//
// Purpose:
// Manage student ID card designs.
//
// Data Source:
// certificate.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { IdCard, Eye, Pencil, Trash2 } from 'lucide-react'
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
  { key: 'layout', label: 'Layout' },
  { key: 'fields_to_show', label: 'Fields to Show' },
  { key: 'createdAt', label: 'Created At' },
]

export default function StudentIdCardPage() {
  const { toast } = useToast()
  const { data: designs, isLoading, refetch } = useAsyncData(() => certificateService.getStudentIdCards(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = designs || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || (r.layout || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'layout',
      header: 'Design',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IdCard className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.layout || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.fields_to_show?.length || 0} fields</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'fields_to_show', header: 'Fields', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.fields_to_show?.join(', ') || '—'}</span> },
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
        await certificateService.updateStudentIdCard(id, payload)
        toast({ title: 'ID card design updated successfully' })
        setEditRow(null)
      } else {
        await certificateService.createStudentIdCard(payload)
        toast({ title: 'ID card design created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save ID card design:', error)
      toast({ title: 'Failed to save ID card design', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await certificateService.deleteStudentIdCard(id)
      toast({ title: 'ID card design deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete ID card design:', error)
      toast({ title: 'Failed to delete ID card design', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificate' }, { label: 'Student ID Card' }]} />
      <PageHeader
        title="Student ID Card"
        description="Manage student ID card designs."
        icon={IdCard}
        actions={<Button onClick={() => setAddOpen(true)}><IdCard className="mr-2 h-4 w-4" /> Add Design</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Designs" value={stats.total} icon={IdCard} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by layout…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="student-id-cards" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No designs found" description="Add an ID card design to get started." actionLabel="Add Design" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Design' : 'Add Design'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update ID card design' : 'Add a new student ID card design'}</DialogDescription>
          </DialogHeader>
          <IdCardForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="ID Card Design Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4">
            {[
              { label: 'Layout', value: viewRow.layout || '—' },
              { label: 'Fields to Show', value: viewRow.fields_to_show?.join(', ') || '—' },
              { label: 'Template Config', value: viewRow.template_config ? JSON.stringify(viewRow.template_config, null, 2) : '—' },
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
            <DialogTitle>Delete Design</DialogTitle>
            <DialogDescription>Are you sure you want to delete this ID card design? This action cannot be undone.</DialogDescription>
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

function IdCardForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    layout: '', fields_to_show: '', template_config: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        layout: initial.layout || '', fields_to_show: initial.fields_to_show?.join(', ') || '', template_config: initial.template_config ? JSON.stringify(initial.template_config, null, 2) : '{}',
      })
    } else {
      setFormData({
        layout: '', fields_to_show: '', template_config: '{}',
      })
    }
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    try {
      const templateConfig = JSON.parse(formData.template_config)
      const fieldsToShow = formData.fields_to_show.split(',').map(f => f.trim()).filter(f => f)
      onSubmit({ layout: formData.layout, fields_to_show: fieldsToShow, template_config })
    } catch (error) {
      alert('Invalid JSON format for template config')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="layout">Layout *</Label>
        <Input id="layout" value={formData.layout} onChange={(e) => setFormData({ ...formData, layout: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="fields_to_show">Fields to Show (comma separated)</Label>
        <Input id="fields_to_show" value={formData.fields_to_show} onChange={(e) => setFormData({ ...formData, fields_to_show: e.target.value })} placeholder="name, class, roll_no" />
      </div>
      <div>
        <Label htmlFor="template_config">Template Config (JSON)</Label>
        <Textarea id="template_config" value={formData.template_config} onChange={(e) => setFormData({ ...formData, template_config: e.target.value })} placeholder='{"key": "value"}' rows={6} className="font-mono text-sm" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
