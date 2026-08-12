import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, Eye, GraduationCap, Pencil, Plus, Trash2, UserCheck, UserX, Users, Filter, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { StudentForm } from '@/components/StudentForm'
import { useStudents } from '@/hooks/useStudents'
import { formatDate, fullName, initials } from '@/utils/format'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'disabled', label: 'Disabled' },
]

export default function StudentsPage() {
  const navigate = useNavigate()
  const {
    rows, stats, classOptions, isLoading, error, refetch,
    search, setSearch, status, setStatus, classFilter, setClassFilter,
    saveStudent, deleteStudent, bulkDelete,
  } = useStudents()
  const [addOpen, setAddOpen] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Student',
      cell: ({ row }) => (
        <button type="button" className="flex items-center gap-3 text-left" onClick={() => navigate(`/students/profile/${row.original._id}`)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(row.original.name)}</div>
          <div><p className="font-medium hover:underline">{fullName(row.original.name) || 'Unnamed student'}</p><p className="text-xs text-muted-foreground">{row.original.email || '—'}</p></div>
        </button>
      ),
    },
    { accessorKey: 'roll_number', header: 'Roll number', cell: ({ row }) => row.original.roll_number || '—' },
    { accessorKey: 'class_name', header: 'Class name' },
    { accessorKey: 'section', header: 'Section', cell: ({ row }) => row.original.section || '—' },
    { accessorKey: 'guardian', header: 'Guardian', cell: ({ row }) => row.original.guardian?.name || '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status || 'active'} /> },
    { accessorKey: 'admission_date', header: 'Admission date', cell: ({ row }) => formatDate(row.original.admission_date) },
  ], [navigate])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteStudent(deleteTarget._id, deleteTarget)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const rowActions = (student) => [
    { label: 'View profile', icon: Eye, onClick: () => navigate(`/students/profile/${student._id}`) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditStudent(student) },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteTarget(student) },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students' }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage student records, admissions, and academic information.</p>
        </div>
        <Button size="lg" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-5 w-5" />
          Add Student
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={stats.total} icon={Users} className="border-l-4 border-l-primary" />
        <StatCard label="Active Students" value={stats.active} icon={UserCheck} accent="success" className="border-l-4 border-l-green-500" />
        <StatCard label="Inactive Students" value={stats.inactive} icon={UserX} accent="warning" className="border-l-4 border-l-yellow-500" />
        <StatCard label="Disabled Students" value={stats.disabled} icon={Ban} accent="destructive" className="border-l-4 border-l-red-500" />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <SearchBar 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by name, email, roll number..." 
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
                {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <select 
              value={classFilter} 
              onChange={(e) => setClassFilter(e.target.value)} 
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {classOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingSkeleton variant="table" rows={8} cols={8} />
          </div>
        ) : error ? (
          <NoData 
            title="Unable to load students" 
            description={error.message || 'The backend could not return student records. Please try again.'} 
            actionLabel="Retry" 
            onAction={refetch} 
            icon={GraduationCap}
          />
        ) : rows.length === 0 ? (
          <NoData 
            title="No students found" 
            description="Create a student record or clear the current filters to see all students." 
            actionLabel="Add Student" 
            onAction={() => setAddOpen(true)}
            icon={Users}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={rows} 
            enableSelection 
            enableExport 
            exportFilename="students" 
            bulkActions={[{ label: 'Delete Selected', icon: Trash2, variant: 'destructive', onClick: bulkDelete }]} 
            rowActions={(student) => <ActionDropdown actions={rowActions(student)} />} 
          />
        )}
      </div>

      <Drawer 
        open={addOpen} 
        onOpenChange={setAddOpen} 
        title="Add New Student" 
        description="Fill in the student details below. All required fields must be completed." 
        width="sm:max-w-3xl" 
        footer={<DrawerFooter formId="student-form" onCancel={() => setAddOpen(false)} submitLabel="Create Student" />}
      >
        {addOpen ? <StudentForm onSubmit={async (payload) => { await saveStudent(payload); setAddOpen(false) }} /> : null}
      </Drawer>
      <Drawer 
        open={Boolean(editStudent)} 
        onOpenChange={(open) => !open && setEditStudent(null)} 
        title="Edit Student" 
        description={editStudent ? `Editing ${fullName(editStudent.name)}` : ''} 
        width="sm:max-w-3xl" 
        footer={<DrawerFooter formId="student-form" onCancel={() => setEditStudent(null)} submitLabel="Save Changes" />}
      >
        {editStudent ? <StudentForm initial={editStudent} onSubmit={async (payload) => { await saveStudent(payload, editStudent._id); setEditStudent(null) }} /> : null}
      </Drawer>
      <DeleteDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} entityName={deleteTarget ? fullName(deleteTarget.name) : 'student'} onConfirm={handleDelete} loading={deleting} />
    </div>
  )
}
