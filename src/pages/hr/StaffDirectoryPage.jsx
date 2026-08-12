// ====================================================================
// Module: Human Resources
// Page: Staff Directory
//
// Purpose:
// Manage all teaching and non-teaching staff across departments.
//
// Data Source:
// hr.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import {
  Plus, Users, UserCheck, UserX, Briefcase, Eye, Pencil, Trash2,
  Phone, Mail, Building2, Star, Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { useStaff } from '@/hooks/useHR'
import { formatDate, initials } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// These options power dropdowns in the Add/Edit drawer.
// Fetched from the departments/designations endpoints via the service layer.
import { useAsyncData } from '@/hooks/useAsyncData'
import { hrService } from '@/services/hr.service'

const EXPORT_COLS = [
  { key: 'employee_id', label: 'Employee ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'department_id', label: 'Department' },
  { key: 'designation_id', label: 'Designation' },
  { key: 'joining_date', label: 'Joining Date' },
  { key: 'status', label: 'Status' },
]

const ROLE_OPTIONS = ['Admin', 'Teacher', 'Staff', 'Manager']

export default function StaffDirectoryPage() {
  const { toast } = useToast()
  const {
    rows: filtered, stats, deptOptions, isLoading,
    search, setSearch, deptFilter, setDeptFilter, statusFilter, setStatusFilter,
    saveStaff, deleteStaff: removeStaff,
  } = useStaff()

  const { data: deptData } = useAsyncData(() => hrService.getDepartments(), [])
  const { data: desigData } = useAsyncData(() => hrService.getDesignations(), [])
  const departments = deptData || []
  const designations = desigData || []

  const departmentIdToName = useMemo(() => 
    Object.fromEntries(departments.map(d => [d._id, d.department_name])),
    [departments]
  )
  
  const designationIdToTitle = useMemo(() => 
    Object.fromEntries(designations.map(d => [d._id, d.designation_title])),
    [designations]
  )
  
  const deptFilterOptions = useMemo(() => 
    ['all', ...departments.map(d => d._id)],
    [departments]
  )

  const [addOpen, setAddOpen] = useState(false)
  const [editStaff, setEditStaff] = useState(null)
  const [viewStaff, setViewStaff] = useState(null)
  const [deleteStaff, setDeleteStaff] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await removeStaff(deleteStaff._id, deleteStaff.name)
      setDeleteStaff(null)
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Staff Member',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewStaff(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initials(row.original.name)}
          </div>
          <div>
            <p className="font-medium hover:underline">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </button>
      ),
    },
    { accessorKey: 'employee_id', header: 'Employee ID' },
    { 
      accessorKey: 'department_id', 
      header: 'Department',
      cell: ({ row }) => departmentIdToName[row.original.department_id] || row.original.department_id || 'N/A'
    },
    { 
      accessorKey: 'designation_id', 
      header: 'Designation',
      cell: ({ row }) => designationIdToTitle[row.original.designation_id] || row.original.designation_id || 'N/A'
    },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'joining_date', header: 'Joined', cell: ({ row }) => formatDate(row.original.joining_date) },
  ], [departmentIdToName, designationIdToTitle])

  const rowActions = (s) => [
    { label: 'View Details', icon: Eye, onClick: () => setViewStaff(s) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditStaff(s) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteStaff(s) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Human Resources' }, { label: 'Staff Directory' }]} />
      <PageHeader
        title="Staff Directory"
        description="Manage all teaching and non-teaching staff across departments."
        icon={Users}
        actions={
          <>
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Staff</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Staff" value={stats.total} icon={Users} accent="primary" />
        <StatCard label="Active" value={stats.active} icon={UserCheck} accent="success" />
        <StatCard label="Inactive" value={stats.inactive} icon={UserX} accent="warning" />
        <StatCard label="Departments" value={stats.departments} icon={Building2} accent="chart2" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or employee ID…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="staff-directory" />
          <SelectFilter value={deptFilter} onChange={setDeptFilter} options={deptFilterOptions} optionLabels={departmentIdToName} placeholder="All departments" />
          <SelectFilter value={statusFilter} onChange={setStatusFilter} options={['active', 'inactive']} placeholder="All statuses" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={8} cols={7} />
      ) : filtered.length === 0 ? (
        <NoData title="No staff found" actionLabel="Add Staff" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableExport
          exportFilename="staff-directory"
          rowActions={(s) => <ActionDropdown actions={rowActions(s)} />}
        />
      )}

      {/* Add Staff Drawer */}
      <StaffDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Staff Member"
        departments={departments}
        designations={designations}
        onSubmit={async (p) => {
          await saveStaff(p)
          setAddOpen(false)
        }}
      />

      {/* Edit Staff Drawer */}
      <StaffDrawer
        open={!!editStaff}
        onOpenChange={(o) => !o && setEditStaff(null)}
        title="Edit Staff Member"
        initial={editStaff}
        departments={departments}
        designations={designations}
        onSubmit={async (p) => {
          await saveStaff(p, editStaff._id)
          setEditStaff(null)
        }}
      />

      {/* View Details Drawer */}
      <Drawer
        open={!!viewStaff}
        onOpenChange={(o) => !o && setViewStaff(null)}
        title="Staff Details"
        description={viewStaff?.employee_id}
        width="sm:max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setViewStaff(null)}>Close</Button>
            <Button onClick={() => { setEditStaff(viewStaff); setViewStaff(null) }}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </>
        }
      >
        {viewStaff && <StaffDetails staff={viewStaff} departmentIdToName={departmentIdToName} designationIdToTitle={designationIdToTitle} />}
      </Drawer>

      <DeleteDialog
        open={!!deleteStaff}
        onOpenChange={(o) => !o && setDeleteStaff(null)}
        entityName={deleteStaff?.name}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

// ─── Small reusable select dropdown used just in this page ────────────────────
function SelectFilter({ value, onChange, options, optionLabels, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
      <option value="all">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{optionLabels?.[o] || o}</option>)}
    </select>
  )
}

// ─── Staff details view inside the drawer ────────────────────────────────────
function StaffDetails({ staff, departmentIdToName, designationIdToTitle }) {
  const fields = [
    { label: 'Full Name', value: staff.name },
    { label: 'Employee ID', value: staff.employee_id },
    { label: 'Email', value: staff.email },
    { label: 'Phone', value: staff.phone },
    { label: 'Department', value: departmentIdToName[staff.department_id] || staff.department_id || 'N/A' },
    { label: 'Designation', value: designationIdToTitle[staff.designation_id] || staff.designation_id || 'N/A' },
    { label: 'Joining Date', value: formatDate(staff.joining_date) },
    { label: 'Salary', value: staff.salary?.toLocaleString() },
    { label: 'Role', value: staff.role },
    { label: 'Status', value: <StatusBadge status={staff.status} /> },
  ]
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {initials(staff.name)}
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold">{staff.name}</p>
          <p className="text-sm text-muted-foreground">{staff.email}</p>
        </div>
        <StatusBadge status={staff.status} />
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label} className="space-y-0.5">
            <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
            <dd className="text-sm font-medium">{f.value || '—'}</dd>
          </div>
        ))}
      </dl>
      {staff.staff_photo && (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">Staff Photo</p>
          <img src={staff.staff_photo} alt="Staff" className="h-32 w-32 rounded-lg object-cover" />
        </div>
      )}
      {staff.documents && staff.documents.length > 0 && (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">Documents</p>
          <div className="flex flex-wrap gap-2">
            {staff.documents.map((doc, idx) => (
              <Badge key={idx} variant="secondary">{doc}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add / Edit staff drawer form ────────────────────────────────────────────
function StaffDrawer({ open, onOpenChange, title, initial, onSubmit, departments, designations }) {
  const { toast } = useToast()

  const [form, setForm] = useState({
    employee_id: '',
    name: '',
    email: '',
    phone: '',
    department_id: '',
    designation_id: '',
    joining_date: '',
    salary: '',
    role: 'Staff',
    status: 'active',
    staff_photo: null,
    documents: [],
  })

  // Reset form when initial changes or drawer opens
  useEffect(() => {
    if (initial) {
      setForm({
        employee_id: initial.employee_id || '',
        name: initial.name || '',
        email: initial.email || '',
        phone: initial.phone || '',
        department_id: initial.department_id || '',
        designation_id: initial.designation_id || '',
        joining_date: initial.joining_date || '',
        salary: initial.salary ?? '',
        role: initial.role || 'Staff',
        status: initial.status || 'active',
        staff_photo: null,
        documents: [],
      })
    } else {
      setForm({
        employee_id: '',
        name: '',
        email: '',
        phone: '',
        department_id: '',
        designation_id: '',
        joining_date: '',
        salary: '',
        role: 'Staff',
        status: 'active',
        staff_photo: null,
        documents: [],
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) set('staff_photo', file)
  }

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 5) {
      toast({ title: 'Maximum 5 documents allowed', variant: 'destructive' })
      return
    }
    set('documents', files)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title}
      description="Complete staff member details"
      width="sm:max-w-2xl"
      footer={<DrawerFooter onCancel={() => onOpenChange(false)} submitLabel={initial ? 'Save Changes' : 'Add Staff'} onSubmit={() => onSubmit(form)} />}
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-6">
        <FormSection title="Personal Information" columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Employee ID <span className="text-destructive">*</span></Label>
            <Input value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)} placeholder="e.g. EMP001" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Full Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Hannah Kim" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email <span className="text-destructive">*</span></Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="staff@school.edu" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555-0000" />
          </div>
        </FormSection>

        <FormSection title="Professional Details" columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Department</Label>
            <SelectInForm
              value={form.department_id}
              onChange={(v) => set('department_id', v)}
              options={departments.map((d) => ({ value: d._id, label: d.department_name }))}
              placeholder="Select department"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Designation</Label>
            <SelectInForm
              value={form.designation_id}
              onChange={(v) => set('designation_id', v)}
              options={designations.map((d) => ({ value: d._id, label: d.designation_title }))}
              placeholder="Select designation"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Joining Date</Label>
            <Input type="date" value={form.joining_date} onChange={(e) => set('joining_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Salary</Label>
            <Input type="number" value={form.salary} onChange={(e) => set('salary', Number(e.target.value))} placeholder="e.g. 55000" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <SelectInForm value={form.role} onChange={(v) => set('role', v)} options={ROLE_OPTIONS} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <SelectInForm value={form.status} onChange={(v) => set('status', v)} options={['active', 'inactive']} />
          </div>
        </FormSection>

        <FormSection title="Files" columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Staff Photo</Label>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={handlePhotoChange} className="flex-1" />
              {form.staff_photo && <Badge variant="secondary">Selected</Badge>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Documents (Max 5)</Label>
            <div className="flex items-center gap-2">
              <Input type="file" multiple accept=".pdf,.doc,.docx" onChange={handleDocumentsChange} className="flex-1" />
              {form.documents.length > 0 && <Badge variant="secondary">{form.documents.length} files</Badge>}
            </div>
          </div>
        </FormSection>

        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}

// Inline select reused inside the form
function SelectInForm({ value, onChange, options, placeholder = 'Select' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  )
}
