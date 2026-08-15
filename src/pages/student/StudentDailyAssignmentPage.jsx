import { useMemo, useState } from 'react'
import { ClipboardList, Calendar, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { homeworkService } from '@/services/homework.service'
import { hrService } from '@/services/hr.service'
import { studentService } from '@/services/student.service'
import { formatDate } from '@/utils/format'

export default function StudentDailyAssignmentPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  const { data: assignments, isLoading } = useAsyncData(() => homeworkService.getDailyAssignments(), [])
  const { data: teachers } = useAsyncData(() => hrService.getStaff(), [])
  const { data: students } = useAsyncData(() => studentService.list(), [])

  const rows = assignments || []
  const allTeachers = teachers || []
  const allStudents = students || []

  // Filter assignments for this student
  const filtered = useMemo(() => {
    const studentAssignments = rows.filter((r) => r.student_id === studentId)
    
    if (!search.trim()) return studentAssignments

    const q = search.toLowerCase()
    return studentAssignments.filter((r) => {
      const teacher = allTeachers.find(t => t._id === r.teacher_id)
      const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
      return !q || 
        teacherName.toLowerCase().includes(q) ||
        (r.task || '').toLowerCase().includes(q)
    })
  }, [rows, studentId, search, allTeachers])

  const stats = useMemo(() => ({
    total: filtered.length,
    completed: filtered.filter(r => r.status === 'completed').length,
    pending: filtered.filter(r => r.status === 'pending').length,
  }), [filtered])

  const columns = useMemo(() => [
    {
      accessorKey: 'task',
      header: 'Task',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1 max-w-xs">{row.original.task || 'No task'}</span>
            <span className="text-xs text-muted-foreground">{row.original.date ? formatDate(row.original.date) : 'No date'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'teacher_id',
      header: 'Teacher',
      cell: ({ row }) => {
        const teacher = allTeachers.find(t => t._id === row.original.teacher_id)
        const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
        return <span className="text-sm">{teacherName}</span>
      },
    },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => row.original.date ? formatDate(row.original.date) : '—' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'completed' ? 'default' : 'secondary'}>
          {row.original.status || 'Pending'}
        </Badge>
      ),
    },
  ], [allTeachers])

  if (role !== 'student') {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">This page is only accessible to students.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Homework' }, { label: 'Daily Assignment' }]} />
      <PageHeader
        title="Daily Assignment"
        description="View your daily assignments."
        icon={ClipboardList}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Assignments" value={stats.total} icon={ClipboardList} accent="primary" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="success" />
        <StatCard label="Pending" value={stats.pending} icon={Calendar} accent="warning" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by teacher or task…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No Assignments Found" description="No daily assignments found for you." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
