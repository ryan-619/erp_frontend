// ====================================================================
// Module: Fees
// Page: Offline Bank Payment
//
// Purpose:
// Review and record offline bank transfer submissions.
//
// Data Source:
// fees.service.js / student.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Landmark, Plus, Pencil, Trash2, Eye, DollarSign, Building2, Calendar } from 'lucide-react'
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
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { useOfflinePayments } from '@/hooks/useFees'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentService } from '@/services/student.service'
import { formatCurrency, formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'student_name', label: 'Student' },
  { key: 'reference', label: 'Reference' },
  { key: 'bank_name', label: 'Bank Name' },
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
]

export default function OfflineBankPaymentPage() {
  const {
    rows,
    isLoading,
    search,
    setSearch,
    createOfflinePayment,
    updateOfflinePayment,
    deleteOfflinePayment,
  } = useOfflinePayments()

  const { data: studentsData } = useAsyncData(() => studentService.list(), [])

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const studentMap = useMemo(() => {
    const map = {}
    const list = Array.isArray(studentsData) ? studentsData : studentsData?.data || []
    list.forEach((s) => {
      const id = s._id || s.id
      const firstName = s.name?.first || s.firstName || ''
      const lastName = s.name?.last || s.lastName || ''
      const fullName = `${firstName} ${lastName}`.trim() || s.name || id
      if (id) map[id] = fullName
    })
    return map
  }, [studentsData])

  const getStudentName = (studentId) => {
    if (!studentId) return 'N/A'
    if (typeof studentId === 'object') {
      const fn = studentId.name?.first || studentId.firstName || ''
      const ln = studentId.name?.last || studentId.lastName || ''
      return `${fn} ${ln}`.trim() || studentId.name || 'N/A'
    }
    return studentMap[studentId] || studentId
  }

  const filteredRows = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => {
      const sName = getStudentName(r.student_id).toLowerCase()
      const sId = String(typeof r.student_id === 'object' ? r.student_id?._id : r.student_id || '').toLowerCase()
      const ref = String(r.reference || '').toLowerCase()
      const bank = String(r.bank_name || '').toLowerCase()

      return sName.includes(q) || sId.includes(q) || ref.includes(q) || bank.includes(q)
    })
  }, [rows, search, studentMap])

  const stats = useMemo(() => {
    const total = rows.length
    const totalAmount = rows.reduce((a, b) => a + Number(b.amount || 0), 0)
    const banks = new Set(rows.map((r) => r.bank_name).filter(Boolean)).size
    const latest = rows.length && rows[0]?.date ? formatDate(rows[0].date) : 'N/A'

    return { total, totalAmount, banks, latest }
  }, [rows])

  const exportData = useMemo(() => {
    return filteredRows.map((r) => ({
      ...r,
      student_name: getStudentName(r.student_id),
      reference: r.reference || 'N/A',
      bank_name: r.bank_name || 'N/A',
      date: formatDate(r.date),
      amount: r.amount || 0,
    }))
  }, [filteredRows, studentMap])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'student_id',
        header: 'Student',
        cell: ({ row }) => (
          <span className="font-medium">{getStudentName(row.original.student_id)}</span>
        ),
      },
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: ({ row }) => row.original.reference || 'N/A',
      },
      {
        accessorKey: 'bank_name',
        header: 'Bank Name',
        cell: ({ row }) => row.original.bank_name || 'N/A',
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => formatCurrency(row.original.amount || 0),
      },
    ],
    [studentMap]
  )

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Fees', to: '/fees/collect' },
          { label: 'Offline Bank Payment' },
        ]}
      />
      <PageHeader
        title="Offline Bank Payment"
        description="Review and record offline bank transfer submissions."
        icon={Landmark}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Payment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Payments" value={stats.total} icon={Landmark} accent="primary" />
        <StatCard label="Total Amount" value={formatCurrency(stats.totalAmount)} icon={DollarSign} accent="success" />
        <StatCard label="Banks Used" value={stats.banks} icon={Building2} accent="warning" />
        <StatCard label="Latest Payment" value={stats.latest} icon={Calendar} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search student, reference, or bank name…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="offline-payments" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={5} />
      ) : filteredRows.length === 0 ? (
        <NoData
          title="No payments found"
          actionLabel="Add Payment"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredRows}
          enableExport
          exportFilename="offline-payments"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <PaymentFormDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Offline Payment"
        studentsData={studentsData}
        onSubmit={async (payload) => {
          await createOfflinePayment(payload)
          setAddOpen(false)
        }}
      />

      <PaymentFormDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Payment"
        initial={editRow}
        studentsData={studentsData}
        onSubmit={async (payload) => {
          await updateOfflinePayment(editRow._id, payload)
          setEditRow(null)
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Payment Details"
        description={viewRow?.reference}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Student', value: getStudentName(viewRow.student_id) },
              { label: 'Reference', value: viewRow.reference || 'N/A' },
              { label: 'Bank Name', value: viewRow.bank_name || 'N/A' },
              { label: 'Amount', value: formatCurrency(viewRow.amount || 0) },
              { label: 'Date', value: formatDate(viewRow.date) },
            ].map((item) => (
              <div key={item.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
                <dd className="text-sm font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.reference}
        onConfirm={async () => {
          await deleteOfflinePayment(deleteRow._id)
          setDeleteRow(null)
        }}
      />
    </div>
  )
}

function PaymentFormDrawer({ open, onOpenChange, title, initial, studentsData, onSubmit }) {
  const [form, setForm] = useState({
    student_id: initial?.student_id?._id || initial?.student_id || '',
    amount: initial?.amount ?? '',
    bank_name: initial?.bank_name || '',
    reference: initial?.reference || '',
    date: initial?.date
      ? new Date(initial.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  })

  const studentList = useMemo(() => {
    return Array.isArray(studentsData) ? studentsData : studentsData?.data || []
  }, [studentsData])

  const handleSubmit = () => {
    const payload = {
      student_id: form.student_id,
      amount: Number(form.amount),
      bank_name: form.bank_name,
      reference: form.reference,
      date: form.date,
    }
    onSubmit(payload)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Enter offline bank payment details"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save' : 'Create'}
          onSubmit={handleSubmit}
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="space-y-4"
      >
        <FormSection columns={2}>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Student</Label>
            {studentList.length > 0 ? (
              <select
                value={form.student_id}
                onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select Student</option>
                {studentList.map((s) => {
                  const id = s._id || s.id
                  const name = `${s.name?.first || s.firstName || ''} ${s.name?.last || s.lastName || ''}`.trim() || s.name || id
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  )
                })}
              </select>
            ) : (
              <Input
                value={form.student_id}
                onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                placeholder="Student ID"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="e.g. 5000"
            />
          </div>

          <Field
            label="Bank Name"
            value={form.bank_name}
            onChange={(v) => setForm((f) => ({ ...f, bank_name: v }))}
            placeholder="e.g. SBI"
          />

          <Field
            label="Reference"
            value={form.reference}
            onChange={(v) => setForm((f) => ({ ...f, reference: v }))}
            placeholder="e.g. REF123"
          />

          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}