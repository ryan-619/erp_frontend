import { useMemo, useState } from 'react'
import { MonitorPlay, Calendar, Clock, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { onlineExamService } from '@/services/onlineExam.service'
import { academicsService } from '@/services/academics.service'
import { studentPortalService } from '@/services/studentPortal.service'
import { formatDate } from '@/utils/format'

export default function MyOnlineExamsPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  const { data: exams, isLoading } = useAsyncData(() => onlineExamService.getExams(), [])
  const { data: subjects } = useAsyncData(() => academicsService.subjects(), [])
  const { data: classes } = useAsyncData(() => academicsService.classes(), [])
  const { data: studentProfile } = useAsyncData(() => studentId ? studentPortalService.getMyProfile(studentId) : Promise.resolve(null), [studentId])

  const rows = exams || []
  const allSubjects = subjects || []
  const allClasses = classes || []

  // Filter exams by student's class
  const filtered = useMemo(() => {
    if (!studentProfile) return []
    const studentClass = studentProfile.class_name || studentProfile.class
    if (!studentClass) return []

    const filteredByClass = rows.filter((r) => {
      const cls = allClasses.find(c => c._id === r.class_id)
      const className = cls?.class_name || ''
      // Match class exactly or by number (e.g., "12" matches "Class 12" or "12")
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
        (r.exam_name || '').toLowerCase().includes(q) ||
        (subject?.subject_name || '').toLowerCase().includes(q)
    })
  }, [rows, search, allSubjects, allClasses, studentProfile])

  const stats = useMemo(() => ({
    total: filtered.length,
    upcoming: filtered.filter(r => r.scheduled_at && new Date(r.scheduled_at) > new Date()).length,
    completed: filtered.filter(r => r.scheduled_at && new Date(r.scheduled_at) <= new Date()).length,
  }), [filtered])

  const columns = useMemo(() => [
    {
      accessorKey: 'exam_name',
      header: 'Exam',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MonitorPlay className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1 max-w-xs">{row.original.exam_name || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.duration || 0} min</span>
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
    { accessorKey: 'total_marks', header: 'Total Marks', cell: ({ row }) => row.original.total_marks || 0 },
    {
      accessorKey: 'scheduled_at',
      header: 'Scheduled Date',
      cell: ({ row }) => {
        const scheduledDate = row.original.scheduled_at
        if (!scheduledDate) return '—'
        const isUpcoming = new Date(scheduledDate) > new Date()
        return (
          <span className={isUpcoming ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
            {formatDate(scheduledDate)}
          </span>
        )
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const scheduledDate = row.original.scheduled_at
        const isUpcoming = scheduledDate && new Date(scheduledDate) > new Date()
        return (
          <Button 
            size="sm" 
            disabled={!isUpcoming}
            variant={isUpcoming ? 'default' : 'secondary'}
          >
            {isUpcoming ? 'Start Exam' : 'Closed'}
          </Button>
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Online Examination' }, { label: 'My Online Exams' }]} />
      <PageHeader
        title="My Online Exams"
        description="View and take your online examinations."
        icon={MonitorPlay}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Exams" value={stats.total} icon={MonitorPlay} accent="primary" />
        <StatCard label="Upcoming" value={stats.upcoming} icon={Calendar} accent="success" />
        <StatCard label="Completed" value={stats.completed} icon={Award} accent="warning" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by exam name or subject…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No Exams Found" description="No online exams found for your class." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
