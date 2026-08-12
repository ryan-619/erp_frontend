import { useMemo, useState } from 'react'
import { Ban, Pencil, Plus, Trash2, Search, Filter, User, AlertTriangle, Calendar } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentService } from '@/services/student.service'
import { useToast } from '@/hooks/use-toast'
import { fullName } from '@/utils/format'

const listValue = (data) => Array.isArray(data) ? data : data?.data || []
const idOf = (value) => typeof value === 'object' ? value?._id : value

function ReferenceField({ label, value, onChange, options, required }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required ? ' *' : ''}</Label>
      {options.length ? (
        <select 
          required={required} 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)} 
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <Input 
          required={required} 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder="Enter ID" 
        />
      )}
    </div>
  )
}

function DisabledForm({ initial, students, reasons, onSubmit }) {
  const [form, setForm] = useState({ 
    student_id: idOf(initial?.student_id) || '', 
    reason_id: idOf(initial?.reason_id) || '', 
    date: initial?.date ? new Date(initial.date).toISOString().slice(0, 10) : '' 
  })
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  
  return (
    <form id="disabled-form" onSubmit={(event) => { event.preventDefault(); if (form.student_id && form.reason_id) onSubmit(form) }} className="space-y-6">
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <User className="h-5 w-5 text-primary" />
          Student Information
        </h3>
        <ReferenceField 
          label="Student" 
          value={form.student_id} 
          onChange={(value) => set('student_id', value)} 
          options={students.map((student) => ({ 
            value: student._id, 
            label: `${fullName(student.name) || 'Unnamed'} (${student.roll_number || 'No roll number'})` 
          }))} 
          required 
        />
      </div>
      
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Disable Reason
        </h3>
        <ReferenceField 
          label="Reason" 
          value={form.reason_id} 
          onChange={(value) => set('reason_id', value)} 
          options={reasons.map((reason) => ({ value: reason._id, label: reason.reason }))} 
          required 
        />
      </div>
      
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Calendar className="h-5 w-5 text-primary" />
          Date Information
        </h3>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Disable Date</Label>
          <Input 
            type="date" 
            value={form.date} 
            onChange={(e) => set('date', e.target.value)} 
            className="h-10"
          />
        </div>
      </div>
      
      <button type="submit" className="hidden" aria-hidden="true">Save</button>
    </form>
  )
}

export default function DisabledStudentsPage() {
  const { toast } = useToast()
  const disabled = useAsyncData(() => studentService.disabled({ page: 1, limit: 100 }), [])
  const studentsResult = useAsyncData(() => studentService.list({ page: 1, limit: 100 }), [])
  const reasonsResult = useAsyncData(() => studentService.disableReasons({ page: 1, limit: 100 }), [])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [remove, setRemove] = useState(null)
  
  const rows = useMemo(() => 
    listValue(disabled.data).filter((item) => 
      !search.trim() || [idOf(item.student_id), idOf(item.reason_id), item.date]
        .some((field) => String(field || '').toLowerCase().includes(search.trim().toLowerCase()))
    ), [disabled.data, search])
  
  const students = listValue(studentsResult.data)
  const reasons = listValue(reasonsResult.data)
  
  const getStudentName = (studentId) => {
    const student = students.find(s => s._id === studentId)
    return student ? fullName(student.name) : 'Unknown'
  }
  
  const getReasonText = (reasonId) => {
    const reason = reasons.find(r => r._id === reasonId)
    return reason ? reason.reason : 'Unknown'
  }
  
  const columns = useMemo(() => [
    { 
      accessorKey: 'student_id', 
      header: 'Student', 
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{getStudentName(idOf(row.original.student_id))}</p>
        </div>
      )
    },
    { 
      accessorKey: 'reason_id', 
      header: 'Disable Reason', 
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal">
          {getReasonText(idOf(row.original.reason_id))}
        </Badge>
      )
    },
    { 
      accessorKey: 'date', 
      header: 'Disable Date', 
      cell: ({ row }) => row.original.date ? new Date(row.original.date).toLocaleDateString() : '—' 
    },
  ], [students, reasons])
  
  const save = async (payload, id) => { 
    if (id) await studentService.updateDisabledStudent(id, payload)
    else await studentService.createDisabledStudent(payload)
    toast({ title: id ? 'Disabled record updated' : 'Disabled record created' })
    await disabled.refetch()
    id ? setEdit(null) : setAddOpen(false)
  }
  
  const onDelete = async () => { 
    if (remove) { 
      await studentService.deleteDisabledStudent(remove._id)
      toast({ title: 'Disabled record deleted' })
      setRemove(null)
      await disabled.refetch()
    }
  }
  
  const loading = disabled.isLoading || studentsResult.isLoading || reasonsResult.isLoading
  const error = disabled.error || studentsResult.error || reasonsResult.error
  
  return (
    <div className="space-y-8 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Students', to: '/students' }, { label: 'Disabled Students' }]} />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disabled Students</h1>
          <p className="text-muted-foreground">Manage student disable records and reasons.</p>
        </div>
        <Button size="lg" onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-5 w-5" />
          Add Record
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder="Search by student name or reason..." 
            className="pl-10"
          />
        </div>
        
        {loading ? (
          <div className="py-12">
            <LoadingSkeleton variant="table" rows={5} cols={4} />
          </div>
        ) : error ? (
          <NoData 
            title="Unable to load disabled records" 
            description={error.message || 'The backend could not return disabled student records. Please try again.'} 
            actionLabel="Retry" 
            onAction={() => { disabled.refetch(); studentsResult.refetch(); reasonsResult.refetch() }}
            icon={Ban}
          />
        ) : rows.length === 0 ? (
          <NoData 
            title="No disabled student records" 
            description="Create a disable record by associating a student with a disable reason." 
            actionLabel="Add Record" 
            onAction={() => setAddOpen(true)}
            icon={Ban}
          />
        ) : (
          <DataTable 
            columns={columns} 
            data={rows} 
            enableExport 
            exportFilename="disabled-students" 
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
        title="Add Disabled Student Record" 
        description="Associate a student with a disable reason." 
        width="sm:max-w-2xl"
        footer={<DrawerFooter formId="disabled-form" onCancel={() => setAddOpen(false)} submitLabel="Create Record" />}
      >
        {addOpen ? <DisabledForm students={students} reasons={reasons} onSubmit={(payload) => save(payload)} /> : null}
      </Drawer>
      
      <Drawer 
        open={Boolean(edit)} 
        onOpenChange={(open) => !open && setEdit(null)} 
        title="Edit Disabled Student Record" 
        description={`Editing record ${edit?._id}`}
        width="sm:max-w-2xl"
        footer={<DrawerFooter formId="disabled-form" onCancel={() => setEdit(null)} submitLabel="Save Changes" />}
      >
        {edit ? <DisabledForm initial={edit} students={students} reasons={reasons} onSubmit={(payload) => save(payload, edit._id)} /> : null}
      </Drawer>
      
      <DeleteDialog 
        open={Boolean(remove)} 
        onOpenChange={(open) => !open && setRemove(null)} 
        entityName="disabled student record" 
        onConfirm={onDelete} 
      />
    </div>
  )
}
