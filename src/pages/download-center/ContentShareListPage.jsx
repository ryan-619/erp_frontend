// ====================================================================
// Module: Download Center
// Page: Content Share List
//
// Purpose:
// View and manage content shared with specific classes — links
// uploaded content to class recipients with notes.
//
// Data Source:
// downloadCenter.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import {
  Share2,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { StatusBadge } from '@/components/StatusBadge'
import { useShareLists } from '@/hooks/useDownloadCenter'
import { formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'content_title', label: 'Content Title' },
  { key: 'class_name', label: 'Class' },
  { key: 'shared_date', label: 'Shared Date' },
  { key: 'note', label: 'Note' },
  { key: 'status', label: 'Status' },
]

export default function ContentShareListPage() {
  const {
    rows, contents, classes, stats, isLoading,
    search, setSearch,
    createShareList, deleteShareList,
  } = useShareLists()

  const [addOpen, setAddOpen] = useState(false)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleCreate = async (payload) => {
    await createShareList(payload)
    setAddOpen(false)
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'content_id',
      header: 'Content',
      cell: ({ row }) => {
        const content = contents.find(c => c._id === row.original.content_id)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Share2 className="h-4 w-4" />
            </div>
            <span className="font-medium">{content?.title || row.original.content_id}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'class_id',
      header: 'Class',
      cell: ({ row }) => {
        const cls = classes.find(c => c._id === row.original.class_id)
        return cls ? cls.class_name : row.original.class_id
      }
    },
    { accessorKey: 'shared_date', header: 'Shared Date', cell: ({ row }) => formatDate(row.original.shared_date) },
    { accessorKey: 'note', header: 'Note' },
  ], [contents, classes])

  const rowActions = (r) => [
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Download Center' }, { label: 'Content Share List' }]} />
      <PageHeader
        title="Content Share List"
        description="View and manage content shared with specific classes."
        icon={Share2}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Share Content</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Shares" value={stats.total_shares ?? 0} icon={Share2} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by note…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={rows} columns={EXPORT_COLS} filename="content-share-list" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No shared content found" description="Share content with a class to get started." actionLabel="Share Content" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableSelection
          enableExport
          exportFilename="content-share-list"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Reusable Share List Form Drawer. */}
      <ShareListFormDrawer
        open={addOpen}
        onOpenChange={(o) => !o && setAddOpen(false)}
        title="Share Content"
        contents={contents}
        classes={classes}
        onSubmit={handleCreate}
      />

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.content_title}
        onConfirm={() => deleteShareList(deleteRow._id)}
      />
    </div>
  )
}

// ─── Share List Form Drawer ──────────────────────────────────────────────────
function ShareListFormDrawer({ open, onOpenChange, title, contents, classes, onSubmit }) {
  const [form, setForm] = useState({
    content_id: '',
    class_id: '',
    shared_date: new Date().toISOString().split('T')[0],
    note: '',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Share uploaded content with a class"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel="Share Content"
          submitDisabled={!form.content_id || !form.class_id}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Content <span className="text-destructive">*</span></Label>
            <select value={form.content_id} onChange={(e) => set('content_id', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select content</option>
              {contents.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Class <span className="text-destructive">*</span></Label>
            <select value={form.class_id} onChange={(e) => set('class_id', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select class</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.class_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Shared Date</Label>
            <input type="date" value={form.shared_date} onChange={(e) => set('shared_date', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <textarea value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Add a note..." rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
