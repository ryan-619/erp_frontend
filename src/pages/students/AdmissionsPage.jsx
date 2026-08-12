import { useMemo, useState } from 'react'
import { ClipboardList, Pencil, Plus, Trash2, User, GraduationCap, Phone, Mail, Calendar, Upload, X, FileText, Image as ImageIcon, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAdmissions } from '@/hooks/useStudents'
import { formatDate, fullName } from '@/utils/format'

const statuses = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

function AdmissionForm({ initial, onSubmit }) {
  const [form, setForm] = useState(() => ({
    class_name: initial?.class_name || '',
    name: { first: initial?.name?.first || '', last: initial?.name?.last || '' },
    gender: initial?.gender || '',
    dob: initial?.dob ? new Date(initial.dob).toISOString().slice(0, 10) : '',
    mobile: initial?.mobile || '',
    email: initial?.email || '',
    guardian: { name: initial?.guardian?.name || '', phone: initial?.guardian?.phone || '', email: initial?.guardian?.email || '' },
    status: initial?.status || 'pending',
    guardian_photo: null,
    guardian_photo_preview: initial?.guardian_photo || null,
    documents: null,
    documents_preview: initial?.documents || null,
  }))
  const [submitting, setSubmitting] = useState(false)
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const setNested = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }))

  const handleGuardianPhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      set('guardian_photo', file)
      set('guardian_photo_preview', URL.createObjectURL(file))
    }
  }

  const handleDocumentsChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      set('documents', file)
      set('documents_preview', URL.createObjectURL(file))
    }
  }

  const removeDocument = () => {
    set('documents', null)
    set('documents_preview', null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form id="admission-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5 text-primary" />
          Personal Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" required>
            <Input 
              required 
              value={form.name.first} 
              onChange={(e) => setNested('name', 'first', e.target.value)} 
              placeholder="Enter first name"
            />
          </Field>
          <Field label="Last Name">
            <Input 
              value={form.name.last} 
              onChange={(e) => setNested('name', 'last', e.target.value)} 
              placeholder="Enter last name"
            />
          </Field>
          <Field label="Gender">
            <select 
              value={form.gender} 
              onChange={(e) => set('gender', e.target.value)} 
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Date of Birth">
            <Input 
              type="date" 
              value={form.dob} 
              onChange={(e) => set('dob', e.target.value)} 
            />
          </Field>
          <Field label="Mobile">
            <Input 
              value={form.mobile} 
              onChange={(e) => set('mobile', e.target.value)} 
              placeholder="Enter mobile number"
            />
          </Field>
          <Field label="Email">
            <Input 
              type="email" 
              value={form.email} 
              onChange={(e) => set('email', e.target.value)} 
              placeholder="Enter email address"
            />
          </Field>
        </div>
      </div>

      {/* Academic Information */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="h-5 w-5 text-primary" />
          Academic Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Class Name">
            <Input 
              value={form.class_name} 
              onChange={(e) => set('class_name', e.target.value)} 
              placeholder="Enter class name"
            />
          </Field>
          <Field label="Status">
            <select 
              value={form.status} 
              onChange={(e) => set('status', e.target.value)} 
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {statuses.slice(1).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Guardian Information */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Phone className="h-5 w-5 text-primary" />
          Guardian Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Guardian Name">
            <Input 
              value={form.guardian.name} 
              onChange={(e) => setNested('guardian', 'name', e.target.value)} 
              placeholder="Enter guardian name"
            />
          </Field>
          <Field label="Guardian Phone">
            <Input 
              value={form.guardian.phone} 
              onChange={(e) => setNested('guardian', 'phone', e.target.value)} 
              placeholder="Enter guardian phone"
            />
          </Field>
          <Field label="Guardian Email">
            <Input 
              type="email" 
              value={form.guardian.email} 
              onChange={(e) => setNested('guardian', 'email', e.target.value)} 
              placeholder="Enter guardian email"
            />
          </Field>
        </div>
      </div>

      {/* Documents */}
      {!initial && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            Documents
          </h3>
          
          {/* Guardian Photo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Guardian Photo</Label>
            <div className="flex items-center gap-4">
              {form.guardian_photo_preview && (
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                  <img 
                    src={form.guardian_photo_preview} 
                    alt="Guardian preview" 
                    className="h-full w-full object-cover"
                  />
                  <button 
                    type="button"
                    onClick={() => { set('guardian_photo', null); set('guardian_photo_preview', null) }}
                    className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleGuardianPhotoChange}
                  className="cursor-pointer"
                />
                <p className="mt-1 text-xs text-muted-foreground">Upload guardian photo (JPG, PNG)</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Supporting Documents</Label>
            <div className="flex items-center gap-4">
              {form.documents_preview && (
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                  <FileText className="h-8 w-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <button 
                    type="button"
                    onClick={removeDocument}
                    className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <Input 
                  type="file" 
                  onChange={handleDocumentsChange}
                  className="cursor-pointer"
                />
                <p className="mt-1 text-xs text-muted-foreground">Upload supporting document (PDF, JPG, PNG)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button type="submit" className="hidden" aria-hidden="true" disabled={submitting}>Submit</button>
    </form>
  )
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label className="text-sm font-medium">{label}</Label>{children}</div>
}

export default function AdmissionsPage() {
  const { rows, stats, isLoading, error, refetch, search, setSearch, status, setStatus, saveAdmission, deleteAdmission } = useAdmissions()
  const [addOpen, setAddOpen] = useState(false)
  const [editAdmission, setEditAdmission] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const columns = useMemo(() => [
    { accessorKey: 'name', header: 'Applicant', cell: ({ row }) => <div><p className="font-medium">{fullName(row.original.name) || 'Unnamed applicant'}</p><p className="text-xs text-muted-foreground">{row.original.email || '—'}</p></div> },
    { accessorKey: 'class_name', header: 'Class name', cell: ({ row }) => row.original.class_name || '—' },
    { accessorKey: 'mobile', header: 'Mobile', cell: ({ row }) => row.original.mobile || '—' },
    { accessorKey: 'guardian', header: 'Guardian', cell: ({ row }) => row.original.guardian?.name || '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status || 'pending'} /> },
    { accessorKey: 'createdAt', header: 'Submitted', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])
  const onDelete = async () => { if (deleteTarget) { await deleteAdmission(deleteTarget._id); setDeleteTarget(null) } }
  return (
    <div className="space-y-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Online admissions' }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Online Admissions</h1>
          <p className="text-muted-foreground">Manage student admission applications and requests.</p>
        </div>
        <Button size="lg" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-5 w-5" />
          New Admission
        </Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applications" value={stats.total} icon={ClipboardList} className="border-l-4 border-l-primary" />
        <StatCard label="Pending" value={stats.pending} accent="warning" className="border-l-4 border-l-yellow-500" />
        <StatCard label="Approved" value={stats.approved} accent="success" className="border-l-4 border-l-green-500" />
        <StatCard label="Rejected" value={stats.rejected} accent="destructive" className="border-l-4 border-l-red-500" />
      </div>
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <SearchBar 
              value={search} 
              onChange={setSearch} 
              placeholder="Search applicant, email, class..." 
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="py-12">
            <LoadingSkeleton variant="table" rows={7} cols={7} />
          </div>
        ) : error ? (
          <NoData 
            title="Unable to load admissions" 
            description={error.message || 'The backend could not return admission records. Please try again.'} 
            actionLabel="Retry" 
            onAction={refetch} 
            icon={ClipboardList}
          />
        ) : rows.length === 0 ? (
          <NoData 
            title="No online admissions" 
            description="Submit an admission application to create the first record." 
            actionLabel="New Admission" 
            onAction={() => setAddOpen(true)}
            icon={ClipboardList}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={rows} 
            enableExport 
            exportFilename="online-admissions" 
            rowActions={(row) => <ActionDropdown actions={[{ label: 'Edit', icon: Pencil, onClick: () => setEditAdmission(row) }, { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteTarget(row) }]} />} 
          />
        )}
      </div>
      <Drawer 
        open={addOpen} 
        onOpenChange={setAddOpen} 
        title="New Online Admission" 
        description="Fill in the admission application details below." 
        width="sm:max-w-3xl" 
        footer={<DrawerFooter formId="admission-form" onCancel={() => setAddOpen(false)} submitLabel="Submit Application" />}
      >
        {addOpen ? <AdmissionForm onSubmit={async (payload) => { await saveAdmission(payload); setAddOpen(false) }} /> : null}
      </Drawer>
      <Drawer 
        open={Boolean(editAdmission)} 
        onOpenChange={(open) => !open && setEditAdmission(null)} 
        title="Edit Online Admission" 
        description={editAdmission ? `Editing ${fullName(editAdmission.name)}` : ''} 
        width="sm:max-w-3xl" 
        footer={<DrawerFooter formId="admission-form" onCancel={() => setEditAdmission(null)} submitLabel="Save Changes" />}
      >
        {editAdmission ? <AdmissionForm initial={editAdmission} onSubmit={async (payload) => { await saveAdmission(payload, editAdmission._id); setEditAdmission(null) }} /> : null}
      </Drawer>
      <DeleteDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} entityName={deleteTarget ? fullName(deleteTarget.name) : 'admission'} onConfirm={onDelete} />
    </div>
  )
}
