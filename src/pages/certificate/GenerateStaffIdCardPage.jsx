// ====================================================================
// Module: Certificate
// Page: Generate Staff ID Card
//
// Purpose:
// Generate ID cards for staff.
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
import { hrService } from '@/services/hr.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'staff_name', label: 'Staff' },
  { key: 'design_layout', label: 'Design' },
  { key: 'generated_date', label: 'Generated Date' },
]

export default function GenerateStaffIdCardPage() {
  const { toast } = useToast()
  const { data: generated, isLoading, refetch } = useAsyncData(() => certificateService.getGeneratedStaffIdCards(), [])
  const { data: designs, isLoading: designsLoading } = useAsyncData(() => certificateService.getStaffIdCards(), [])
  const { data: staff, isLoading: staffLoading } = useAsyncData(() => hrService.getStaff(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = generated || []
  const allDesigns = designs || []
  const allStaff = staff || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const staffMember = allStaff.find(s => s._id === r.staff_id)
    const design = allDesigns.find(d => d._id === r.design_id)
    const staffName = !staffMember ? 'Unknown' : typeof staffMember === 'string' ? staffMember : staffMember?.full_name || staffMember?.name || staffMember?.first_name || 'Unknown'
    return !q || 
      staffName.toLowerCase().includes(q) ||
      (design?.layout || '').toLowerCase().includes(q)
  }), [rows, search, allStaff, allDesigns])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'staff_id',
      header: 'Staff',
      cell: ({ row }) => {
        const staffMember = allStaff.find(s => s._id === row.original.staff_id)
        const staffName = !staffMember ? 'Unknown' : typeof staffMember === 'string' ? staffMember : staffMember?.full_name || staffMember?.name || staffMember?.first_name || 'Unknown'
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IdCard className="h-4 w-4" />
            </div>
            <span className="font-medium hover:underline">{staffName}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'design_id',
      header: 'Design',
      cell: ({ row }) => {
        const design = allDesigns.find(d => d._id === row.original.design_id)
        return <span className="text-sm">{design?.layout || 'Unknown'}</span>
      },
    },
    { accessorKey: 'generated_date', header: 'Generated', cell: ({ row }) => row.original.generated_date ? formatDate(row.original.generated_date) : '—' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allStaff, allDesigns])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await certificateService.updateGeneratedStaffIdCard(id, payload)
        toast({ title: 'ID card updated successfully' })
        setEditRow(null)
      } else {
        await certificateService.createGeneratedStaffIdCard(payload)
        toast({ title: 'ID card generated successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save ID card:', error)
      toast({ title: 'Failed to save ID card', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await certificateService.deleteGeneratedStaffIdCard(id)
      toast({ title: 'ID card deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete ID card:', error)
      toast({ title: 'Failed to delete ID card', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Certificate' }, { label: 'Generate Staff ID Card' }]} />
      <PageHeader
        title="Generate Staff ID Card"
        description="Generate ID cards for staff."
        icon={IdCard}
        actions={<Button onClick={() => setAddOpen(true)}><IdCard className="mr-2 h-4 w-4" /> Generate ID Card</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Generated" value={stats.total} icon={IdCard} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by staff or design…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => {
              const staffMember = allStaff.find(s => s._id === r.staff_id)
              const design = allDesigns.find(d => d._id === r.design_id)
              const staffName = !staffMember ? 'Unknown' : typeof staffMember === 'string' ? staffMember : staffMember?.full_name || staffMember?.name || staffMember?.first_name || 'Unknown'
              return {
                ...r,
                staff_name: staffName,
                design_layout: design?.layout || 'Unknown',
              }
            })} 
            columns={EXPORT_COLS} 
            filename="generated-staff-id-cards" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No ID cards found" description="Generate an ID card to get started." actionLabel="Generate ID Card" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit ID Card' : 'Generate ID Card'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update ID card details' : 'Generate a new staff ID card'}</DialogDescription>
          </DialogHeader>
          <GenerateForm initial={editRow} designs={allDesigns} staff={allStaff} designsLoading={designsLoading} staffLoading={staffLoading} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="ID Card Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (() => {
          const staffMember = allStaff.find(s => s._id === viewRow.staff_id)
          const design = allDesigns.find(d => d._id === viewRow.design_id)
          const staffName = !staffMember ? 'Unknown' : typeof staffMember === 'string' ? staffMember : staffMember?.full_name || staffMember?.name || staffMember?.first_name || 'Unknown'
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Staff', value: staffName },
                { label: 'Design', value: design?.layout || 'Unknown' },
                { label: 'Generated Date', value: viewRow.generated_date ? formatDate(viewRow.generated_date) : '—' },
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
            <DialogTitle>Delete ID Card</DialogTitle>
            <DialogDescription>Are you sure you want to delete this ID card? This action cannot be undone.</DialogDescription>
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

function GenerateForm({ initial, designs, staff, designsLoading, staffLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    staff_id: '', design_id: '', generated_date: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        staff_id: initial.staff_id || '', design_id: initial.design_id || '', generated_date: initial.generated_date ? initial.generated_date.split('T')[0] : '',
      })
    } else {
      setFormData({
        staff_id: staff.length > 0 ? staff[0]._id : '', design_id: designs.length > 0 ? designs[0]._id : '', generated_date: new Date().toISOString().split('T')[0],
      })
    }
  }, [initial, staff, designs])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getStaffName = (staffMember) => {
    if (!staffMember) return 'Unnamed'
    if (typeof staffMember === 'string') return staffMember
    return staffMember?.full_name || staffMember?.name || staffMember?.first_name || 'Unnamed'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="staff_id">Staff *</Label>
        <select id="staff_id" value={formData.staff_id} onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })} disabled={staffLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select staff</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>{getStaffName(s)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="design_id">Design *</Label>
        <select id="design_id" value={formData.design_id} onChange={(e) => setFormData({ ...formData, design_id: e.target.value })} disabled={designsLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select design</option>
          {designs.map((d) => (
            <option key={d._id} value={d._id}>{d.layout || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="generated_date">Generated Date *</Label>
        <Input id="generated_date" type="date" value={formData.generated_date} onChange={(e) => setFormData({ ...formData, generated_date: e.target.value })} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
