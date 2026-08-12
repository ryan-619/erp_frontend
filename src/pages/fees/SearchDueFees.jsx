// ====================================================================
// Module: Fees
// Page: Search Due Fees
//
// Purpose:
// Track pending dues and send payment reminders.
//
// Data Source:
// fees.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { CircleAlert as AlertCircle, Bell, Download, Printer } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { feesService } from '@/services/fees.service'
import { formatCurrency } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'student_name', label: 'Student' },
  { key: 'roll_number', label: 'Roll No' },
  { key: 'section', label: 'Section' },
  { key: 'total_fees', label: 'Total Fees' },
  { key: 'paid_amount', label: 'Paid' },
  { key: 'due_amount', label: 'Due' },
]

export default function SearchDueFeesPage() {
  const { toast } = useToast()
  const { data, isLoading } = useAsyncData(() => feesService.getDueFees(), [])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const rows = useMemo(() => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    return []
  }, [data])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const name = `${r.name?.first || ''} ${r.name?.last || ''}`.trim().toLowerCase()
      const roll = (r.roll_number || '').toLowerCase()

      return (
        (!search ||
          name.includes(search.toLowerCase()) ||
          roll.includes(search.toLowerCase())) &&
        (status === 'all' || (status === 'Pending' && r.due_amount > 0))
      )
    })
  }, [rows, search, status])

  const stats = useMemo(
    () => ({
      total: rows.length,
      due: rows.reduce((a, b) => a + (b.due_amount || 0), 0),
      overdue: 0,
      partial: rows.filter((r) => r.paid_amount > 0 && r.due_amount > 0).length,
    }),
    [rows]
  )

  const exportData = useMemo(() => {
    return filtered.map((r) => ({
      ...r,
      student_name: `${r.name?.first || ''} ${r.name?.last || ''}`.trim() || 'N/A',
      roll_number: r.roll_number || 'N/A',
      section:
        typeof r.section === 'object' ? r.section?.name || 'N/A' : r.section || 'N/A',
      total_fees: r.total_fees || 0,
      paid_amount: r.paid_amount || 0,
      due_amount: r.due_amount || 0,
    }))
  }, [filtered])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Student',
        cell: ({ row }) =>
          `${row.original.name?.first || ''} ${row.original.name?.last || ''}`.trim() ||
          'N/A',
      },
      {
        accessorKey: 'roll_number',
        header: 'Roll No',
        cell: ({ row }) => row.original.roll_number || 'N/A',
      },
      {
        accessorKey: 'section',
        header: 'Section',
        cell: ({ row }) =>
          typeof row.original.section === 'object'
            ? row.original.section?.name || 'N/A'
            : row.original.section || 'N/A',
      },
      {
        accessorKey: 'total_fees',
        header: 'Total Fees',
        cell: ({ row }) => formatCurrency(row.original.total_fees || 0),
      },
      {
        accessorKey: 'paid_amount',
        header: 'Paid',
        cell: ({ row }) => formatCurrency(row.original.paid_amount || 0),
      },
      {
        accessorKey: 'due_amount',
        header: 'Due',
        cell: ({ row }) => (
          <span className="font-semibold text-destructive">
            {formatCurrency(row.original.due_amount || 0)}
          </span>
        ),
      },
    ],
    []
  )

  const rowActions = (r) => [
    {
      label: 'Reminder',
      icon: Bell,
      onClick: () =>
        toast({
          title: 'Reminder API not supported for individual students',
        }),
    },
    { label: 'Print', icon: Printer, onClick: () => window.print() },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Fees', to: '/fees/collect' },
          { label: 'Search Due Fees' },
        ]}
      />
      <PageHeader
        title="Search Due Fees"
        description="Track pending dues and send payment reminders."
        icon={AlertCircle}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Dues" value={stats.total} icon={AlertCircle} accent="warning" />
        <StatCard label="Amount Due" value={formatCurrency(stats.due)} icon={Download} accent="destructive" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertCircle} accent="destructive" />
        <StatCard label="Partial" value={stats.partial} icon={AlertCircle} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search student or roll no…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="due-fees" />
          <Select
            value={status}
            onChange={setStatus}
            options={['Pending']}
            all="All"
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No due fees found" />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableExport
          exportFilename="due-fees"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}
    </div>
  )
}

function Select({ value, onChange, options = [], all }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <option value="all">{all}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}