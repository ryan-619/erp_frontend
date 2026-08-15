import { useMemo } from 'react'
import { IndianRupee, CircleAlert as AlertCircle, Download } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentPortalService } from '@/services/studentPortal.service'
import { formatCurrency } from '@/utils/format'

export default function DueFeesPage() {
  const { user, role } = useAuth()
  const studentId = user?.id

  // Fetch due fees for this student
  const { data: dueFeesData, isLoading } = useAsyncData(
    () => studentId ? studentPortalService.getMyDueFees(studentId) : Promise.resolve(null),
    [studentId]
  )

  const rows = useMemo(() => {
    if (Array.isArray(dueFeesData)) return dueFeesData
    if (Array.isArray(dueFeesData?.data)) return dueFeesData.data
    return []
  }, [dueFeesData])

  const stats = useMemo(
    () => ({
      total: rows.length,
      due: rows.reduce((a, b) => a + (b.due_amount || 0), 0),
      paid: rows.reduce((a, b) => a + (b.paid_amount || 0), 0),
      totalFees: rows.reduce((a, b) => a + (b.total_fees || 0), 0),
    }),
    [rows]
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Student',
        cell: ({ row }) => {
          const name = row.original.name
          if (typeof name === 'object' && name !== null) {
            return `${name.first || ''} ${name.last || ''}`.trim() || 'N/A'
          }
          return name || 'N/A'
        },
      },
      {
        accessorKey: 'roll_number',
        header: 'Roll No',
        cell: ({ row }) => row.original.roll_number || '—',
      },
      {
        accessorKey: 'section',
        header: 'Section',
        cell: ({ row }) => row.original.section || '—',
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
          <span className={`font-semibold ${row.original.due_amount > 0 ? 'text-destructive' : 'text-green-600'}`}>
            {formatCurrency(row.original.due_amount || 0)}
          </span>
        ),
      },
    ],
    []
  )

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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Fees' }, { label: 'Due Fees' }]} />
      <PageHeader
        title="Due Fees"
        description="View your pending fee payments."
        icon={IndianRupee}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Fees" value={formatCurrency(stats.totalFees)} icon={IndianRupee} accent="primary" />
        <StatCard label="Paid" value={formatCurrency(stats.paid)} icon={Download} accent="success" />
        <StatCard label="Due" value={formatCurrency(stats.due)} icon={AlertCircle} accent="destructive" />
        <StatCard label="Pending Items" value={stats.total} icon={AlertCircle} accent="warning" />
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No Due Fees" description="You have no pending fee payments." />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
        />
      )}
    </div>
  )
}
