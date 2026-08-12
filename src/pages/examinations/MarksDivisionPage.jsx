// ====================================================================
// Module: Examinations
// Page: Marks Division
//
// Purpose:
// Define division bands based on percentage ranges.
//
// Data Source:
// examination.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { ScrollText, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { examinationService } from '@/services/examination.service'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'division_name', label: 'Division' },
  { key: 'percent_from', label: 'From %' },
  { key: 'percent_to', label: 'To %' },
  { key: 'percent_range', label: 'Percentage Range' },
]

export default function MarksDivisionPage() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => examinationService.getMarksDivisions(), [])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = useMemo(() => {
    const list = data || []
    return [...list].sort((a, b) => (b.percent_to ?? 0) - (a.percent_to ?? 0))
  }, [data])

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const name = r.division_name || r.division || ''
        return !search || name.toLowerCase().includes(search.toLowerCase())
      }),
    [rows, search]
  )

  const stats = useMemo(() => {
    if (!rows.length) return { total: 0, highest: 0, lowest: 0, passing: '-' }
    return {
      total: rows.length,
      highest: Math.max(...rows.map((r) => r.percent_to || 0)),
      lowest: Math.min(...rows.map((r) => r.percent_from || 0)),
      passing: rows.find((r) => (r.percent_from ?? 0) >= 35)?.division_name || rows.find((r) => (r.percent_from ?? 0) >= 35)?.division || '-',
    }
  }, [rows])

  const exportData = useMemo(
    () =>
      filtered.map((r) => ({
        ...r,
        division_name: r.division_name || r.division || '',
        percent_range: `${r.percent_from}% → ${r.percent_to}%`,
      })),
    [filtered]
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'division_name',
        header: 'Division',
        cell: ({ row }) => (
          <Badge className="rounded-full px-3 font-semibold" variant="default">
            {row.original.division_name || row.original.division || ''}
          </Badge>
        ),
      },
      {
        id: 'range',
        header: 'Percentage Range',
        cell: ({ row }) => `${row.original.percent_from}% → ${row.original.percent_to}%`,
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
          { label: 'Examinations', to: '/examinations/exam-groups' },
          { label: 'Marks Division' },
        ]}
      />
      <PageHeader
        title="Marks Division"
        description="Define division bands based on percentage ranges."
        icon={ScrollText}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Division
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Divisions" value={stats.total} icon={ScrollText} accent="primary" />
        <StatCard label="Highest %" value={`${stats.highest}%`} icon={ScrollText} accent="success" />
        <StatCard label="Lowest %" value={`${stats.lowest}%`} icon={ScrollText} accent="chart2" />
        <StatCard label="Passing Division" value={stats.passing} icon={ScrollText} accent="chart3" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search division..." className="max-w-sm" />
        <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="marks-divisions" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={4} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No divisions found" actionLabel="Add Division" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          actionHeader="Actions"
          rowClassName="hover:bg-muted/40 transition-colors"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <DivisionDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Division"
        existingRows={rows}
        onSubmit={async (p) => {
          await examinationService.createMarksDivision(p)
          toast({ title: 'Division added', description: p.division_name })
          setAddOpen(false)
          refetch()
        }}
      />
      <DivisionDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Division"
        initial={editRow}
        existingRows={rows}
        onSubmit={async (p) => {
          await examinationService.updateMarksDivision(editRow._id, p)
          toast({ title: 'Division updated', description: p.division_name })
          setEditRow(null)
          refetch()
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title={`Division ${viewRow?.division_name || viewRow?.division || ''}`}
        description="Division band details"
        width="sm:max-w-sm"
        footer={
          <Button variant="outline" onClick={() => setViewRow(null)}>
            Close
          </Button>
        }
      >
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              {
                label: 'Division',
                value: (
                  <Badge className="rounded-full px-3 font-semibold">
                    {viewRow.division_name || viewRow.division || ''}
                  </Badge>
                ),
              },
              { label: 'Percentage Range', value: `${viewRow.percent_from}% → ${viewRow.percent_to}%` },
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
        entityName={deleteRow?.division_name || deleteRow?.division}
        onConfirm={async () => {
          await examinationService.removeMarksDivision(deleteRow._id)
          toast({ title: 'Division deleted' })
          setDeleteRow(null)
          refetch()
        }}
      />
    </div>
  )
}

function DivisionDrawer({ open, onOpenChange, title, initial, onSubmit, existingRows = [] }) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    division_name: '',
    percent_from: 0,
    percent_to: 100,
  })

  useEffect(() => {
    if (open) {
      setForm({
        division_name: initial?.division_name || initial?.division || '',
        percent_from: initial?.percent_from ?? 0,
        percent_to: initial?.percent_to ?? 100,
      })
    }
  }, [open, initial])

  const handleSubmit = () => {
    if (!form.division_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Division Name is required.',
        variant: 'destructive',
      })
      return
    }

    if (form.percent_from > form.percent_to) {
      toast({
        title: 'Invalid Percentage Range',
        description: 'Percentage From cannot exceed Percentage To.',
        variant: 'destructive',
      })
      return
    }

    // Fixed: Safe evaluation against legacy or undefined division names
    const isDuplicate = existingRows.some((r) => {
      const existingName = (r.division_name || r.division || '').toLowerCase()
      return existingName === form.division_name.trim().toLowerCase() && r._id !== initial?._id
    })

    if (isDuplicate) {
      toast({
        title: 'Duplicate Division',
        description: `Division "${form.division_name}" already exists.`,
        variant: 'destructive',
      })
      return
    }

    onSubmit({
      division_name: form.division_name.trim(),
      percent_from: Number(form.percent_from),
      percent_to: Number(form.percent_to),
    })
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Division band details"
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
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Division Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.division_name}
              onChange={(e) => setForm((f) => ({ ...f, division_name: e.target.value }))}
              placeholder="e.g. First Division"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Percentage Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={form.percent_from}
                onChange={(e) => setForm((f) => ({ ...f, percent_from: Number(e.target.value) }))}
                placeholder="From"
              />
              <span className="text-muted-foreground text-xs font-medium">→</span>
              <Input
                type="number"
                value={form.percent_to}
                onChange={(e) => setForm((f) => ({ ...f, percent_to: Number(e.target.value) }))}
                placeholder="To"
              />
            </div>
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}