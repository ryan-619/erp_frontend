import { useMemo, useState } from 'react'
import { BookOpen, Calendar, CheckCircle2 } from 'lucide-react'
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
import { academicsService } from '@/services/academics.service'
import { studentPortalService } from '@/services/studentPortal.service'
import { formatDate } from '@/utils/format'

export default function MyHomeworkPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  const { data: homeworks, isLoading } = useAsyncData(() => homeworkService.getHomeworks(), [])
  const { data: subjects } = useAsyncData(() => academicsService.subjects(), [])
  const { data: classes } = useAsyncData(() => academicsService.classes(), [])
  const { data: studentProfile } = useAsyncData(() => studentId ? studentPortalService.getMyProfile(studentId) : Promise.resolve(null), [studentId])

  const rows = homeworks || []
  const allSubjects = subjects || []
  const allClasses = classes || []

  // Filter homeworks by student's class
  const filtered = useMemo(() => {
    if (!studentProfile) return []
    const studentClass = studentProfile.class_name || studentProfile.class
    if (!studentClass) return []

    const filteredByClass = rows.filter((r) => {
      const cls = allClasses.find(c => c._id === r.class_id)
      const className = cls?.class_name || ''
      // Match class exactly or by number (e.g., "12" matches "Class 12" or "12")
      // Normalize by removing "Class " prefix and space
      const normalizedStudentClass = studentClass.replace(/^Class\s*/i, '').trim()
      const normalizedClassName = className.replace(/^Class\s*/i, '').trim()
      return normalizedStudentClass === normalizedClassName || 
             className.includes(`Class ${studentClass}`) ||
             studentClass.includes(className)
    })

    // Filter by search
    if (!search.trim()) return filteredByClass

    const q = search.toLowerCase()
    return filteredByClass.filter((r) => {
      const subject = allSubjects.find(s => s._id === r.subject_id)
      return !q || 
        (subject?.subject_name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
    })
  }, [rows, search, allSubjects, allClasses, studentProfile])

  const stats = useMemo(() => ({
    total: filtered.length,
    pending: filtered.filter(r => new Date(r.submission_date) >= new Date()).length,
    overdue: filtered.filter(r => r.submission_date && new Date(r.submission_date) < new Date()).length,
  }), [filtered])

  const columns = useMemo(() => [
    {
      accessorKey: 'description',
      header: 'Homework',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1 max-w-xs">{row.original.description || 'No description'}</span>
            <span className="text-xs text-muted-foreground">{row.original.submission_date ? formatDate(row.original.submission_date) : 'No submission date'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'subject_id',
      header: 'Subject',
      cell: ({ row }) => {
        const subject = allSubjects.find(s => s._id === row.original.subject_id)
        return <Badge variant="outline">{subject?.subject_name || 'Unknown'}</Badge>
      },
    },
    { accessorKey: 'homework_date', header: 'Homework Date', cell: ({ row }) => row.original.homework_date ? formatDate(row.original.homework_date) : '—' },
    {
      accessorKey: 'submission_date',
      header: 'Submission Date',
      cell: ({ row }) => {
        const submissionDate = row.original.submission_date
        if (!submissionDate) return '—'
        const isOverdue = new Date(submissionDate) < new Date()
        return (
          <span className={isOverdue ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
            {formatDate(submissionDate)}
          </span>
        )
      },
    },
  ], [allSubjects])

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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Homework' }, { label: 'My Homework' }]} />
      <PageHeader
        title="My Homework"
        description="View your homework assignments."
        icon={BookOpen}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Homework" value={stats.total} icon={BookOpen} accent="primary" />
        <StatCard label="Pending" value={stats.pending} icon={Calendar} accent="success" />
        <StatCard label="Overdue" value={stats.overdue} icon={CheckCircle2} accent="destructive" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by subject or description…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No Homework Found" description="No homework assignments found for your class." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
