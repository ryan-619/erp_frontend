// ====================================================================
// Module: Certificate
// Page: Staff ID Card
//
// Purpose:
// Manage staff ID card designs.
//
// Data Source:
// certificate.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { IdCard, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'layout', label: 'Layout' },
  { key: 'fields_to_show', label: 'Fields to Show' },
  { key: 'createdAt', label: 'Created At' },
]

const AVAILABLE_FIELDS = [
  { id: 'name', label: 'Name' },
  { id: 'employee_id', label: 'Employee ID' },
  { id: 'designation', label: 'Designation' },
  { id: 'department', label: 'Department' },
  { id: 'photo', label: 'Photo' },
  { id: 'dob', label: 'Date of Birth' },
  { id: 'blood_group', label: 'Blood Group' },
  { id: 'phone', label: 'Phone Number' },
  { id: 'email', label: 'Email' },
  { id: 'address', label: 'Address' },
  { id: 'joining_date', label: 'Joining Date' },
  { id: 'qualification', label: 'Qualification' },
]

export default function StaffIdCardPage() {
  const { toast } = useToast()
  const { data: designs, isLoading, refetch } = useAsyncData(() => certificateService.getStaffIdCards(), [])
  
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
    { 
      accessorKey: 'fields_to_show', 
      header: 'Fields', 
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.fields_to_show?.map(f => AVAILABLE_FIELDS.find(af => af.id === f)?.label || f).join(', ') || '—'}
        </span>
      )
    },
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
        await certificateService.updateStaffIdCard(id, payload)
        toast({ title: 'ID card design updated successfully' })
        setEditRow(null)
      } else {
        await certificateService.createStaffIdCard(payload)
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
      await certificateService.deleteStaffIdCard(id)
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificate' }, { label: 'Staff ID Card' }]} />
      <PageHeader
        title="Staff ID Card"
        description="Manage staff ID card designs."
        icon={IdCard}
        actions={<Button onClick={() => setAddOpen(true)}><IdCard className="mr-2 h-4 w-4" /> Add Design</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Designs" value={stats.total} icon={IdCard} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by layout…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="staff-id-cards" />
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
            <DialogDescription>{editRow ? 'Update ID card design' : 'Add a new staff ID card design'}</DialogDescription>
          </DialogHeader>
          <IdCardForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="ID Card Design Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4">
            {[
              { label: 'Layout', value: viewRow.layout || '—' },
              { label: 'Fields to Show', value: viewRow.fields_to_show?.map(f => AVAILABLE_FIELDS.find(af => af.id === f)?.label || f).join(', ') || '—' },
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
    layout: 'horizontal',
    fields_to_show: ['name', 'employee_id', 'designation', 'photo'],
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        layout: initial.layout || 'horizontal',
        fields_to_show: initial.fields_to_show || ['name', 'employee_id', 'designation', 'photo'],
      })
    }
  }, [initial])

  const handleFieldToggle = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields_to_show: prev.fields_to_show.includes(fieldId)
        ? prev.fields_to_show.filter(f => f !== fieldId)
        : [...prev.fields_to_show, fieldId]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ 
      layout: formData.layout, 
      fields_to_show: formData.fields_to_show
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="layout">Layout *</Label>
        <select 
          id="layout" 
          value={formData.layout} 
          onChange={(e) => setFormData({ ...formData, layout: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          required
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>
      
      <div>
        <Label className="text-xs mb-2 block">Fields to Show *</Label>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_FIELDS.map(field => (
            <label key={field.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.fields_to_show.includes(field.id)}
                onChange={() => handleFieldToggle(field.id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              {field.label}
            </label>
          ))}
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
