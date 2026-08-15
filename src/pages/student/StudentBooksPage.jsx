import { useMemo, useState } from 'react'
import { BookOpen, Library as LibraryIcon, CircleCheck as CheckCircle2, CircleX } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { libraryService } from '@/services/library.service'
import { formatDate } from '@/utils/format'

export default function StudentBooksPage() {
  const { role } = useAuth()
  const [search, setSearch] = useState('')

  const { data: books, isLoading } = useAsyncData(() => libraryService.getBookList(), [])

  const rows = books || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.title || '').toLowerCase().includes(q) ||
      (r.author || '').toLowerCase().includes(q) ||
      (r.isbn || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    totalTitles: rows.length,
    totalCopies: rows.reduce((s, r) => s + (r.quantity || 0), 0),
    available: rows.reduce((s, r) => s + (r.available || 0), 0),
    issued: rows.reduce((s, r) => s + ((r.quantity || 0) - (r.available || 0)), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Book',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">{row.original.author || '—'}</span>
          </div>
        </div>
      ),
    },
    { accessorKey: 'isbn', header: 'ISBN', cell: ({ row }) => row.original.isbn || '—' },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => row.original.category || '—' },
    { accessorKey: 'publisher', header: 'Publisher', cell: ({ row }) => row.original.publisher || '—' },
    { accessorKey: 'quantity', header: 'Total Copies', cell: ({ row }) => row.original.quantity || 0 },
    { accessorKey: 'available', header: 'Available', cell: ({ row }) => (
      <span className={`font-semibold ${row.original.available > 0 ? 'text-green-600' : 'text-destructive'}`}>
        {row.original.available || 0}
      </span>
    ) },
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Library' }, { label: 'Books' }]} />
      <PageHeader
        title="Library Books"
        description="Browse available library books."
        icon={LibraryIcon}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Titles" value={stats.totalTitles} icon={LibraryIcon} accent="primary" />
        <StatCard label="Total Copies" value={stats.totalCopies} icon={BookOpen} accent="chart2" />
        <StatCard label="Available" value={stats.available} icon={CheckCircle2} accent="success" />
        <StatCard label="Issued" value={stats.issued} icon={CircleX} accent="destructive" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by title, author, or ISBN…" className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No books found" description="Try a different search term." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}
    </div>
  )
}
