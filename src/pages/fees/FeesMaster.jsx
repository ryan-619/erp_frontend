// ====================================================================
// Module: Fees
// Page: Fees Master
//
// Purpose:
// Define fee structures with amount, due date, scope, and session.
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
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Eye,
  IndianRupee,
  Layers,
  GraduationCap,
  Calendar,
  Clock,
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
import { FEE_SESSIONS, classOptions } from '@/constants/fees'
import { formatCurrency, formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

import { academicsService } from '@/services/academics.service'

const EXPORT_COLS = [
  { key: 'class_id', label: 'Class' },
  { key: 'fees_group_id', label: 'Fee Group' },
  { key: 'amount', label: 'Amount' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'session', label: 'Session' },
]

export default function FeesMasterPage() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getFeesMaster(), [])
  const { data: groupData } = useAsyncData(() => feesService.getFeesGroups(), [])
  const { data: classData } = useAsyncData(
    () => academicsService.classes(),
    []
  )

  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  // Map IDs to Human Readable Names
  const groupMap = useMemo(() => {
    const map = {}
    ;(groupData || []).forEach((g) => {
      map[g._id || g.id] = g.fees_group_name || g.name
    })
    return map
  }, [groupData])

  const classMap = useMemo(() => {
    const map = {}
    ;(classData || []).forEach((c) => {
      map[c._id || c.id] = c.class_name || c.name
    })
    return map
  }, [classData])

  const rows = data || []

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter((r) => {
      const className = (classMap[r.class_id] || r.class_id || '').toLowerCase()
      const groupName = (groupMap[r.fees_group_id] || r.fees_group_id || '').toLowerCase()

      return (
        !q ||
        (r.session || '').toLowerCase().includes(q) ||
        String(r.amount).includes(q) ||
        className.includes(q) ||
        groupName.includes(q)
      )
    })
  }, [rows, search, classMap, groupMap])

  const stats = useMemo(() => {
    const totalAmount = rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)
    const sessions = rows.map((r) => r.session).filter(Boolean)
    const latestSession = sessions.length ? [...sessions].sort().reverse()[0] : 'N/A'

    const futureDues = rows
      .map((r) => r.due_date)
      .filter(Boolean)
      .filter((d) => new Date(d) >= new Date())
      .sort((a, b) => new Date(a) - new Date(b))

    const upcomingDue = futureDues.length ? formatDate(futureDues[0]) : 'None'

    return {
      total: rows.length,
      totalAmount,
      latestSession,
      upcomingDue,
    }
  }, [rows])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'class_id',
        header: 'Class',
        cell: ({ row }) => (
          <button
            className="text-left font-medium hover:underline flex items-center gap-2"
            onClick={() => setViewRow(row.original)}
          >
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            {classMap[row.original.class_id] || row.original.class_id || 'N/A'}
          </button>
        ),
      },
      {
        accessorKey: 'fees_group_id',
        header: 'Fee Group',
        cell: ({ row }) => groupMap[row.original.fees_group_id] || row.original.fees_group_id || 'N/A',
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: 'due_date',
        header: 'Due Date',
        cell: ({ row }) => formatDate(row.original.due_date),
      },
      {
        accessorKey: 'session',
        header: 'Session',
      },
    ],
    [classMap, groupMap]
  )

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Fees', to: '/fees/collect' }, { label: 'Fees Master' }]} />

      <PageHeader
        title="Fees Master"
        description="Define fee structures with amount, due date, and scope."
        icon={Wallet}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Fee Structure
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Records" value={stats.total} icon={FileSpreadsheet} accent="primary" />
        <StatCard label="Total Amount" value={formatCurrency(stats.totalAmount)} icon={IndianRupee} accent="success" />
        <StatCard label="Latest Session" value={stats.latestSession} icon={Calendar} accent="chart2" />
        <StatCard label="Upcoming Due" value={stats.upcomingDue} icon={Clock} accent="chart3" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by session, amount, class or group..."
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="fees-master" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No fee structures found" actionLabel="Add Fee Structure" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableExport
          exportFilename="fees-master"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <FeesMasterDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Fee Structure"
        groupData={groupData || []}
        classData={classData || []}
        onSubmit={async (p) => {
          await feesService.createFeesMaster(p)
          toast({ title: 'Fee structure added' })
          setAddOpen(false)
          refetch()
        }}
      />

      <FeesMasterDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Fee Structure"
        initial={editRow}
        groupData={groupData || []}
        classData={classData || []}
        onSubmit={async (p) => {
          await feesService.updateFeesMaster(editRow._id, p)
          toast({ title: 'Fee structure updated' })
          setEditRow(null)
          refetch()
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Fee Structure Details"
        description="View details for selected fee structure"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <GraduationCap className="h-3.5 w-3.5" /> Class
                </div>
                <p className="text-sm font-semibold">{classMap[viewRow.class_id] || viewRow.class_id || 'N/A'}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Layers className="h-3.5 w-3.5" /> Fee Group
                </div>
                <p className="text-sm font-semibold">{groupMap[viewRow.fees_group_id] || viewRow.fees_group_id || 'N/A'}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <IndianRupee className="h-3.5 w-3.5" /> Amount
                </div>
                <p className="text-base font-bold text-primary">{formatCurrency(viewRow.amount)}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Clock className="h-3.5 w-3.5" /> Due Date
                </div>
                <p className="text-sm font-semibold">{formatDate(viewRow.due_date)}</p>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5" /> Session
                </div>
                <p className="text-sm font-semibold">{viewRow.session || 'N/A'}</p>
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
            ? `${classMap[deleteRow.class_id] || ''} - ${groupMap[deleteRow.fees_group_id] || 'Fee Structure'}`
            : 'Fee Structure'
        }
        onConfirm={async () => {
          await feesService.deleteFeesMaster(deleteRow._id)
          toast({ title: 'Fee structure deleted' })
          setDeleteRow(null)
          refetch()
        }}
      />
    </div>
  )
}

function FeesMasterDrawer({ open, onOpenChange, title, initial, groupData = [], classData = [], onSubmit }) {
  const [form, setForm] = useState({
    fees_group_id: initial?.fees_group_id || '',
    class_id: initial?.class_id || '',
    amount: initial?.amount ?? '',
    due_date: initial?.due_date ? initial.due_date.split('T')[0] : '',
    session: initial?.session || '2024–2025',
  })

  useEffect(() => {
    setForm({
      fees_group_id: initial?.fees_group_id || '',
      class_id: initial?.class_id || '',
      amount: initial?.amount ?? '',
      due_date: initial?.due_date ? initial.due_date.split('T')[0] : '',
      session: initial?.session || '2024–2025',
    })
  }, [initial, open])

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Fee structure details"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save' : 'Create'}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Fee Group <span className="text-destructive">*</span></Label>
            <select
              value={form.fees_group_id}
              onChange={(e) => setForm((f) => ({ ...f, fees_group_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select Fee Group</option>
              {(groupData || []).map((g) => (
                <option key={g._id || g.id} value={g._id || g.id}>
                  {g.fees_group_name || g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Class <span className="text-destructive">*</span></Label>
            <select
              value={form.class_id}
              onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select Class</option>
              {(classData || []).length > 0 ? (
                (classData || []).map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.class_name || c.name}
                  </option>
                ))
              ) : (
                classOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))
              )}
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
            <Label className="text-xs">Due Date <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Session <span className="text-destructive">*</span></Label>
            <select
              value={form.session}
              onChange={(e) => setForm((f) => ({ ...f, session: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              {FEE_SESSIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}