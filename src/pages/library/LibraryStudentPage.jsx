// ====================================================================
// Module: Library
// Page: Library Students
//
// Purpose:
// Manage library student memberships.
//
// Data Source:
// library.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Users, Eye, Pencil, Trash2, UserPlus, GraduationCap, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { libraryService } from '@/services/library.service'
import { studentService } from '@/services/student.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'student_name', label: 'Student Name' },
  { key: 'membership_id', label: 'Membership ID' },
  { key: 'valid_till', label: 'Valid Till' },
  { key: 'createdAt', label: 'Created At' },
]

export default function LibraryStudentPage() {
  const { toast } = useToast()
  const { data: libraryStudents, isLoading, refetch } = useAsyncData(() => libraryService.getLibraryStudents(), [])
  const { data: studentList, isLoading: studentLoading } = useAsyncData(() => studentService.list(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = libraryStudents || []
  const students = studentList || []

  const filtered = useMemo(() => rows.filter((r) => {
    const student = students.find(s => s._id === r.student_id)
    const studentName = student?.name 
      ? (typeof student.name === 'string' ? student.name : `${student.name.first || ''} ${student.name.last || ''}`.trim())
      : ''
    const q = search.toLowerCase()
    return !q || studentName.toLowerCase().includes(q)
  }), [rows, search, students])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => new Date(r.valid_till) > new Date()).length,
    expired: rows.filter((r) => new Date(r.valid_till) <= new Date()).length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'student_id',
      header: 'Student',
      cell: ({ row }) => {
        const student = students.find(s => s._id === row.original.student_id)
        const studentName = student?.name 
          ? (typeof student.name === 'string' ? student.name : `${student.name.first || ''} ${student.name.last || ''}`.trim())
          : 'Unknown'
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {studentName.charAt(0) || '?'}
            </div>
            <div className="flex flex-col">
              <span className="font-medium hover:underline">{studentName}</span>
              <span className="text-xs text-muted-foreground">{student?.student_id || '—'}</span>
            </div>
          </button>
        )
      },
    },
    { accessorKey: 'membership_id', header: 'Membership ID', cell: ({ row }) => <Badge variant="outline">{row.original.membership_id || '—'}</Badge> },
    { 
      accessorKey: 'valid_till', 
      header: 'Valid Till', 
      cell: ({ row }) => {
        const isValid = new Date(row.original.valid_till) > new Date()
        return (
          <Badge variant={isValid ? 'default' : 'destructive'}>
            {formatDate(row.original.valid_till)}
          </Badge>
        )
      }
    },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [students])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await libraryService.updateLibraryStudent(id, payload)
        toast({ title: 'Library student updated' })
      } else {
        await libraryService.createLibraryStudent(payload)
        toast({ title: 'Library student added' })
      }
      setAddOpen(false)
      setEditRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to save library student:', error)
      toast({ title: 'Failed to save library student', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await libraryService.deleteLibraryStudent(id)
      toast({ title: 'Library student deleted' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete library student:', error)
      toast({ title: 'Failed to delete library student', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Library' }, { label: 'Library Students' }]} />
      <PageHeader
        title="Library Students"
        description="Manage library student memberships."
        icon={GraduationCap}
        actions={<Button onClick={() => setAddOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Add Student</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Students" value={stats.total} icon={Users} accent="primary" />
        <StatCard label="Active Memberships" value={stats.active} icon={Calendar} accent="success" />
        <StatCard label="Expired" value={stats.expired} icon={GraduationCap} accent="destructive" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student name…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="library-students" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No library students found" description="Add a student to get started." actionLabel="Add Student" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Library Student' : 'Add Library Student'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update library student membership' : 'Add a student to the library'}</DialogDescription>
          </DialogHeader>
          <StudentForm 
            initial={editRow} 
            students={students} 
            studentLoading={studentLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Library Student Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const student = students.find(s => s._id === viewRow.student_id)
          const studentName = student?.name 
            ? (typeof student.name === 'string' ? student.name : `${student.name.first || ''} ${student.name.last || ''}`.trim())
            : 'Unknown'
          const isValid = new Date(viewRow.valid_till) > new Date()
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {studentName.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{studentName}</p>
                  <p className="text-xs text-muted-foreground">{student?.student_id || '—'}</p>
                </div>
                <Badge variant={isValid ? 'default' : 'destructive'}>
                  {isValid ? 'Active' : 'Expired'}
                </Badge>
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  { label: 'Membership ID', value: viewRow.membership_id || '—' },
                  { label: 'Valid Till', value: formatDate(viewRow.valid_till) },
                  { label: 'Created', value: formatDate(viewRow.createdAt) },
                  { label: 'Updated', value: formatDate(viewRow.updatedAt) },
                ].map((f) => (
                  <div key={f.label} className="space-y-0.5">
                    <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                    <dd className="text-sm font-medium">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })()}
      </Drawer>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Library Student</DialogTitle>
            <DialogDescription>Are you sure you want to delete this library student? This action cannot be undone.</DialogDescription>
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

// ─── StudentForm Component ───────────────────────────────────────────────────────
function StudentForm({ initial, students, studentLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    student_id: '',
    membership_id: '',
    valid_till: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        student_id: initial.student_id || '',
        membership_id: initial.membership_id || '',
        valid_till: initial.valid_till ? initial.valid_till.split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
    } else {
      setFormData({
        student_id: students[0]?._id || '',
        membership_id: '',
        valid_till: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
    }
  }, [initial, students])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="student_id">Student *</Label>
        <select
          id="student_id"
          value={formData.student_id}
          onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
          disabled={studentLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select student</option>
          {students.map((s) => {
            const studentName = s.name 
              ? (typeof s.name === 'string' ? s.name : `${s.name.first || ''} ${s.name.last || ''}`.trim())
              : 'Unknown'
            return (
              <option key={s._id} value={s._id}>{studentName} ({s.student_id || 'No ID'})</option>
            )
          })}
        </select>
      </div>
      <div>
        <Label htmlFor="membership_id">Membership ID</Label>
        <Input
          id="membership_id"
          value={formData.membership_id}
          onChange={(e) => setFormData({ ...formData, membership_id: e.target.value })}
          placeholder="Enter membership ID"
        />
      </div>
      <div>
        <Label htmlFor="valid_till">Valid Till *</Label>
        <Input
          id="valid_till"
          type="date"
          value={formData.valid_till}
          onChange={(e) => setFormData({ ...formData, valid_till: e.target.value })}
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
