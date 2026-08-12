import { useMemo, useState } from 'react'
import { Layers3, Pencil, Plus, Trash2, Search, User, GraduationCap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { SearchBar } from '@/components/SearchBar'
import { DataTable } from '@/components/DataTable'
import { ActionDropdown } from '@/components/ActionDropdown'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useMultiClassStudents } from '@/hooks/useStudents'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentService } from '@/services/student.service'
import { fullName } from '@/utils/format'

const referenceId = (value) => typeof value === 'object' ? value?._id || '' : value || ''
const listValue = (data) => Array.isArray(data) ? data : data?.data || []

function AssignmentForm({ initial, students, classes, onSubmit }) {
  const [form, setForm] = useState({ student_id: referenceId(initial?.student_id), class_id: referenceId(initial?.class_id) })
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  
  return (
    <form id="multi-class-form" onSubmit={(event) => { event.preventDefault(); if (form.student_id && form.class_id) onSubmit(form) }} className="space-y-6">
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5 text-primary" />
          Student Information
        </h3>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Student *</Label>
          {students.length > 0 ? (
            <select 
              required 
              value={form.student_id} 
              onChange={(e) => set('student_id', e.target.value)} 
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {fullName(student.name) || 'Unnamed'} ({student.roll_number || 'No roll number'})
                </option>
              ))}
            </select>
          ) : (
            <Input 
              required 
              value={form.student_id} 
              onChange={(e) => set('student_id', e.target.value)} 
              placeholder="Enter student ID"
              className="h-10"
            />
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="h-5 w-5 text-primary" />
          Class Information
        </h3>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Class *</Label>
          {classes.length > 0 ? (
            <select 
              required 
              value={form.class_id} 
              onChange={(e) => set('class_id', e.target.value)} 
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.class_name || 'Unnamed'}
                </option>
              ))}
            </select>
          ) : (
            <Input 
              required 
              value={form.class_id} 
              onChange={(e) => set('class_id', e.target.value)} 
              placeholder="Enter class ID"
              className="h-10"
            />
          )}
        </div>
      </div>
      
      <button type="submit" className="hidden" aria-hidden="true">Save</button>
    </form>
  )
}

export default function MultiClassStudentsPage() {
  const { rows, isLoading, error, refetch, search, setSearch, saveAssignment, removeAssignment } = useMultiClassStudents()
  const studentsResult = useAsyncData(() => studentService.list({ page: 1, limit: 100 }), [])
  const classesResult = useAsyncData(() => studentService.list({ page: 1, limit: 100 }), [])
  const [addOpen, setAddOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [remove, setRemove] = useState(null)
  
  const students = listValue(studentsResult.data)
  const classes = listValue(classesResult.data)
  
  const getStudentName = (studentId) => {
    const student = students.find(s => s._id === studentId)
    return student ? fullName(student.name) : 'Unknown'
  }
  
  const getClassName = (classId) => {
    const cls = classes.find(c => c._id === classId)
    return cls ? cls.class_name : 'Unknown'
  }
  
  const columns = useMemo(() => [
    { 
      accessorKey: 'student_id', 
      header: 'Student', 
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{getStudentName(row.original.student_id)}</p>
        </div>
      )
    },
    { 
      accessorKey: 'class_id', 
      header: 'Class', 
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{getClassName(row.original.class_id)}</p>
        </div>
      )
    },
    { 
      accessorKey: 'createdAt', 
      header: 'Created', 
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—' 
    },
  ], [students, classes])
  
  const save = async (payload, id) => { await saveAssignment(payload, id); id ? setEdit(null) : setAddOpen(false) }
  const onDelete = async () => { if (remove) { await removeAssignment(remove._id); setRemove(null) } }
  const loading = isLoading || studentsResult.isLoading || classesResult.isLoading
  const errorState = error || studentsResult.error || classesResult.error
  
  return (
    <div className="space-y-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Multi-Class Students' }]} />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multi-Class Students</h1>
          <p className="text-muted-foreground">Manage students assigned to multiple classes.</p>
        </div>
        <Button size="lg" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-5 w-5" />
          Add Assignment
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder="Search by student or class..." 
            className="pl-10"
          />
        </div>
        
        {loading ? (
          <div className="py-12">
            <LoadingSkeleton variant="table" rows={5} cols={4} />
          </div>
        ) : errorState ? (
          <NoData 
            title="Unable to load assignments" 
            description={errorState.message || 'The backend could not return multi-class assignments. Please try again.'} 
            actionLabel="Retry" 
            onAction={() => { refetch(); studentsResult.refetch(); classesResult.refetch() }}
            icon={AlertTriangle}
          />
        ) : rows.length === 0 ? (
          <NoData 
            title="No multi-class assignments" 
            description="Create an assignment by linking a student to a class." 
            actionLabel="Add Assignment" 
            onAction={() => setAddOpen(true)}
            icon={Layers3}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={rows} 
            enableExport 
            exportFilename="multi-class-students" 
            rowActions={(row) => <ActionDropdown actions={[
              { label: 'Edit', icon: Pencil, onClick: () => setEdit(row) }, 
              { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setRemove(row) }
            ]} />} 
          />
        )}
      </div>
      
      <Drawer 
        open={addOpen} 
        onOpenChange={setAddOpen} 
        title="Add Multi-Class Assignment" 
        description="Assign a student to an additional class." 
        width="sm:max-w-2xl"
        footer={<DrawerFooter formId="multi-class-form" onCancel={() => setAddOpen(false)} submitLabel="Create Assignment" />}
      >
        {addOpen ? <AssignmentForm students={students} classes={classes} onSubmit={(payload) => save(payload)} /> : null}
      </Drawer>
      
      <Drawer 
        open={Boolean(edit)} 
        onOpenChange={(open) => !open && setEdit(null)} 
        title="Edit Multi-Class Assignment" 
        description={`Editing assignment ${edit?._id}`}
        width="sm:max-w-2xl"
        footer={<DrawerFooter formId="multi-class-form" onCancel={() => setEdit(null)} submitLabel="Save Changes" />}
      >
        {edit ? <AssignmentForm initial={edit} students={students} classes={classes} onSubmit={(payload) => save(payload, edit._id)} /> : null}
      </Drawer>
      
      <DeleteDialog 
        open={Boolean(remove)} 
        onOpenChange={(open) => !open && setRemove(null)} 
        entityName="multi-class assignment" 
        onConfirm={onDelete} 
      />
    </div>
  )
}
