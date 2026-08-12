// ====================================================================
// Module: Human Resources
// Page: Department
//
// Purpose:
// Manage academic and administrative departments.
//
// Data Source:
// hr.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, Building2, Pencil, Trash2, Eye, Users, CircleCheck as CheckCircle2 } from 'lucide-react'
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
import { hrService } from '@/services/hr.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'department_name', label: 'Department Name' },
  { key: 'createdAt', label: 'Created At' },
]

export default function DepartmentPage() {
  const { toast } = useToast()
  const { data: departments, isLoading, refetch } = useAsyncData(() => hrService.getDepartments(), [])
  const { data: staffList, isLoading: staffLoading } = useAsyncData(() => hrService.getStaff(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = departments || []
  const staff = staffList || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || (r.department_name || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
    totalStaff: staff.length,
  }), [rows, staff])

  const columns = useMemo(() => [
    {
      accessorKey: 'department_name',
      header: 'Department',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <p className="font-medium hover:underline">{row.original.department_name}</p>
        </button>
      ),
    },
    {
      accessorKey: 'staff_count',
      header: 'Staff Count',
      cell: ({ row }) => {
        const count = staff.filter(s => s.department_id === row.original._id).length
        return (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {count}
          </span>
        )
      },
    },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [staff])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await hrService.updateDepartment(id, payload)
        toast({ title: 'Department updated' })
      } else {
        await hrService.createDepartment(payload)
        toast({ title: 'Department created' })
      }
      setAddOpen(false)
      setEditRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to save department:', error)
      toast({ title: 'Failed to save department', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await hrService.deleteDepartment(id)
      toast({ title: 'Department deleted' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete department:', error)
      toast({ title: 'Failed to delete department', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Human Resources' }, { label: 'Department' }]} />
      <PageHeader
        title="Department"
        description="Manage academic and administrative departments."
        icon={Building2}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Department</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <StatCard label="Total Departments" value={stats.total} icon={Building2} accent="primary" />
        <StatCard label="Total Staff" value={stats.totalStaff} icon={Users} accent="chart2" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search departments…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="departments" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No departments found" actionLabel="Add Department" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Department' : 'Add Department'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update department information' : 'Add a new department'}</DialogDescription>
          </DialogHeader>
          <DepartmentForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Department Details"
        description={viewRow?.department_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const deptStaff = staff.filter(s => s.department_id === viewRow._id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Department Name', value: viewRow.department_name },
                { label: 'Staff Count', value: deptStaff.length },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
                { label: 'Updated', value: formatDate(viewRow.updatedAt) },
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

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deleteRow?.department_name}"? This action cannot be undone.</DialogDescription>
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

// ─── DepartmentForm Component ───────────────────────────────────────────────────────
function DepartmentForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    department_name: '',
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        department_name: initial.department_name || '',
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
        <Label htmlFor="department_name">Department Name *</Label>
        <Input
          id="department_name"
          value={formData.department_name}
          onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
          placeholder="e.g., Science, Mathematics, Administration"
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Department</Button>
      </DialogFooter>
    </form>
  )
}
