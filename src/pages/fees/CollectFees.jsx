// ====================================================================
// Module: Fees
// Page: Collect Fees
//
// Purpose:
// Manage fee collections, view payment records, and collect fees.
//
// Data Source:
// fees.service.js, student.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Eye,
  IndianRupee,
  CreditCard,
  Receipt,
  User,
  Calendar,
  Hash,
  FileSpreadsheet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'
import { ExportButtons } from '@/components/ExportButtons'
import { ImportButton } from '@/components/ImportButton'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { useAsyncData } from '@/hooks/useAsyncData'
import { feesService } from '@/services/fees.service'
import { studentService } from '@/services/student.service'
import { formatCurrency, formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

export default function CollectFeesPage() {
  const { toast } = useToast()
  
  // 1. Fetch collected fees, students, fees master, and fee groups
  const { data: collectionRes, isLoading, refetch } = useAsyncData(() => feesService.getFeesCollection(), [])
  const { data: studentsRes } = useAsyncData(() => studentService.list(), [])
  const { data: mastersRes } = useAsyncData(() => feesService.getFeesMaster(), [])
  const { data: groupsRes } = useAsyncData(() => feesService.getFeesGroups(), [])

  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  // Safe array normalization
  const rows = useMemo(() => {
    if (Array.isArray(collectionRes)) return collectionRes
    if (Array.isArray(collectionRes?.data)) return collectionRes.data
    return []
  }, [collectionRes])

  const students = useMemo(() => {
    if (Array.isArray(studentsRes)) return studentsRes
    if (Array.isArray(studentsRes?.data)) return studentsRes.data
    return []
  }, [studentsRes])

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

  // Lookup Map 1: Students
  const studentMap = useMemo(() => {
    const map = {}
    students.forEach((student) => {
      const id = student._id || student.id
      map[id] = student
    })
    return map
  }, [students])

  // Lookup Map 2: Fees Master
  const masterMap = useMemo(() => {
    const map = {}
    masters.forEach((master) => {
      const id = master._id || master.id
      map[id] = master
    })
    return map
  }, [masters])

  // Lookup Map 3: Fee Groups
  const groupMap = useMemo(() => {
    const map = {}
    groups.forEach((group) => {
      const id = group._id || group.id
      map[id] = group
    })
    return map
  }, [groups])

  // Helper: Format Student Full Name
  const getStudentDisplayName = (studentId) => {
    const student = studentMap[studentId]
    if (!student) return studentId || 'N/A'

    if (student.name?.first || student.name?.last) {
      return `${student.name.first || ''} ${student.name.last || ''}`.trim()
    }
    if (typeof student.name === 'string') return student.name
    return student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || studentId
  }

  // Helper: Resolve Fees Master ID -> Fee Group Name
  const getFeeMasterDisplayName = (feesMasterId) => {
    const master = masterMap[feesMasterId]
    if (!master) return feesMasterId || 'N/A'

    const group = groupMap[master.fees_group_id]
    if (group?.fees_group_name) return group.fees_group_name
    if (master.name) return master.name
    return master.fees_group_id || feesMasterId
  }

  // Filtered rows for Search
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter((r) => {
      const studentName = getStudentDisplayName(r.student_id).toLowerCase()
      const feeMasterName = getFeeMasterDisplayName(r.fees_master_id).toLowerCase()
      const transactionId = (r.transaction_id || '').toLowerCase()
      const paymentMode = (r.payment_mode || '').toLowerCase()

      return (
        !q ||
        studentName.includes(q) ||
        feeMasterName.includes(q) ||
        transactionId.includes(q) ||
        paymentMode.includes(q) ||
        String(r.amount).includes(q)
      )
    })
  }, [rows, search, studentMap, masterMap, groupMap])

  // Export dataset
  const exportData = useMemo(() => {
    return filtered.map((r) => ({
      ...r,
      student_name: getStudentDisplayName(r.student_id),
      fees_master_name: getFeeMasterDisplayName(r.fees_master_id),
      payment_date: formatDate(r.payment_date),
    }))
  }, [filtered, studentMap, masterMap, groupMap])

  // Dynamic statistics
  const stats = useMemo(() => {
    const totalRecords = rows.length
    const totalAmount = rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
    const cashCount = rows.filter((r) => r.payment_mode?.toLowerCase() === 'cash').length
    const onlineCount = rows.filter((r) => r.payment_mode?.toLowerCase() !== 'cash').length

    return { totalRecords, totalAmount, cashCount, onlineCount }
  }, [rows])

  // Columns definition
  const columns = useMemo(
    () => [
      {
        accessorKey: 'student_id',
        header: 'Student',
        cell: ({ row }) => (
          <button
            className="text-left font-medium hover:underline flex items-center gap-2"
            onClick={() => setViewRow(row.original)}
          >
            <User className="h-4 w-4 text-muted-foreground" />
            {getStudentDisplayName(row.original.student_id)}
          </button>
        ),
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
        header: 'Payment Mode',
        cell: ({ row }) => <span className="capitalize font-medium">{row.original.payment_mode || 'N/A'}</span>,
      },
      {
        accessorKey: 'transaction_id',
        header: 'Transaction ID',
        cell: ({ row }) => row.original.transaction_id || 'N/A',
      },
      {
        accessorKey: 'payment_date',
        header: 'Payment Date',
        cell: ({ row }) => formatDate(row.original.payment_date),
      },
    ],
    [studentMap, masterMap, groupMap]
  )

  const EXPORT_COLS = [
    { key: 'student_name', label: 'Student' },
    { key: 'fees_master_name', label: 'Fee Master' },
    { key: 'amount', label: 'Amount' },
    { key: 'payment_mode', label: 'Payment Mode' },
    { key: 'transaction_id', label: 'Transaction ID' },
    { key: 'payment_date', label: 'Payment Date' },
  ]

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Fees', to: '/fees/collect' }, { label: 'Collect Fees' }]} />

      <PageHeader
        title="Collect Fees"
        description="Manage fee collections, track transactions, and record payments."
        icon={Wallet}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Collect Payment
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Records" value={stats.totalRecords} icon={FileSpreadsheet} accent="primary" />
        <StatCard label="Total Amount" value={formatCurrency(stats.totalAmount)} icon={IndianRupee} accent="success" />
        <StatCard label="Cash Transactions" value={stats.cashCount} icon={Receipt} accent="chart2" />
        <StatCard label="Online / Digital" value={stats.onlineCount} icon={CreditCard} accent="chart3" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by student, fee master, transaction ID..."
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="collected-fees" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No fee collection records found" actionLabel="Collect Payment" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableExport
          exportFilename="collected-fees"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <CollectFeeDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Collect Fee Payment"
        students={students}
        masters={masters}
        groupMap={groupMap}
        getStudentDisplayName={getStudentDisplayName}
        getFeeMasterDisplayName={getFeeMasterDisplayName}
        onSubmit={async (p) => {
          await feesService.collectPayment(p)
          toast({ title: 'Payment collected successfully' })
          setAddOpen(false)
          refetch()
        }}
      />

      <CollectFeeDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Payment Record"
        initial={editRow}
        students={students}
        masters={masters}
        groupMap={groupMap}
        getStudentDisplayName={getStudentDisplayName}
        getFeeMasterDisplayName={getFeeMasterDisplayName}
        onSubmit={async (p) => {
          await feesService.updateCollectedFee(editRow._id, p)
          toast({ title: 'Payment record updated' })
          setEditRow(null)
          refetch()
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Fee Collection Details"
        description="View transaction details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <User className="h-3.5 w-3.5" /> Student
                </div>
                <p className="text-sm font-semibold">{getStudentDisplayName(viewRow.student_id)}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Receipt className="h-3.5 w-3.5" /> Fees Master
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
                <p className="text-sm font-semibold capitalize">{viewRow.payment_mode || 'N/A'}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Hash className="h-3.5 w-3.5" /> Transaction ID
                </div>
                <p className="text-sm font-semibold">{viewRow.transaction_id || 'N/A'}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5" /> Payment Date
                </div>
                <p className="text-sm font-semibold">{formatDate(viewRow.payment_date)}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5" /> Created Date
                </div>
                <p className="text-sm font-semibold">{formatDate(viewRow.createdAt)}</p>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={
          deleteRow
            ? `${getStudentDisplayName(deleteRow.student_id)} - ${formatCurrency(deleteRow.amount)}`
            : 'Fee Record'
        }
        onConfirm={async () => {
          await feesService.deleteCollectedFee(deleteRow._id)
          toast({ title: 'Payment record deleted' })
          setDeleteRow(null)
          refetch()
        }}
      />
    </div>
  )
}

function CollectFeeDrawer({
  open,
  onOpenChange,
  title,
  initial,
  students = [],
  masters = [],
  getStudentDisplayName,
  getFeeMasterDisplayName,
  onSubmit,
}) {
  const safeStudents = students || []
  const safeMasters = masters || []

  const [form, setForm] = useState({
    student_id: initial?.student_id || '',
    fees_master_id: initial?.fees_master_id || '',
    amount: initial?.amount ?? '',
    payment_date: initial?.payment_date ? initial.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
    payment_mode: initial?.payment_mode || 'cash',
    transaction_id: initial?.transaction_id || '',
  })

  useEffect(() => {
    setForm({
      student_id: initial?.student_id || '',
      fees_master_id: initial?.fees_master_id || '',
      amount: initial?.amount ?? '',
      payment_date: initial?.payment_date ? initial.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      payment_mode: initial?.payment_mode || 'cash',
      transaction_id: initial?.transaction_id || '',
    })
  }, [initial, open])

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Enter collection details"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save' : 'Collect'}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Student <span className="text-destructive">*</span></Label>
            <select
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select Student</option>
              {safeStudents.map((s) => {
                const id = s._id || s.id
                return (
                  <option key={id} value={id}>
                    {getStudentDisplayName(id)}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Fees Master <span className="text-destructive">*</span></Label>
            <select
              value={form.fees_master_id}
              onChange={(e) => setForm((f) => ({ ...f, fees_master_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select Fees Master</option>
              {safeMasters.map((fm) => {
                const id = fm._id || fm.id
                return (
                  <option key={id} value={id}>
                    {getFeeMasterDisplayName(id)}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Amount <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              placeholder="e.g. 5000"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Payment Date <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Payment Mode <span className="text-destructive">*</span></Label>
            <select
              value={form.payment_mode}
              onChange={(e) => setForm((f) => ({ ...f, payment_mode: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Transaction ID</Label>
            <Input
              type="text"
              value={form.transaction_id}
              onChange={(e) => setForm((f) => ({ ...f, transaction_id: e.target.value }))}
              placeholder="e.g. TXN001"
            />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}