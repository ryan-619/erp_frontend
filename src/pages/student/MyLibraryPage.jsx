import { useMemo, useState } from 'react'
import { BookOpen, Library as LibraryIcon, CircleCheck as CheckCircle2, CircleX, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { libraryService } from '@/services/library.service'
import { formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

const STATUS_STYLES = {
  issued: 'bg-primary/10 text-primary border-primary/20',
  returned: 'bg-success/10 text-success border-success/20',
}

function IssueStatusPill({ status }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', STATUS_STYLES[status] || STATUS_STYLES.issued)}>
      {status}
    </span>
  )
}

export default function MyLibraryPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: issueReturns, isLoading } = useAsyncData(() => libraryService.getIssueReturns(), [])
  const { data: books } = useAsyncData(() => libraryService.getBookList(), [])

  const rows = issueReturns || []
  const allBooks = books || []

  // Filter to only show this student's issued books
  const studentIssueReturns = useMemo(() => rows.filter((r) => {
    return r.member_type === 'student' && r.member_id === studentId
  }), [rows, studentId])

  const filtered = useMemo(() => studentIssueReturns.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesStatus
  }), [studentIssueReturns, statusFilter])

  const stats = useMemo(() => ({
    total: studentIssueReturns.length,
    issued: studentIssueReturns.filter((r) => r.status === 'issued').length,
    returned: studentIssueReturns.filter((r) => r.status === 'returned').length,
  }), [studentIssueReturns])

  const columns = useMemo(() => [
    {
      accessorKey: 'book_id',
      header: 'Book',
      cell: ({ row }) => {
        const book = allBooks.find(b => b._id === row.original.book_id)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{book?.title || 'Unknown'}</span>
              <span className="text-xs text-muted-foreground font-mono">{book?.isbn || '—'}</span>
            </div>
          </div>
        )
      },
    },
    { accessorKey: 'issue_date', header: 'Issue Date', cell: ({ row }) => formatDate(row.original.issue_date) },
    { accessorKey: 'return_date', header: 'Return Date', cell: ({ row }) => row.original.return_date ? formatDate(row.original.return_date) : '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <IssueStatusPill status={row.original.status} /> },
  ], [allBooks])

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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Library' }, { label: 'My Library' }]} />
      <PageHeader
        title="My Library"
        description="View your borrowed books and return status."
        icon={LibraryIcon}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Borrowed" value={stats.total} icon={LibraryIcon} accent="primary" />
        <StatCard label="Currently Issued" value={stats.issued} icon={BookOpen} accent="chart2" />
        <StatCard label="Returned" value={stats.returned} icon={CheckCircle2} accent="success" />
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <span className="text-xs font-medium">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-9 mt-1 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={4} />
      ) : studentIssueReturns.length === 0 ? (
        <NoData title="No Library Records" description="You haven't borrowed any books yet." />
      ) : filtered.length === 0 ? (
        <NoData title="No Results Found" description="Try selecting a different status." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
