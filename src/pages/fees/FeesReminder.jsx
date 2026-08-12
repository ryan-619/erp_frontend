// ====================================================================
// Module: Fees
// Page: Fee Reminder
//
// Purpose:
// Create, manage, edit, and send fee payment reminders to students.
//
// Data Source:
// fees.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { BellRing, Plus, Pencil, Trash2, Eye } from 'lucide-react'
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
import { useAsyncData } from '@/hooks/useAsyncData'
import { feesService } from '@/services/fees.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'template', label: 'Template' },
  { key: 'trigger_days_before', label: 'Trigger Days' },
]

export default function FeesReminderPage() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getReminders(), [])

  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = useMemo(() => (Array.isArray(data) ? data : data?.data || []), [data])

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toLowerCase()
    return rows.filter((r) => {
      const templateMatch = (r.template || '').toLowerCase().includes(q)
      const daysMatch = String(r.trigger_days_before ?? '').includes(q)
      return templateMatch || daysMatch
    })
  }, [rows, search])

  const stats = useMemo(() => {
    const total = rows.length
    const triggerDaysList = rows.map((r) => Number(r.trigger_days_before)).filter((n) => !isNaN(n))
    const avgDays = total && triggerDaysList.length
      ? (triggerDaysList.reduce((acc, val) => acc + val, 0) / triggerDaysList.length).toFixed(0)
      : 0

    const createdTimestamps = rows
      .map((r) => new Date(r.createdAt || r.date || 0).getTime())
      .filter((t) => !isNaN(t) && t > 0)

    const updatedTimestamps = rows
      .map((r) => new Date(r.updatedAt || r.createdAt || r.date || 0).getTime())
      .filter((t) => !isNaN(t) && t > 0)

    const latestCreated = createdTimestamps.length ? formatDate(Math.max(...createdTimestamps)) : 'N/A'
    const latestUpdated = updatedTimestamps.length ? formatDate(Math.max(...updatedTimestamps)) : 'N/A'

    return { total, avgDays, latestCreated, latestUpdated }
  }, [rows])

  const exportData = useMemo(() => {
    return filtered.map((r) => ({
      template: r.template || 'N/A',
      trigger_days_before: r.trigger_days_before ?? 0,
    }))
  }, [filtered])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'template',
        header: 'Template',
        cell: ({ row }) => {
          const text = row.original.template || 'N/A'
          const truncated = text.length > 50 ? `${text.slice(0, 50)}...` : text
          return (
            <button
              className="text-left font-medium hover:underline max-w-md truncate block"
              onClick={() => setViewRow(row.original)}
              title={text}
            >
              {truncated}
            </button>
          )
        },
      },
      {
        accessorKey: 'trigger_days_before',
        header: 'Reminder Before (Days)',
        cell: ({ row }) => `${row.original.trigger_days_before ?? 0} days`,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.createdAt || row.original.date),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: ({ row }) => formatDate(row.original.updatedAt || row.original.createdAt || row.original.date),
      },
    ],
    []
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
          { label: 'Fee Reminder' },
        ]}
      />
      <PageHeader
        title="Fee Reminder"
        description="Create, manage, edit, and send fee payment reminders to students."
        icon={BellRing}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Reminder
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Templates" value={stats.total} icon={BellRing} accent="primary" />
        <StatCard label="Average Trigger Days" value={`${stats.avgDays} days`} icon={BellRing} accent="success" />
        <StatCard label="Latest Updated" value={stats.latestUpdated} icon={BellRing} accent="chart2" />
        <StatCard label="Latest Created" value={stats.latestCreated} icon={BellRing} accent="chart3" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search template or days…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="fees-reminder" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No reminders found" actionLabel="Add Reminder" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableExport
          exportFilename="fees-reminder"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <ReminderDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Reminder"
        onSubmit={async (p) => {
          await feesService.createReminder(p)
          toast({ title: 'Reminder added' })
          setAddOpen(false)
          refetch()
        }}
      />

      <ReminderDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Reminder"
        initial={editRow}
        onSubmit={async (p) => {
          await feesService.updateReminder(editRow._id, p)
          toast({ title: 'Reminder updated' })
          setEditRow(null)
          refetch()
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Reminder Details"
        description="Fee payment reminder template information"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Template', value: viewRow.template || 'N/A', fullWidth: true },
              { label: 'Reminder Before', value: `${viewRow.trigger_days_before ?? 0} days` },
              { label: 'Created At', value: formatDate(viewRow.createdAt || viewRow.date) },
              { label: 'Updated At', value: formatDate(viewRow.updatedAt || viewRow.createdAt || viewRow.date) },
            ].map((r) => (
              <div key={r.label} className={`space-y-0.5 ${r.fullWidth ? 'sm:col-span-2' : ''}`}>
                <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-medium whitespace-pre-wrap">{r.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.template ? `"${deleteRow.template.slice(0, 20)}..."` : 'Reminder'}
        onConfirm={async () => {
          await feesService.deleteReminder(deleteRow._id)
          toast({ title: 'Reminder deleted' })
          setDeleteRow(null)
          refetch()
        }}
      />
    </div>
  )
}

function ReminderDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    template: '',
    trigger_days_before: '',
  })

  useEffect(() => {
    if (open) {
      setForm({
        template: initial?.template || '',
        trigger_days_before: initial?.trigger_days_before ?? '',
      })
    }
  }, [open, initial])

  const handleSubmit = () => {
    const payload = {
      template: form.template,
      trigger_days_before: Number(form.trigger_days_before),
    }
    onSubmit(payload)
  }

  const placeholderText = `Dear {name},\n\nYour fee amount of ₹{amount} is due on {date}.\nPlease pay before the due date.\n\nThank you.`

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Reminder template details"
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
              Template <span className="text-destructive">*</span>
            </Label>
            <textarea
              value={form.template}
              onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))}
              placeholder={placeholderText}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">
              Reminder Before <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={form.trigger_days_before}
              onChange={(e) => setForm((f) => ({ ...f, trigger_days_before: e.target.value }))}
              placeholder="e.g. 5"
              required
            />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}