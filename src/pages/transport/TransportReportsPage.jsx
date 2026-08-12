// ====================================================================
// Module: Transport
// Page: Transport Reports
//
// Purpose:
// Multi-tab reports for students, routes, vehicles, fees, and occupancy.
//
// Data Source:
// transport.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { ChartBar as FileBarChart, Users, Route as RouteIcon, Bus, DollarSign, Gauge, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { DataTable } from '@/components/DataTable'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { CapacityIndicator } from '@/components/CapacityIndicator'
import { FeeStatusBadge } from '@/components/FeeStatusBadge'
import { useAsyncData } from '@/hooks/useAsyncData'
import { transportService } from '@/services/transport.service'
import { formatCurrency } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

export default function TransportReportsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('student')

  // Fetch all report data — each tab uses a different dataset.
  const { data: studentData, isLoading: studentLoading } = useAsyncData(() => transportService.getStudentReport(), [])
  const { data: routeData, isLoading: routeLoading } = useAsyncData(() => transportService.getRouteReport(), [])
  const { data: vehicleData, isLoading: vehicleLoading } = useAsyncData(() => transportService.getVehicleReport(), [])
  const { data: feeData, isLoading: feeLoading } = useAsyncData(() => transportService.getFeeCollectionReport(), [])
  const { data: assignmentData } = useAsyncData(() => transportService.getVehicleAssignments(), [])

  const handlePrint = () => {
    window.print()
  }

  // ─── Student-wise report columns ────────────────────────────────────────────
  const studentColumns = useMemo(() => [
    { accessorKey: 'student_name', header: 'Student' },
    { accessorKey: 'admission_no', header: 'Admission No' },
    { accessorKey: 'class', header: 'Class', cell: ({ row }) => <Badge variant="outline">{row.original.class}</Badge> },
    { accessorKey: 'vehicle_number', header: 'Vehicle' },
    { accessorKey: 'route_name', header: 'Route', cell: ({ row }) => <Badge variant="secondary">{row.original.route_name}</Badge> },
    { accessorKey: 'pickup_point_name', header: 'Pickup Point' },
  ], [])

  const studentExportCols = [
    { key: 'student_name', label: 'Student' },
    { key: 'admission_no', label: 'Admission No' },
    { key: 'class', label: 'Class' },
    { key: 'vehicle_number', label: 'Vehicle' },
    { key: 'route_name', label: 'Route' },
    { key: 'pickup_point_name', label: 'Pickup Point' },
  ]

  // ─── Route-wise report columns ──────────────────────────────────────────────
  // Build route-wise stats by counting students per route from assignments.
  const routeReport = useMemo(() => {
    if (!routeData || !assignmentData) return []
    return routeData.map((r) => {
      const students = assignmentData.filter((a) => a.route_id === r._id)
      return {
        ...r,
        students_count: students.length,
        vehicle: vehicleData?.find((v) => v.route_id === r._id)?.vehicle_number || '—',
      }
    })
  }, [routeData, assignmentData, vehicleData])

  const routeColumns = useMemo(() => [
    { accessorKey: 'name', header: 'Route' },
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <Badge variant="outline">{row.original.code}</Badge> },
    { accessorKey: 'distance', header: 'Distance', cell: ({ row }) => `${row.original.distance} km` },
    { accessorKey: 'driver_name', header: 'Driver', cell: ({ row }) => row.original.driver_name || '—' },
    { accessorKey: 'vehicle', header: 'Vehicle' },
    { accessorKey: 'students_count', header: 'Students', cell: ({ row }) => <Badge variant="secondary">{row.original.students_count}</Badge> },
  ], [])

  const routeExportCols = [
    { key: 'name', label: 'Route' },
    { key: 'code', label: 'Code' },
    { key: 'distance', label: 'Distance (km)' },
    { key: 'driver_name', label: 'Driver' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'students_count', label: 'Students' },
  ]

  // ─── Vehicle-wise report columns ────────────────────────────────────────────
  const vehicleColumns = useMemo(() => [
    { accessorKey: 'vehicle_number', header: 'Vehicle' },
    { accessorKey: 'registration_number', header: 'Registration', cell: ({ row }) => <span className="font-mono text-xs">{row.original.registration_number}</span> },
    { accessorKey: 'driver_name', header: 'Driver', cell: ({ row }) => row.original.driver_name || '—' },
    { accessorKey: 'route_name', header: 'Route', cell: ({ row }) => row.original.route_name ? <Badge variant="secondary">{row.original.route_name}</Badge> : '—' },
    { accessorKey: 'capacity', header: 'Occupancy', cell: ({ row }) => <CapacityIndicator occupied={row.original.occupied} capacity={row.original.capacity} className="w-28" /> },
  ], [])

  const vehicleExportCols = [
    { key: 'vehicle_number', label: 'Vehicle' },
    { key: 'registration_number', label: 'Registration' },
    { key: 'driver_name', label: 'Driver' },
    { key: 'route_name', label: 'Route' },
    { key: 'occupied', label: 'Occupied' },
    { key: 'capacity', label: 'Capacity' },
  ]

  // ─── Fee collection report columns ──────────────────────────────────────────
  const feeColumns = useMemo(() => [
    { accessorKey: 'student_name', header: 'Student' },
    { accessorKey: 'admission_no', header: 'Admission No' },
    { accessorKey: 'route_name', header: 'Route', cell: ({ row }) => <Badge variant="secondary">{row.original.route_name}</Badge> },
    { accessorKey: 'total_amount', header: 'Total', cell: ({ row }) => formatCurrency(row.original.total_amount) },
    { accessorKey: 'paid_amount', header: 'Paid', cell: ({ row }) => <span className="text-success font-medium">{formatCurrency(row.original.paid_amount)}</span> },
    { accessorKey: 'due_amount', header: 'Due', cell: ({ row }) => row.original.due_amount > 0 ? <span className="text-destructive font-medium">{formatCurrency(row.original.due_amount)}</span> : '—' },
    { accessorKey: 'fee_status', header: 'Status', cell: ({ row }) => <FeeStatusBadge status={row.original.fee_status} /> },
  ], [])

  const feeExportCols = [
    { key: 'student_name', label: 'Student' },
    { key: 'admission_no', label: 'Admission No' },
    { key: 'route_name', label: 'Route' },
    { key: 'total_amount', label: 'Total' },
    { key: 'paid_amount', label: 'Paid' },
    { key: 'due_amount', label: 'Due' },
    { key: 'fee_status', label: 'Status' },
  ]

  // ─── Occupancy report columns ───────────────────────────────────────────────
  const occupancyColumns = useMemo(() => [
    { accessorKey: 'vehicle_number', header: 'Vehicle' },
    { accessorKey: 'route_name', header: 'Route', cell: ({ row }) => row.original.route_name ? <Badge variant="secondary">{row.original.route_name}</Badge> : '—' },
    { accessorKey: 'capacity', header: 'Capacity' },
    { accessorKey: 'occupied', header: 'Occupied' },
    { accessorKey: 'occupancy_pct', header: 'Occupancy %', cell: ({ row }) => {
      const pct = row.original.capacity > 0 ? Math.round((row.original.occupied / row.original.capacity) * 100) : 0
      return <CapacityIndicator occupied={row.original.occupied} capacity={row.original.capacity} className="w-28" />
    } },
  ], [])

  const occupancyExportCols = [
    { key: 'vehicle_number', label: 'Vehicle' },
    { key: 'route_name', label: 'Route' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'occupied', label: 'Occupied' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }, { label: 'Reports' }]} />
      <PageHeader
        title="Transport Reports"
        description="Student-wise, route-wise, vehicle-wise, fee collection, and occupancy reports."
        icon={FileBarChart}
        actions={<Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="student"><Users className="mr-1.5 h-3.5 w-3.5" /> Student-wise</TabsTrigger>
          <TabsTrigger value="route"><RouteIcon className="mr-1.5 h-3.5 w-3.5" /> Route-wise</TabsTrigger>
          <TabsTrigger value="vehicle"><Bus className="mr-1.5 h-3.5 w-3.5" /> Vehicle-wise</TabsTrigger>
          <TabsTrigger value="fee"><DollarSign className="mr-1.5 h-3.5 w-3.5" /> Fee Collection</TabsTrigger>
          <TabsTrigger value="occupancy"><Gauge className="mr-1.5 h-3.5 w-3.5" /> Occupancy</TabsTrigger>
        </TabsList>

        {/* Student-wise report */}
        <TabsContent value="student" className="space-y-4">
          <div className="flex justify-end">
            <ExportButtons rows={studentData || []} columns={studentExportCols} filename="transport-student-report" />
          </div>
          {studentLoading ? (
            <LoadingSkeleton variant="table" rows={5} cols={6} />
          ) : (
            <DataTable columns={studentColumns} data={studentData || []} enableExport={false} />
          )}
        </TabsContent>

        {/* Route-wise report */}
        <TabsContent value="route" className="space-y-4">
          <div className="flex justify-end">
            <ExportButtons rows={routeReport} columns={routeExportCols} filename="transport-route-report" />
          </div>
          {routeLoading ? (
            <LoadingSkeleton variant="table" rows={5} cols={6} />
          ) : (
            <DataTable columns={routeColumns} data={routeReport} enableExport={false} />
          )}
        </TabsContent>

        {/* Vehicle-wise report */}
        <TabsContent value="vehicle" className="space-y-4">
          <div className="flex justify-end">
            <ExportButtons rows={vehicleData || []} columns={vehicleExportCols} filename="transport-vehicle-report" />
          </div>
          {vehicleLoading ? (
            <LoadingSkeleton variant="table" rows={5} cols={5} />
          ) : (
            <DataTable columns={vehicleColumns} data={vehicleData || []} enableExport={false} />
          )}
        </TabsContent>

        {/* Fee collection report */}
        <TabsContent value="fee" className="space-y-4">
          <div className="flex justify-end">
            <ExportButtons rows={feeData || []} columns={feeExportCols} filename="transport-fee-report" />
          </div>
          {feeLoading ? (
            <LoadingSkeleton variant="table" rows={5} cols={7} />
          ) : (
            <DataTable columns={feeColumns} data={feeData || []} enableExport={false} />
          )}
        </TabsContent>

        {/* Occupancy report */}
        <TabsContent value="occupancy" className="space-y-4">
          <div className="flex justify-end">
            <ExportButtons rows={vehicleData || []} columns={occupancyExportCols} filename="transport-occupancy-report" />
          </div>
          {vehicleLoading ? (
            <LoadingSkeleton variant="table" rows={5} cols={5} />
          ) : (
            <DataTable columns={occupancyColumns} data={vehicleData || []} enableExport={false} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
