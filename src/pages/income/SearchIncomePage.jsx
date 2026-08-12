// ====================================================================
// Module: Income
// Page: Search Income
//
// Purpose:
// Search and filter income records.
//
// Data Source:
// income.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Search, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { incomeService } from '@/services/income.service'
import { formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'income_head_name', label: 'Income Head' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'note', label: 'Note' },
]

export default function SearchIncomePage() {
  const [searchParams, setSearchParams] = useState({ startDate: '', endDate: '', incomeHeadId: '' })
  const { data: results, isLoading, refetch } = useAsyncData(() => incomeService.searchIncomes(searchParams), [])
  const { data: heads, isLoading: headsLoading } = useAsyncData(() => incomeService.getIncomeHeads(), [])

  const rows = Array.isArray(results) ? results : []
  const allHeads = heads || []

  const stats = useMemo(() => ({
    total: rows.length,
    totalAmount: rows.reduce((sum, r) => sum + (r.amount || 0), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'income_head_id',
      header: 'Income Head',
      cell: ({ row }) => {
        const head = allHeads.find(h => h._id === row.original.income_head_id)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="font-medium">{head?.income_head_name || 'Unknown'}</span>
          </div>
        )
      },
    },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `₹${(row.original.amount || 0).toLocaleString()}` },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => row.original.date ? formatDate(row.original.date) : '—' },
    { accessorKey: 'note', header: 'Note', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.note || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allHeads])

  const handleSearch = () => {
    refetch()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Income' }, { label: 'Search Income' }]} />
      <PageHeader
        title="Search Income"
        description="Search and filter income records."
        icon={Search}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Records" value={stats.total} icon={DollarSign} accent="primary" />
        <StatCard label="Total Amount" value={`₹${stats.totalAmount.toLocaleString()}`} icon={DollarSign} accent="success" />
      </div>

      <FilterBar>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input 
              id="startDate" 
              type="date" 
              value={searchParams.startDate} 
              onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })} 
              className="w-40"
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input 
              id="endDate" 
              type="date" 
              value={searchParams.endDate} 
              onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })} 
              className="w-40"
            />
          </div>
          <div>
            <Label htmlFor="incomeHeadId">Income Head</Label>
            <select 
              id="incomeHeadId" 
              value={searchParams.incomeHeadId} 
              onChange={(e) => setSearchParams({ ...searchParams, incomeHeadId: e.target.value })} 
              disabled={headsLoading}
              className="w-48 h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">All Heads</option>
              {allHeads.map((h) => (
                <option key={h._id} value={h._id}>{h.income_head_name || 'Unnamed'}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleSearch} className="mt-6">
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={rows.map(r => ({
              ...r,
              income_head_name: allHeads.find(h => h._id === r.income_head_id)?.income_head_name || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="income-search" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No results found" description="Adjust your search criteria and try again." />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}
    </div>
  )
}
