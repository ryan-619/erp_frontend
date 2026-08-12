// ====================================================================
// Module: Fees
// Page: Fees Discount
//
// Purpose:
// Manage scholarships, concessions, and discount rules.
//
// Data Source:
// fees.service.js / student.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { BadgePercent, Plus, Pencil, Trash2, Eye, DollarSign, Percent, Users } from 'lucide-react'
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

const EXPORT_COLS = [
  { key: 'student_name', label: 'Student' },
  { key: 'discount_percent', label: 'Discount %' },
  { key: 'discount_amount', label: 'Discount Amount' },
  { key: 'reason', label: 'Reason' },
]

export default function FeesDiscountPage() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getFeesDiscounts(), [])
  const { data: students } = useAsyncData(() => studentService.list(), [])

  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = useMemo(() => (Array.isArray(data) ? data : data?.data || []), [data])

  const studentMap = useMemo(() => {
    const map = {}

    ;(students || []).forEach((student) => {
      map[student._id] = student
    })

    return map
  }, [students])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const student = studentMap[r.student_id]
      const name = student
        ? `${student.name.first} ${student.name.last}`
        : ''

      return (
        !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        (r.reason || '').toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [rows, search, studentMap])

  const stats = useMemo(() => {
    const total = rows.length
    const totalAmount = rows.reduce((acc, r) => acc + Number(r.discount_amount || 0), 0)
    const avgPercent = total
      ? (rows.reduce((acc, r) => acc + Number(r.discount_percent || 0), 0) / total).toFixed(1)
      : 0
    const uniqueStudents = new Set(rows.map((r) => r.student_id).filter(Boolean)).size

    return { total, totalAmount, avgPercent, students: uniqueStudents }
  }, [rows])

  const exportData = useMemo(() => {
    return filtered.map((r) => {
      const student = studentMap[r.student_id]
      const studentName = student
        ? `${student.name.first} ${student.name.last}`
        : r.student_id || 'N/A'

      return {
        ...r,
        student_name: studentName,
        discount_percent: `${r.discount_percent || 0}%`,
        discount_amount: r.discount_amount || 0,
        reason: r.reason || 'N/A',
      }
    })
  }, [filtered, studentMap])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'student_id',
        header: 'Student',
        cell: ({ row }) => {
          const student = studentMap[row.original.student_id]

          return (
            <button
              className="text-left font-medium hover:underline"
              onClick={() => setViewRow(row.original)}
            >
              {student
                ? `${student.name.first} ${student.name.last}`
                : row.original.student_id}
            </button>
          )
        },
      },
      {
        accessorKey: 'discount_percent',
        header: 'Discount %',
        cell: ({ row }) => `${row.original.discount_percent || 0}%`,
      },
      {
        accessorKey: 'discount_amount',
        header: 'Amount',
        cell: ({ row }) => formatCurrency(row.original.discount_amount || 0),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => row.original.reason || 'N/A',
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

  const deleteEntityName = useMemo(() => {
    if (!deleteRow) return 'Discount'
    const student = studentMap[deleteRow.student_id]
    return student
      ? `${student.name.first} ${student.name.last}`
      : 'Discount'
  }, [deleteRow, studentMap])

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Fees', to: '/fees/collect' },
          { label: 'Fees Discount' },
        ]}
      />
      <PageHeader
        title="Fees Discount"
        description="Manage scholarships, concessions, and discount rules."
        icon={BadgePercent}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Discount
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Discounts" value={stats.total} icon={BadgePercent} accent="primary" />
        <StatCard label="Total Discount Amount" value={formatCurrency(stats.totalAmount)} icon={DollarSign} accent="success" />
        <StatCard label="Average Discount %" value={`${stats.avgPercent}%`} icon={Percent} accent="chart2" />
        <StatCard label="Students" value={stats.students} icon={Users} accent="chart3" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search student or reason…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="fees-discounts" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No discounts found" actionLabel="Add Discount" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableExport
          exportFilename="fees-discounts"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <DiscountDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Discount"
        students={students}
        onSubmit={async (p) => {
          await feesService.createFeesDiscount(p)
          toast({ title: 'Discount added' })
          setAddOpen(false)
          refetch()
        }}
      />

      <DiscountDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Discount"
        initial={editRow}
        students={students}
        onSubmit={async (p) => {
          await feesService.updateFeesDiscount(editRow._id, p)
          toast({ title: 'Discount updated' })
          setEditRow(null)
          refetch()
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Discount Details"
        description={
          studentMap[viewRow?.student_id]
            ? `${studentMap[viewRow.student_id].name.first} ${studentMap[viewRow.student_id].name.last}`
            : viewRow?.student_id
        }
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              {
                label: 'Student',
                value: studentMap[viewRow.student_id]
                  ? `${studentMap[viewRow.student_id].name.first} ${studentMap[viewRow.student_id].name.last}`
                  : viewRow.student_id || 'N/A',
              },
              { label: 'Discount %', value: `${viewRow.discount_percent || 0}%` },
              { label: 'Discount Amount', value: formatCurrency(viewRow.discount_amount || 0) },
              { label: 'Reason', value: viewRow.reason || 'N/A' },
              { label: 'Created At', value: formatDate(viewRow.createdAt || viewRow.date) },
            ].map((r) => (
              <div key={r.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteEntityName}
        onConfirm={async () => {
          await feesService.deleteFeesDiscount(deleteRow._id)
          toast({ title: 'Discount deleted' })
          setDeleteRow(null)
          refetch()
        }}
      />
    </div>
  )
}

function DiscountDrawer({ open, onOpenChange, title, initial, students, onSubmit }) {
  const [form, setForm] = useState({
    student_id: '',
    discount_percent: '',
    discount_amount: '',
    reason: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        student_id: initial?.student_id || '',
        discount_percent: initial?.discount_percent ?? '',
        discount_amount: initial?.discount_amount ?? '',
        reason: initial?.reason || '',
      })
    }
  }, [open, initial])

  const handleSubmit = () => {
    const payload = {
      student_id: form.student_id,
      discount_percent: Number(form.discount_percent),
      discount_amount: Number(form.discount_amount),
      reason: form.reason,
    }
    onSubmit(payload)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Discount details"
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
            <Label className="text-xs">
              Student <span className="text-destructive">*</span>
            </Label>
            <select
              value={form.student_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  student_id: e.target.value,
                }))
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select Student</option>
              {(students || []).map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name.first} {student.name.last}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Discount % <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              value={form.discount_percent}
              onChange={(e) => setForm((f) => ({ ...f, discount_percent: e.target.value }))}
              placeholder="e.g. 10"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Discount Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              value={form.discount_amount}
              onChange={(e) => setForm((f) => ({ ...f, discount_amount: e.target.value }))}
              placeholder="e.g. 500"
              required
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Reason</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Merit Scholarship"
            />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}