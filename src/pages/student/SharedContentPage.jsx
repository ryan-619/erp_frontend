import { useMemo, useState } from 'react'
import { Download, Share2, FileText } from 'lucide-react'
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
import { downloadCenterService } from '@/services/downloadCenter.service'
import { academicsService } from '@/services/academics.service'
import { studentPortalService } from '@/services/studentPortal.service'
import { formatDate } from '@/utils/format'

export default function SharedContentPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  const { data: shareLists, isLoading } = useAsyncData(() => downloadCenterService.getShareLists(), [])
  const { data: contents } = useAsyncData(() => downloadCenterService.getContents(), [])
  const { data: classes } = useAsyncData(() => academicsService.classes(), [])
  const { data: studentProfile } = useAsyncData(() => studentId ? studentPortalService.getMyProfile(studentId) : Promise.resolve(null), [studentId])

  const rows = shareLists || []
  const allContents = contents || []
  const allClasses = classes || []

  // Filter share lists by student's class
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
      const content = allContents.find(c => c._id === r.content_id)
      return !q || 
        (content?.title || '').toLowerCase().includes(q) ||
        (r.note || '').toLowerCase().includes(q)
    })
  }, [rows, search, allContents, allClasses, studentProfile])

  const stats = useMemo(() => ({
    total: filtered.length,
  }), [filtered])

  const columns = useMemo(() => [
    {
      accessorKey: 'content_id',
      header: 'Content',
      cell: ({ row }) => {
        const content = allContents.find(c => c._id === row.original.content_id)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1 max-w-xs">{content?.title || 'Unknown'}</span>
              {content?.file_url && (
                <a 
                  href={content.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> Download
                </a>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'class_id',
      header: 'Class',
      cell: ({ row }) => {
        const cls = allClasses.find(c => c._id === row.original.class_id)
        return <Badge variant="outline">{cls?.class_name || 'Unknown'}</Badge>
      },
    },
    { accessorKey: 'shared_date', header: 'Shared Date', cell: ({ row }) => formatDate(row.original.shared_date) },
    { accessorKey: 'note', header: 'Note', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.note || '—'}</span> },
  ], [allContents, allClasses])

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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Download Center' }, { label: 'Shared Content' }]} />
      <PageHeader
        title="Shared Content"
        description="View content shared with your class."
        icon={Download}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Shared" value={stats.total} icon={Share2} accent="primary" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by content title or note…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No Shared Content" description="No content has been shared with your class yet." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
