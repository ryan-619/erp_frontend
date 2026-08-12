// ====================================================================
// Module: Transport
// Page: Student Transport Fees
//
// Purpose:
// Manage student transport fees.
//
// Data Source:
// transport.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { DollarSign, Plus, Eye, Pencil, Trash2, User, Route as RouteIcon, MapPin } from 'lucide-react'
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
import { studentService } from '@/services/student.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'student_name', label: 'Student' },
  { key: 'route_name', label: 'Route' },
  { key: 'pickup_point', label: 'Pickup Point' },
  { key: 'fees_amount', label: 'Fees Amount' },
  { key: 'createdAt', label: 'Created At' },
]

export default function StudentTransportFeesPage() {
  const { toast } = useToast()
  const { data: studentFees, isLoading, refetch } = useAsyncData(() => transportService.getStudentTransportFees(), [])
  const { data: students, isLoading: studentsLoading } = useAsyncData(() => studentService.list(), [])
  const { data: routes, isLoading: routesLoading } = useAsyncData(() => transportService.getTransportRoutes(), [])
  const { data: pickupPoints, isLoading: pickupPointsLoading } = useAsyncData(() => transportService.getPickupPoints(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = studentFees || []
  const allStudents = students || []
  const allRoutes = routes || []
  const allPickupPoints = pickupPoints || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const student = allStudents.find(s => s._id === r.student_id)
    const route = allRoutes.find(rt => rt._id === r.route_id)
    const point = allPickupPoints.find(p => p._id === r.pickup_point_id)
    const studentName = student?.name 
      ? (typeof student.name === 'string' ? student.name : `${student.name.first || ''} ${student.name.last || ''}`.trim())
      : ''
    return !q || 
      studentName.toLowerCase().includes(q) ||
      (route?.route_name || '').toLowerCase().includes(q) ||
      (point?.point_name || '').toLowerCase().includes(q)
  }), [rows, search, allStudents, allRoutes, allPickupPoints])

  const stats = useMemo(() => ({
    total: rows.length,
    totalFees: rows.reduce((sum, r) => sum + (r.fees_amount || 0), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'student_id',
      header: 'Student',
      cell: ({ row }) => {
        const student = allStudents.find(s => s._id === row.original.student_id)
        const studentName = student?.name 
          ? (typeof student.name === 'string' ? student.name : `${student.name.first || ''} ${student.name.last || ''}`.trim())
          : 'Unknown'
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {studentName.charAt(0) || '?'}
            </div>
            <span className="font-medium hover:underline">{studentName}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'route_id',
      header: 'Route',
      cell: ({ row }) => {
        const route = allRoutes.find(r => r._id === row.original.route_id)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-sm font-bold text-success">
              <RouteIcon className="h-4 w-4" />
            </div>
            <span className="font-medium">{route?.route_name || 'Unknown'}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'pickup_point_id',
      header: 'Pickup Point',
      cell: ({ row }) => {
        const point = allPickupPoints.find(p => p._id === row.original.pickup_point_id)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-warning/10 text-sm font-bold text-warning">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="font-medium">{point?.point_name || 'Unknown'}</span>
          </div>
        )
      },
    },
    { accessorKey: 'fees_amount', header: 'Fees Amount', cell: ({ row }) => `$${row.original.fees_amount || 0}` },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allStudents, allRoutes, allPickupPoints])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await transportService.updateStudentTransportFee(id, payload)
        toast({ title: 'Fees updated successfully' })
        setEditRow(null)
      } else {
        await transportService.createStudentTransportFee(payload)
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
      await transportService.deleteStudentTransportFee(id)
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }, { label: 'Student Transport Fees' }]} />
      <PageHeader
        title="Student Transport Fees"
        description="Manage student transport fees."
        icon={DollarSign}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Fees</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Students" value={stats.total} icon={User} accent="primary" />
        <StatCard label="Total Fees" value={`$${stats.totalFees}`} icon={DollarSign} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student, route, or pickup point…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => {
              const student = allStudents.find(s => s._id === r.student_id)
              const studentName = student?.name 
                ? (typeof student.name === 'string' ? student.name : `${student.name.first || ''} ${student.name.last || ''}`.trim())
                : 'Unknown'
              return {
                ...r,
                student_name: studentName,
                route_name: allRoutes.find(rt => rt._id === r.route_id)?.route_name || 'Unknown',
                pickup_point: allPickupPoints.find(p => p._id === r.pickup_point_id)?.point_name || 'Unknown',
              }
            })} 
            columns={EXPORT_COLS} 
            filename="student-transport-fees" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No fees found" description="Add student transport fees to get started." actionLabel="Add Fees" onAction={() => setAddOpen(true)} />
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
            <DialogDescription>{editRow ? 'Update student transport fees' : 'Add transport fees for a student'}</DialogDescription>
          </DialogHeader>
          <StudentTransportFeesForm 
            initial={editRow} 
            students={allStudents}
            routes={allRoutes}
            pickupPoints={allPickupPoints}
            studentsLoading={studentsLoading}
            routesLoading={routesLoading}
            pickupPointsLoading={pickupPointsLoading}
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
          const student = allStudents.find(s => s._id === viewRow.student_id)
          const route = allRoutes.find(r => r._id === viewRow.route_id)
          const point = allPickupPoints.find(p => p._id === viewRow.pickup_point_id)
          const studentName = student?.name 
            ? (typeof student.name === 'string' ? student.name : `${student.name.first || ''} ${student.name.last || ''}`.trim())
            : 'Unknown'
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Student', value: studentName },
                { label: 'Route', value: route?.route_name || 'Unknown' },
                { label: 'Pickup Point', value: point?.point_name || 'Unknown' },
                { label: 'Fees Amount', value: `$${viewRow.fees_amount || 0}` },
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

function StudentTransportFeesForm({ initial, students, routes, pickupPoints, studentsLoading, routesLoading, pickupPointsLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    student_id: '',
    route_id: '',
    pickup_point_id: '',
    fees_amount: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        student_id: initial.student_id || '',
        route_id: initial.route_id || '',
        pickup_point_id: initial.pickup_point_id || '',
        fees_amount: initial.fees_amount || '',
      })
    } else {
      setFormData({
        student_id: students[0]?._id || '',
        route_id: routes[0]?._id || '',
        pickup_point_id: pickupPoints[0]?._id || '',
        fees_amount: '',
      })
    }
  }, [initial, students, routes, pickupPoints])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      fees_amount: Number(formData.fees_amount) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="student_id">Student *</Label>
        <select
          id="student_id"
          value={formData.student_id}
          onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
          disabled={studentsLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select student</option>
          {students.map((s) => {
            const studentName = s.name 
              ? (typeof s.name === 'string' ? s.name : `${s.name.first || ''} ${s.name.last || ''}`.trim())
              : 'Unknown'
            return <option key={s._id} value={s._id}>{studentName} ({s.student_id || 'No ID'})</option>
          })}
        </select>
      </div>
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
        <Label htmlFor="pickup_point_id">Pickup Point *</Label>
        <select
          id="pickup_point_id"
          value={formData.pickup_point_id}
          onChange={(e) => setFormData({ ...formData, pickup_point_id: e.target.value })}
          disabled={pickupPointsLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select pickup point</option>
          {pickupPoints.map((p) => (
            <option key={p._id} value={p._id}>{p.point_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="fees_amount">Fees Amount *</Label>
        <Input
          id="fees_amount"
          type="number"
          min="0"
          step="0.01"
          value={formData.fees_amount}
          onChange={(e) => setFormData({ ...formData, fees_amount: e.target.value })}
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
