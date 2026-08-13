// ====================================================================
// Module: Transport
// Page: Transport Fees (Fees Master)
//
// Purpose:
// Manage transport fees for routes.
//
// Data Source:
// transport.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { DollarSign, Plus, Eye, Pencil, Trash2, Route as RouteIcon } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { transportService } from '@/services/transport.service'
import { formatCurrency, formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'route_name', label: 'Route' },
  { key: 'amount', label: 'Amount' },
  { key: 'createdAt', label: 'Created At' },
]

export default function TransportFeesPage() {
  const { toast } = useToast()
  const { data: feesMaster, isLoading, refetch } = useAsyncData(() => transportService.getTransportFeesMaster(), [])
  const { data: routes, isLoading: routesLoading } = useAsyncData(() => transportService.getTransportRoutes(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = feesMaster || []
  const allRoutes = routes || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const route = allRoutes.find(rt => rt._id === r.route_id)
    return !q || 
      (route?.route_name || '').toLowerCase().includes(q) ||
      String(r.amount || '').includes(q)
  }), [rows, search, allRoutes])

  const stats = useMemo(() => ({
    total: rows.length,
    totalAmount: rows.reduce((sum, r) => sum + (r.amount || 0), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'route_id',
      header: 'Route',
      cell: ({ row }) => {
        const route = allRoutes.find(r => r._id === row.original.route_id)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              <RouteIcon className="h-4 w-4" />
            </div>
            <span className="font-medium hover:underline">{route?.route_name || 'Unknown'}</span>
          </button>
        )
      },
    },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => formatCurrency(row.original.amount) },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allRoutes])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await transportService.updateTransportFeesMaster(id, payload)
        toast({ title: 'Fees updated successfully' })
        setEditRow(null)
      } else {
        await transportService.createTransportFeesMaster(payload)
        toast({ title: 'Fees created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save fees:', error)
      toast({ title: 'Failed to save fees', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await transportService.deleteTransportFeesMaster(id)
      toast({ title: 'Fees deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete fees:', error)
      toast({ title: 'Failed to delete fees', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }, { label: 'Transport Fees' }]} />
      <PageHeader
        title="Transport Fees"
        description="Manage transport fees for routes."
        icon={DollarSign}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Fees</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Routes with Fees" value={stats.total} icon={RouteIcon} accent="primary" />
        <StatCard label="Total Amount" value={formatCurrency(stats.totalAmount)} icon={DollarSign} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by route or amount…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              route_name: allRoutes.find(rt => rt._id === r.route_id)?.route_name || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="transport-fees" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No fees found" description="Add transport fees for routes to get started." actionLabel="Add Fees" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Fees' : 'Add Fees'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update transport fees' : 'Add transport fees for a route'}</DialogDescription>
          </DialogHeader>
          <TransportFeesForm 
            initial={editRow} 
            routes={allRoutes}
            routesLoading={routesLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Fees Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const route = allRoutes.find(r => r._id === viewRow.route_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Route', value: route?.route_name || 'Unknown' },
                { label: 'Amount', value: formatCurrency(viewRow.amount) },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
                { label: 'Updated', value: formatDate(viewRow.updatedAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )
        })()}
      </Drawer>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fees</DialogTitle>
            <DialogDescription>Are you sure you want to delete these fees? This action cannot be undone.</DialogDescription>
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

function TransportFeesForm({ initial, routes, routesLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    route_id: '',
    amount: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        route_id: initial.route_id || '',
        amount: initial.amount || '',
      })
    } else {
      setFormData({
        route_id: routes[0]?._id || '',
        amount: '',
      })
    }
  }, [initial, routes])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      amount: Number(formData.amount) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="route_id">Route *</Label>
        <select
          id="route_id"
          value={formData.route_id}
          onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
          disabled={routesLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r._id} value={r._id}>{r.route_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
