import { useMemo, useState } from 'react'
import { BookOpen, Calendar } from 'lucide-react'
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
import { lessonService } from '@/services/lesson.service'
import { academicsService } from '@/services/academics.service'
import { hrService } from '@/services/hr.service'
import { studentPortalService } from '@/services/studentPortal.service'
import { formatDate } from '@/utils/format'

export default function MyLessonPlansPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  const { data: lessonPlans, isLoading } = useAsyncData(() => lessonService.getLessonPlans(), [])
  const { data: teachers } = useAsyncData(() => hrService.getStaff(), [])
  const { data: subjects } = useAsyncData(() => academicsService.subjects(), [])
  const { data: classes } = useAsyncData(() => academicsService.classes(), [])
  const { data: studentProfile } = useAsyncData(() => studentId ? studentPortalService.getMyProfile(studentId) : Promise.resolve(null), [studentId])

  const rows = lessonPlans || []
  const allTeachers = teachers || []
  const allSubjects = subjects || []
  const allClasses = classes || []

  // Filter lesson plans by student's class
  const filtered = useMemo(() => {
    if (!studentProfile) return []
    const studentClass = studentProfile.class_name || studentProfile.class
    if (!studentClass) return []

    const filteredByClass = rows.filter((r) => {
      const cls = allClasses.find(c => c._id === r.class_id)
      const className = cls?.class_name || ''
      // Match class exactly or by number
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
      const teacher = allTeachers.find(t => t._id === r.teacher_id)
      const subject = allSubjects.find(s => s._id === r.subject_id)
      const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
      return !q || 
        teacherName.toLowerCase().includes(q) ||
        (subject?.subject_name || '').toLowerCase().includes(q) ||
        (r.objectives || '').toLowerCase().includes(q)
    })
  }, [rows, search, allTeachers, allSubjects, allClasses, studentProfile])

  const stats = useMemo(() => ({
    total: filtered.length,
  }), [filtered])

  const columns = useMemo(() => [
    {
      accessorKey: 'teacher_id',
      header: 'Teacher',
      cell: ({ row }) => {
        const teacher = allTeachers.find(t => t._id === row.original.teacher_id)
        const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-medium">{teacherName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'subject_id',
      header: 'Subject',
      cell: ({ row }) => {
        const subject = allSubjects.find(s => s._id === row.original.subject_id)
        return <Badge variant="outline">{subject?.subject_name || 'Unknown'}</Badge>
      },
    },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: 'objectives', header: 'Objectives', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.objectives || '—'}</span> },
    { accessorKey: 'methodology', header: 'Methodology', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.methodology || '—'}</span> },
  ], [allTeachers, allSubjects])

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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Lesson Plan' }, { label: 'My Lesson Plans' }]} />
      <PageHeader
        title="My Lesson Plans"
        description="View lesson plans for your class."
        icon={BookOpen}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Lesson Plans" value={stats.total} icon={Calendar} accent="primary" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by teacher, subject, or objectives…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No Lesson Plans Found" description="No lesson plans found for your class." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
