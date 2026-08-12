// ====================================================================
// Module: Fees
// Page: Fees Carry Forward
//
// Purpose:
// Carry forward fee credits and debits across sessions.
//
// Data Source:
// fees.service.js / student.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { ArrowLeftRight, Plus, Pencil, Trash2, Eye, DollarSign, Calendar, Users } from 'lucide-react'
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
import { FEE_SESSIONS } from '@/constants/fees'
import { formatCurrency, formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'student_name', label: 'Student' },
  { key: 'old_session', label: 'Old Session' },
  { key: 'amount', label: 'Amount' },
  { key: 'reason', label: 'Reason' },
  { key: 'createdAt', label: 'Created Date' },
]

export default function FeesCarryForwardPage() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getCarryForward(), [])
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
      const studentName = student ? `${student.name.first} ${student.name.last}` : ''
      const oldSession = r.old_session || ''
      const reason = r.reason || ''

      if (!search) return true
      const q = search.toLowerCase()
      return (
        studentName.toLowerCase().includes(q) ||
        oldSession.toLowerCase().includes(q) ||
        reason.toLowerCase().includes(q)
      )
    })
  }, [rows, search, studentMap])

  const stats = useMemo(() => {
    const total = rows.length
    const totalAmount = rows.reduce((acc, r) => acc + Number(r.amount || 0), 0)
    const uniqueStudents = new Set(rows.map((r) => r.student_id).filter(Boolean)).size
    const latestSession = rows.length > 0 ? rows[0]?.old_session || 'N/A' : 'N/A'

    return { total, totalAmount, students: uniqueStudents, latestSession }
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
        old_session: r.old_session || 'N/A',
        amount: r.amount || 0,
        reason: r.reason || 'N/A',
        createdAt: formatDate(r.createdAt || r.date),
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
        accessorKey: 'old_session',
        header: 'Old Session',
        cell: ({ row }) => row.original.old_session || 'N/A',
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => formatCurrency(row.original.amount || 0),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => row.original.reason || 'N/A',
      },
      {
        accessorKey: 'createdAt',
        header: 'Created Date',
        cell: ({ row }) => formatDate(row.original.createdAt || row.original.date),
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
    if (!deleteRow) return 'Record'
    const student = studentMap[deleteRow.student_id]
    return student
      ? `${student.name.first} ${student.name.last}`
      : 'Record'
  }, [deleteRow, studentMap])

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Fees', to: '/fees/collect' },
          { label: 'Fees Carry Forward' },
        ]}
      />
      <PageHeader
        title="Fees Carry Forward"
        description="Carry forward fee credits and debits across sessions."
        icon={ArrowLeftRight}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Record
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Records" value={stats.total} icon={ArrowLeftRight} accent="primary" />
        <StatCard label="Total Amount" value={formatCurrency(stats.totalAmount)} icon={DollarSign} accent="success" />
        <StatCard label="Students" value={stats.students} icon={Users} accent="chart2" />
        <StatCard label="Latest Session" value={stats.latestSession} icon={Calendar} accent="chart3" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search student, session or reason…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="fees-carry-forward" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No records found" actionLabel="Add Record" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableExport
          exportFilename="fees-carry-forward"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <CFDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Record"
        students={students}
        onSubmit={async (p) => {
          await feesService.createCarryForward(p)
          toast({ title: 'Record added' })
          setAddOpen(false)
          refetch()
        }}
      />

      <CFDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Record"
        initial={editRow}
        students={students}
        onSubmit={async (p) => {
          await feesService.updateCarryForward(editRow._id, p)
          toast({ title: 'Record updated' })
          setEditRow(null)
          refetch()
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Carry Forward Details"
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
              { label: 'Old Session', value: viewRow.old_session || 'N/A' },
              { label: 'Amount', value: formatCurrency(viewRow.amount || 0) },
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
          await feesService.deleteCarryForward(deleteRow._id)
          toast({ title: 'Record deleted' })
          setDeleteRow(null)
          refetch()
        }}
      />
    </div>
  )
}

function CFDrawer({ open, onOpenChange, title, initial, students, onSubmit }) {
  const [form, setForm] = useState({
    student_id: '',
    old_session: '',
    amount: '',
    reason: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        student_id: initial?.student_id || '',
        old_session: initial?.old_session || '2024-2025',
        amount: initial?.amount ?? '',
        reason: initial?.reason || '',
      })
    }
  }, [open, initial])

  const handleSubmit = () => {
    const payload = {
      student_id: form.student_id,
      old_session: form.old_session,
      amount: Number(form.amount),
      reason: form.reason,
    }
    onSubmit(payload)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Carry forward details"
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

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">
              Old Session <span className="text-destructive">*</span>
            </Label>
            <select
              value={form.old_session}
              onChange={(e) => setForm((f) => ({ ...f, old_session: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select Session</option>
              {FEE_SESSIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">
              Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="e.g. 320"
              required
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Reason</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Overpayment refund carried forward"
            />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}