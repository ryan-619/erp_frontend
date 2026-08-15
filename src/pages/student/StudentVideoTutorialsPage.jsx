import { useMemo, useState } from 'react'
import { Video, Play, Clock } from 'lucide-react'
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
import { downloadCenterService } from '@/services/downloadCenter.service'
import { formatDate } from '@/utils/format'

export default function StudentVideoTutorialsPage() {
  const { user, role } = useAuth()
  const [search, setSearch] = useState('')

  const { data: videos, isLoading } = useAsyncData(() => downloadCenterService.getVideoTutorials(), [])

  const rows = videos || []

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return rows

    const q = search.toLowerCase()
    return rows.filter((r) => {
      return !q || 
        (r.title || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q)
    })
  }, [rows, search])

  const stats = useMemo(() => ({
    total: filtered.length,
  }), [filtered])

  const columns = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Video',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Video className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1 max-w-xs">{row.original.title || 'Untitled'}</span>
            {row.original.video_url && (
              <a 
                href={row.original.video_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Play className="h-3 w-3" /> Watch
              </a>
            )}
          </div>
        </div>
      ),
    },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <Badge variant="outline">{row.original.category || 'General'}</Badge> },
    { accessorKey: 'duration', header: 'Duration', cell: ({ row }) => (
      <div className="flex items-center gap-1 text-sm">
        <Clock className="h-3 w-3 text-muted-foreground" />
        {row.original.duration || '—'}
      </div>
    )},
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
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

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Download Center' }, { label: 'Video Tutorials' }]} />
      <PageHeader
        title="Video Tutorials"
        description="View educational video tutorials."
        icon={Video}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Videos" value={stats.total} icon={Video} accent="primary" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by title or category…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No Videos Found" description="No video tutorials available." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
