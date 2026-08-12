// ====================================================================
// Module: Examinations
// Page: Exam Groups
//
// Purpose:
// Create and manage examination groups across academic sessions.
//
// Data Source:
// examination.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, FileText, Calendar, Clock, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { useExamGroups } from '@/hooks/useExaminations'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'exam_name', label: 'Exam Name' },
  { key: 'session', label: 'Session' },
]

const SESSIONS = ['2024-2025', '2025-2026', '2026-2027']

const formatSession = (s) => {
  if (!s || s === 'N/A') return 'N/A'
  const parts = s.split('-')
  return parts.length === 2 && parts[1].length === 4
    ? `${parts[0]}–${parts[1].slice(2)}`
    : s
}

const formatDateTime = (dateVal) => {
  if (!dateVal) return 'N/A'
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function ExamGroupsPage() {
  const { toast } = useToast()
  const {
    rows = [],
    isLoading,
    search,
    setSearch,
    saveExamGroup,
    deleteExamGroup,
  } = useExamGroups()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const filteredRows = useMemo(() => {
    if (!search) return rows
    const query = search.toLowerCase()
    return rows.filter(
      (r) =>
        (r.exam_name || r.name || '').toLowerCase().includes(query) ||
        (r.session || '').toLowerCase().includes(query)
    )
  }, [rows, search])

  const stats = useMemo(() => {
    const total = rows.length
    const currentSession = formatSession(rows[0]?.session || 'N/A')

    if (!rows.length) return { total, currentSession, latestText: 'N/A' }

    const sorted = [...rows].sort((a, b) => {
      const tA = new Date(a.createdAt || a.date || 0).getTime()
      const tB = new Date(b.createdAt || b.date || 0).getTime()
      return tB - tA
    })

    const latest = sorted[0]
    const name = latest?.exam_name || latest?.name || 'N/A'
    const dateStr = formatDate(latest?.createdAt || latest?.date)

    return {
      total,
      currentSession,
      latestText: `${name} (${dateStr})`,
    }
  }, [rows])

  const exportData = useMemo(() => {
    return filteredRows.map((r) => ({
      exam_name: r.exam_name || r.name || 'N/A',
      session: r.session || 'N/A',
    }))
  }, [filteredRows])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const columns = useMemo(
    () => [
      {
        id: 'actions',
        header: 'Actions',
        size: 56,
        enableSorting: false,
        cell: ({ row }) => <ActionDropdown actions={rowActions(row.original)} />,
      },
      {
        accessorKey: 'exam_name',
        header: 'Exam Name',
        cell: ({ row }) => (
          <button
            className="font-semibold text-foreground hover:underline text-left cursor-pointer"
            onClick={() => setViewRow(row.original)}
          >
            {row.original.exam_name || row.original.name || 'N/A'}
          </button>
        ),
      },
      {
        accessorKey: 'session',
        header: 'Session',
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
            {formatSession(row.original.session)}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({ row }) => formatDate(row.original.createdAt || row.original.date),
      },
    ],
    []
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Examinations', to: '/examinations/exam-groups' },
          { label: 'Exam Groups' },
        ]}
      />
      <PageHeader
        title="Exam Groups"
        description="Create and manage examination groups across academic sessions."
        icon={FileText}
        actions={
          <>
            <ImportButton
              onImport={() => toast({ title: 'Import feature coming soon', variant: 'secondary' })}
            />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Exam Group
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Exam Groups" value={stats.total} icon={FileText} accent="primary" />
        <StatCard label="Current Session" value={stats.currentSession} icon={Calendar} accent="success" />
        <StatCard label="Latest Created" value={stats.latestText} icon={Clock} accent="chart3" />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search exam groups…"
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="exam-groups" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={4} />
      ) : filteredRows.length === 0 ? (
        <NoData
          icon={FileText}
          title="No Exam Groups Yet"
          description="Create your first exam group"
          actionLabel="Add Exam Group"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredRows}
          enableExport
          exportFilename="exam-groups"
        />
      )}

      <ExamGroupDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Exam Group"
        onSubmit={async (p) => {
          await saveExamGroup(p)
          toast({ title: 'Exam group created' })
          setAddOpen(false)
        }}
      />

      <ExamGroupDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Exam Group"
        initial={editRow}
        onSubmit={async (p) => {
          await saveExamGroup(p, editRow._id)
          toast({ title: 'Exam group updated' })
          setEditRow(null)
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Exam Group Details"
        description={viewRow?.exam_name || viewRow?.name}
        width="sm:max-w-md"
        footer={
          <Button variant="outline" onClick={() => setViewRow(null)}>
            Close
          </Button>
        }
      >
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Exam Name', value: viewRow.exam_name || viewRow.name || 'N/A' },
              { label: 'Session', value: formatSession(viewRow.session) },
              { label: 'Created At', value: formatDateTime(viewRow.createdAt || viewRow.date) },
              { label: 'Updated At', value: formatDateTime(viewRow.updatedAt || viewRow.createdAt || viewRow.date) },
            ].map((r) => (
              <div key={r.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-medium text-foreground">{r.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.exam_name || deleteRow?.name}
        onConfirm={async () => {
          await deleteExamGroup(deleteRow._id)
          toast({ title: 'Exam group deleted' })
          setDeleteRow(null)
        }}
      />
    </div>
  )
}

function ExamGroupDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    exam_name: '',
    session: SESSIONS[0],
  })

  useEffect(() => {
    if (open) {
      setForm({
        exam_name: initial?.exam_name || initial?.name || '',
        session: initial?.session || SESSIONS[0],
      })
    }
  }, [open, initial])

  const handleSubmit = () => {
    onSubmit({
      exam_name: form.exam_name,
      session: form.session,
    })
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Exam group details"
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
              Exam Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.exam_name}
              onChange={(e) => setForm((f) => ({ ...f, exam_name: e.target.value }))}
              placeholder="e.g. Mid Term / Final Exam / Half Yearly"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Academic Session <span className="text-destructive">*</span>
            </Label>
            <select
              value={form.session}
              onChange={(e) => setForm((f) => ({ ...f, session: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              {SESSIONS.map((s) => (
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