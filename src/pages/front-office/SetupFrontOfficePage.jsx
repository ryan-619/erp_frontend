// ====================================================================
// Module: Front Office
// Page: Setup Front Office
//
// Purpose:
// Configure front office settings.
//
// Data Source:
// frontOffice.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Settings, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { frontOfficeService } from '@/services/frontOffice.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

export default function SetupFrontOfficePage() {
  const { toast } = useToast()
  const { data: setups, isLoading, refetch } = useAsyncData(() => frontOfficeService.getSetup(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = Array.isArray(setups) ? setups : (setups ? [setups] : [])

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    if (!r.config) return false
    const configStr = JSON.stringify(r.config).toLowerCase()
    return !q || configStr.includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'config',
      header: 'Configuration',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">Front Office Config</span>
            <span className="text-xs text-muted-foreground">{row.original.createdAt ? formatDate(row.original.createdAt) : 'No date'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await frontOfficeService.updateSetupItem(id, payload)
        toast({ title: 'Configuration updated successfully' })
        setEditRow(null)
      } else {
        await frontOfficeService.createSetupItem(payload)
        toast({ title: 'Configuration created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save configuration:', error)
      toast({ title: 'Failed to save configuration', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontOfficeService.deleteSetupItem(id)
      toast({ title: 'Configuration deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete configuration:', error)
      toast({ title: 'Failed to delete configuration', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front Office' }, { label: 'Setup' }]} />
      <PageHeader
        title="Front Office Setup"
        description="Configure front office settings."
        icon={Settings}
        actions={<Button onClick={() => setAddOpen(true)}><Settings className="mr-2 h-4 w-4" /> Add Configuration</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Configurations" value={stats.total} icon={Settings} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search configuration…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={2} />
      ) : filtered.length === 0 ? (
        <NoData title="No configurations found" description="Add a configuration to get started." actionLabel="Add Configuration" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Configuration' : 'Add Configuration'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update configuration' : 'Add a new front office configuration'}</DialogDescription>
          </DialogHeader>
          <SetupForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Configuration Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4">
            {[
              { label: 'Configuration', value: viewRow.config ? JSON.stringify(viewRow.config, null, 2) : '—' },
              { label: 'Created', value: formatDate(viewRow.createdAt) },
              { label: 'Updated', value: formatDate(viewRow.updatedAt) },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium whitespace-pre-wrap">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Configuration</DialogTitle>
            <DialogDescription>Are you sure you want to delete this configuration? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteRow._id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SetupForm({ initial, onSubmit, onCancel }) {
  const [configJson, setConfigJson] = useState('')

  useState(() => {
    if (initial) {
      setConfigJson(initial.config ? JSON.stringify(initial.config, null, 2) : '{}')
    } else {
      setConfigJson('{}')
    }
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    try {
      const config = JSON.parse(configJson)
      onSubmit({ config })
    } catch (error) {
      alert('Invalid JSON format')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="config">Configuration (JSON) *</Label>
        <Textarea 
          id="config" 
          value={configJson} 
          onChange={(e) => setConfigJson(e.target.value)} 
          placeholder='{"key": "value"}' 
          rows={10} 
          className="font-mono text-sm"
          required 
        />
        <p className="text-xs text-muted-foreground mt-1">Enter configuration as valid JSON</p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
