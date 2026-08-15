import { useMemo, useState } from 'react'
import { IndianRupee, Eye, CreditCard, Receipt, Hash, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentPortalService } from '@/services/studentPortal.service'
import { feesService } from '@/services/fees.service'
import { formatCurrency, formatDate } from '@/utils/format'

export default function PaymentHistoryPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [viewRow, setViewRow] = useState(null)
  const [mode, setMode] = useState('all')

  // Fetch payment history for this student
  const { data: paymentsData, isLoading } = useAsyncData(
    () => studentId ? studentPortalService.getMyPaymentHistory(studentId) : Promise.resolve(null),
    [studentId]
  )

  // Fetch fee masters for lookup
  const { data: mastersRes } = useAsyncData(() => feesService.getFeesMaster(), [])
  const { data: groupsRes } = useAsyncData(() => feesService.getFeesGroups(), [])

  const rows = useMemo(() => {
    if (Array.isArray(paymentsData)) return paymentsData
    if (Array.isArray(paymentsData?.data)) return paymentsData.data
    return []
  }, [paymentsData])

  const masters = useMemo(() => {
    if (Array.isArray(mastersRes)) return mastersRes
    if (Array.isArray(mastersRes?.data)) return mastersRes.data
    return []
  }, [mastersRes])

  const groups = useMemo(() => {
    if (Array.isArray(groupsRes)) return groupsRes
    if (Array.isArray(groupsRes?.data)) return groupsRes.data
    return []
  }, [groupsRes])

  const masterMap = useMemo(() => {
    const map = {}
    masters.forEach((master) => {
      const id = master._id || master.id
      map[id] = master
    })
    return map
  }, [masters])

  const groupMap = useMemo(() => {
    const map = {}
    groups.forEach((group) => {
      const id = group._id || group.id
      map[id] = group
    })
    return map
  }, [groups])

  const getFeeMasterDisplayName = (feesMasterId) => {
    if (!feesMasterId) return 'N/A'
    const master = typeof feesMasterId === 'object' ? feesMasterId : masterMap[feesMasterId]
    if (!master) return String(feesMasterId)

    const groupId = master.fees_group_id?._id || master.fees_group_id
    const group = groupMap[groupId]
    if (group?.fees_group_name) return group.fees_group_name
    if (master.name) return master.name
    return String(groupId || feesMasterId)
  }

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const currentMode = (r.payment_mode || r.mode || '').toLowerCase()
        const matchMode = mode === 'all' || currentMode === mode.toLowerCase()
        return matchMode
      }),
    [rows, mode]
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      collected: rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
      cash: rows.filter((r) => (r.payment_mode || r.mode)?.toLowerCase() === 'cash').length,
      online: rows.filter((r) => (r.payment_mode || r.mode)?.toLowerCase() !== 'cash').length,
    }),
    [rows]
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'receipt_no',
        header: 'Receipt',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">
            {row.original.receipt_no || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'fees_master_id',
        header: 'Fee Type',
        cell: ({ row }) => getFeeMasterDisplayName(row.original.fees_master_id),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: 'payment_mode',
        header: 'Mode',
        cell: ({ row }) => (
          <span className="capitalize font-medium">
            {row.original.payment_mode || row.original.mode || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'transaction_id',
        header: 'Transaction ID',
        cell: ({ row }) => row.original.transaction_id || 'N/A',
      },
      {
        accessorKey: 'payment_date',
        header: 'Payment Date',
        cell: ({ row }) => formatDate(row.original.payment_date || row.original.date),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewRow(row.original)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
        ),
      },
    ],
    [masterMap, groupMap]
  )

  const studentDetail = typeof viewRow?.student_id === 'object' ? viewRow.student_id : null
  const studentName = studentDetail
    ? `${studentDetail.name?.first || ''} ${studentDetail.name?.last || ''}`.trim()
    : viewRow?.student_name || viewRow?.student_id || 'N/A'
  const rollNumber = studentDetail?.roll_number || viewRow?.roll_number || 'N/A'
  const sectionName =
    studentDetail?.section_id?.name ||
    studentDetail?.section ||
    viewRow?.section ||
    'N/A'

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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Fees' }, { label: 'Payment History' }]} />
      <PageHeader
        title="Payment History"
        description="View your fee payment history."
        icon={IndianRupee}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Payments" value={stats.total} icon={Receipt} accent="primary" />
        <StatCard label="Total Paid" value={formatCurrency(stats.collected)} icon={IndianRupee} accent="success" />
        <StatCard label="Cash Payments" value={stats.cash} icon={Receipt} accent="chart2" />
        <StatCard label="Online / Digital" value={stats.online} icon={CreditCard} accent="chart3" />
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <span className="text-xs font-medium">Payment Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full h-9 mt-1 rounded-md border border-input bg-background px-3 text-sm capitalize"
          >
            <option value="all">All modes</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="cheque">Cheque</option>
            <option value="card">Card</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={7} />
      ) : rows.length === 0 ? (
        <NoData title="No Payment History" description="You have no payment records yet." />
      ) : filtered.length === 0 ? (
        <NoData title="No Results Found" description="Try selecting a different payment mode." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
        />
      )}

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Payment Details"
        description={viewRow?.receipt_no || 'View payment record details'}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Hash className="h-3.5 w-3.5" /> Receipt No
                </div>
                <p className="text-sm font-semibold font-mono">{viewRow.receipt_no || 'N/A'}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <User className="h-3.5 w-3.5" /> Student
                </div>
                <p className="text-sm font-semibold">{studentName}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Hash className="h-3.5 w-3.5" /> Roll Number
                </div>
                <p className="text-sm font-semibold">{rollNumber}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <User className="h-3.5 w-3.5" /> Section
                </div>
                <p className="text-sm font-semibold">{sectionName}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Receipt className="h-3.5 w-3.5" /> Fee Type
                </div>
                <p className="text-sm font-semibold">{getFeeMasterDisplayName(viewRow.fees_master_id)}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <IndianRupee className="h-3.5 w-3.5" /> Amount
                </div>
                <p className="text-base font-bold text-primary">{formatCurrency(viewRow.amount)}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <CreditCard className="h-3.5 w-3.5" /> Payment Mode
                </div>
                <p className="text-sm font-semibold capitalize">{viewRow.payment_mode || viewRow.mode || 'N/A'}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Hash className="h-3.5 w-3.5" /> Transaction ID
                </div>
                <p className="text-sm font-semibold">{viewRow.transaction_id || 'N/A'}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5" /> Payment Date
                </div>
                <p className="text-sm font-semibold">{formatDate(viewRow.payment_date || viewRow.date)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
