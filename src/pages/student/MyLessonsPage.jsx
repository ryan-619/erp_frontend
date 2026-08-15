import { useMemo, useState } from 'react'
import { BookOpen } from 'lucide-react'
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
import { studentPortalService } from '@/services/studentPortal.service'
import { formatDate } from '@/utils/format'

export default function MyLessonsPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  const { data: lessons, isLoading } = useAsyncData(() => lessonService.getLessons(), [])
  const { data: subjects } = useAsyncData(() => academicsService.subjects(), [])
  const { data: classes } = useAsyncData(() => academicsService.classes(), [])
  const { data: studentProfile } = useAsyncData(() => studentId ? studentPortalService.getMyProfile(studentId) : Promise.resolve(null), [studentId])

  const rows = lessons || []
  const allSubjects = subjects || []
  const allClasses = classes || []

  // Filter lessons by student's class
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
      const subject = allSubjects.find(s => s._id === r.subject_id)
      return !q || 
        (r.lesson_title || '').toLowerCase().includes(q) ||
        (subject?.subject_name || '').toLowerCase().includes(q)
    })
  }, [rows, search, allSubjects, allClasses, studentProfile])

  const stats = useMemo(() => ({
    total: filtered.length,
    totalTopics: filtered.reduce((sum, r) => sum + (r.topic_count || 0), 0),
  }), [filtered])

  const columns = useMemo(() => [
    {
      accessorKey: 'lesson_title',
      header: 'Lesson',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1 max-w-xs">{row.original.lesson_title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.topic_count || 0} topics</span>
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
    { accessorKey: 'topic_count', header: 'Topics', cell: ({ row }) => `${row.original.topic_count || 0}` },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Lesson Plan' }, { label: 'My Lessons' }]} />
      <PageHeader
        title="My Lessons"
        description="View lessons for your class."
        icon={BookOpen}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Lessons" value={stats.total} icon={BookOpen} accent="primary" />
        <StatCard label="Total Topics" value={stats.totalTopics} icon={BookOpen} accent="success" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by lesson or subject…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No Lessons Found" description="No lessons found for your class." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
