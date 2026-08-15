import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
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

export default function MyTopicsPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  const { data: topics, isLoading } = useAsyncData(() => lessonService.getTopics(), [])
  const { data: lessons } = useAsyncData(() => lessonService.getLessons(), [])
  const { data: classes } = useAsyncData(() => academicsService.classes(), [])
  const { data: studentProfile } = useAsyncData(() => studentId ? studentPortalService.getMyProfile(studentId) : Promise.resolve(null), [studentId])

  const rows = topics || []
  const allLessons = lessons || []
  const allClasses = classes || []

  // Filter topics by student's class (through lesson)
  const filtered = useMemo(() => {
    if (!studentProfile) return []
    const studentClass = studentProfile.class_name || studentProfile.class
    if (!studentClass) return []

    // Get lessons for student's class
    const studentLessons = allLessons.filter((l) => {
      const cls = allClasses.find(c => c._id === l.class_id)
      const className = cls?.class_name || ''
      const normalizedStudentClass = studentClass.replace(/^Class\s*/i, '').trim()
      const normalizedClassName = className.replace(/^Class\s*/i, '').trim()
      return normalizedStudentClass === normalizedClassName || 
             className.includes(`Class ${studentClass}`) ||
             studentClass.includes(className)
    })

    const studentLessonIds = new Set(studentLessons.map(l => l._id))

    // Filter topics by lesson IDs
    const filteredByClass = rows.filter((r) => studentLessonIds.has(r.lesson_id))

    // Filter by search
    if (!search.trim()) return filteredByClass

    const q = search.toLowerCase()
    return filteredByClass.filter((r) => {
      const lesson = allLessons.find(l => l._id === r.lesson_id)
      return !q || 
        (r.topic_title || '').toLowerCase().includes(q) ||
        (lesson?.lesson_title || '').toLowerCase().includes(q)
    })
  }, [rows, search, allLessons, allClasses, studentProfile])

  const stats = useMemo(() => ({
    total: filtered.length,
  }), [filtered])

  const columns = useMemo(() => [
    {
      accessorKey: 'topic_title',
      header: 'Topic',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1 max-w-xs">{row.original.topic_title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.duration || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'lesson_id',
      header: 'Lesson',
      cell: ({ row }) => {
        const lesson = allLessons.find(l => l._id === row.original.lesson_id)
        return <Badge variant="outline">{lesson?.lesson_title || 'Unknown'}</Badge>
      },
    },
    { accessorKey: 'duration', header: 'Duration', cell: ({ row }) => row.original.duration || '—' },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.description || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allLessons])

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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Lesson Plan' }, { label: 'My Topics' }]} />
      <PageHeader
        title="My Topics"
        description="View topics for your lessons."
        icon={FileText}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Topics" value={stats.total} icon={FileText} accent="primary" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by topic or lesson…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No Topics Found" description="No topics found for your lessons." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
