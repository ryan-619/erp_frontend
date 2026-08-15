import { useMemo, useState } from 'react'
import { FileText, Calendar, Clock, CheckCircle } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentPortalService } from '@/services/studentPortal.service'
import { examinationService } from '@/services/examination.service'
import { formatDate } from '@/utils/format'

export default function StudentExamSchedulePage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  // Fetch student profile to get class
  const { data: profile } = useAsyncData(
    () => studentId ? studentPortalService.getMyProfile(studentId) : Promise.resolve(null),
    [studentId]
  )

  const studentClass = profile?.class_name || profile?.class

  // Fetch exam schedule
  const { data: examData, isLoading: examLoading } = useAsyncData(
    () => studentPortalService.getExamSchedule(studentClass),
    [studentClass]
  )

  // Filter exam schedule by search
  const filteredExams = useMemo(() => {
    if (!Array.isArray(examData)) return []
    if (!search) return examData
    
    const searchLower = search.toLowerCase()
    return examData.filter(entry => {
      const examName = entry.exam_name || entry.name || ''
      const subject = entry.subject_name || entry.subject || ''
      const date = entry.exam_date || entry.date || ''
      
      return (
        examName.toLowerCase().includes(searchLower) ||
        subject.toLowerCase().includes(searchLower) ||
        date.toLowerCase().includes(searchLower)
      )
    })
  }, [examData, search])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!Array.isArray(examData)) return { total: 0, upcoming: 0, completed: 0 }
    
    const now = new Date()
    return {
      total: examData.length,
      upcoming: examData.filter(e => new Date(e.exam_date || e.date) > now).length,
      completed: examData.filter(e => new Date(e.exam_date || e.date) <= now).length,
    }
  }, [examData])

  const columns = useMemo(() => [
    {
      accessorKey: "exam_group",
      header: "Exam Group",
      cell: ({ row }) => {
        const examGroup = row.original.exam_group || row.original.exam_name || row.original.name
        return <span className="font-medium">{examGroup || '—'}</span>
      },
    },
    {
      accessorKey: "subject_name",
      header: "Subject",
      cell: ({ row }) => {
        const subject = row.original.subject_name || row.original.subject
        return <span className="text-sm font-medium">{subject || '—'}</span>
      },
    },
    {
      accessorKey: "class_name",
      header: "Class",
      cell: ({ row }) => {
        const className = row.original.class_name || row.original.class
        return <span className="text-sm">{className || '—'}</span>
      },
    },
    {
      accessorKey: "date",
      header: "Exam Date",
      cell: ({ row }) => {
        const date = row.original.date || row.original.exam_date
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{date ? formatDate(date) : '—'}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "start_time",
      header: "Start",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.start_time || '—'}</span>
      ),
    },
    {
      accessorKey: "end_time",
      header: "End",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.end_time || '—'}</span>
      ),
    },
    {
      accessorKey: "room",
      header: "Room",
      cell: ({ row }) => {
        const room = row.original.room || row.original.room_no
        return <span className="text-sm font-medium">{room || '—'}</span>
      },
    },
  ], [])

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

  if (examLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Examinations' }, { label: 'Exam Schedule' }]} />
        <PageHeader
          title="Exam Schedule"
          description="View upcoming exams."
          icon={FileText}
        />
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Examinations' }, { label: 'Exam Schedule' }]} />
      <PageHeader
        title="Exam Schedule"
        description="View your upcoming examinations."
        icon={FileText}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Exams"
          value={stats.total}
          icon={FileText}
          accent="primary"
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={Calendar}
          accent="success"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          accent="info"
        />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by exam name or subject..." className="max-w-sm" />

      {filteredExams.length === 0 ? (
        <NoData 
          title={search ? "No Results Found" : "No Exam Schedule"} 
          description={search ? "Try adjusting your search terms." : "Exam schedule will be published here when available."} 
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredExams}
        />
      )}
    </div>
  )
}
