// ====================================================================
// Module: Fees
// Page: Search Fees Payment
//
// Purpose:
// Find and filter all fee payment records via keyword search.
//
// Data Source:
// fees.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Eye,
  Printer,
  IndianRupee,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  User,
  Calendar,
  Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { feesService } from '@/services/fees.service'
import { PAYMENT_MODES } from '@/constants/fees'
import { formatCurrency, formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'receipt_no', label: 'Receipt' },
  { key: 'student_name', label: 'Student' },
  { key: 'roll_number', label: 'Roll Number' },
  { key: 'fee_master_name', label: 'Fee Master' },
  { key: 'amount', label: 'Amount' },
  { key: 'payment_mode', label: 'Payment Mode' },
  { key: 'transaction_id', label: 'Transaction ID' },
  { key: 'payment_date', label: 'Payment Date' },
]

export default function SearchFeesPaymentPage() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState('all')
  const [viewRow, setViewRow] = useState(null)

  // Pre-fetch Fee Masters & Groups for lookup mappings
  const { data: mastersRes } = useAsyncData(() => feesService.getFeesMaster(), [])
  const { data: groupsRes } = useAsyncData(() => feesService.getFeesGroups(), [])

  // Keyword-triggered search request
  useEffect(() => {
    const keyword = search.trim()

    if (!keyword) {
      setData([])
      return
    }

    const fetchPayments = async () => {
      try {
        setIsLoading(true)
        const res = await feesService.getFeesPayments(keyword)
        setData(Array.isArray(res) ? res : res?.data || [])
      } catch (err) {
        console.error('Error fetching payments:', err)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [search])

  const rows = useMemo(() => {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    return []
  }, [data])

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
        const currentMode = (r.payment_mode || '').toLowerCase()
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

  const exportData = useMemo(() => {
    return filtered.map((r) => {
      const s = typeof r.student_id === 'object' ? r.student_id : null
      const studentName = s
        ? `${s.name?.first || ''} ${s.name?.last || ''}`.trim()
        : r.student_name || r.student_id || 'N/A'
      const rollNumber = s?.roll_number || r.roll_number || 'N/A'

      return {
        ...r,
        receipt_no: r.receipt_no || 'N/A',
        student_name: studentName,
        roll_number: rollNumber,
        fee_master_name: getFeeMasterDisplayName(r.fees_master_id),
        amount: r.amount,
        payment_mode: r.payment_mode || r.mode || 'N/A',
        transaction_id: r.transaction_id || 'N/A',
        payment_date: formatDate(r.payment_date || r.date),
      }
    })
  }, [filtered, masterMap, groupMap])

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
        accessorKey: 'student_id',
        header: 'Student',
        cell: ({ row }) => {
          const s = typeof row.original.student_id === 'object' ? row.original.student_id : null
          const name = s
            ? `${s.name?.first || ''} ${s.name?.last || ''}`.trim()
            : row.original.student_name || row.original.student_id || 'N/A'
          const roll = s?.roll_number || row.original.roll_number

          return (
            <div>
              <div className="font-medium">{name}</div>
              {roll && <div className="text-xs text-muted-foreground">{roll}</div>}
            </div>
          )
        },
      },
      {
        accessorKey: 'fees_master_id',
        header: 'Fees Master',
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
    ],
    [masterMap, groupMap]
  )

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Print', icon: Printer, onClick: () => window.print() },
  ]

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

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Fees', to: '/fees/collect' },
          { label: 'Search Fees Payment' },
        ]}
      />
      <PageHeader
        title="Search Fees Payment"
        description="Find and filter all fee payment records."
        icon={Search}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Payments" value={stats.total} icon={FileSpreadsheet} accent="primary" />
        <StatCard label="Total Collected" value={formatCurrency(stats.collected)} icon={IndianRupee} accent="success" />
        <StatCard label="Cash Payments" value={stats.cash} icon={Receipt} accent="chart2" />
        <StatCard label="Online / Digital" value={stats.online} icon={CreditCard} accent="chart3" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search receipt, student, roll no, or transaction..."
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="fees-payments" />
          <Select value={mode} onChange={setMode} options={PAYMENT_MODES} all="All modes" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={7} />
      ) : search.trim() === '' ? (
        <NoData title="Type a keyword to search payments" />
      ) : filtered.length === 0 ? (
        <NoData title="No payments found for this keyword" />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableExport
          exportFilename="fees-payments"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
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
                  <Receipt className="h-3.5 w-3.5" /> Fee Master
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

function Select({ value, onChange, options = [], all }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize"
    >
      <option value="all">{all}</option>
      {options.map((o) => {
        const val = typeof o === 'object' ? o.value || o.id : o
        const label = typeof o === 'object' ? o.label || o.name : o
        return (
          <option key={val} value={val}>
            {label}
          </option>
        )
      })}
    </select>
  )
}