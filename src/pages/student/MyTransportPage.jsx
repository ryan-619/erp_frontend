import { useMemo } from 'react'
import { Bus, Route as RouteIcon, MapPin, Truck, IndianRupee, Clock } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { transportService } from '@/services/transport.service'
import { formatDate } from '@/utils/format'

export default function MyTransportPage() {
  const { user, role } = useAuth()
  const studentId = user?.id

  const { data: studentFees, isLoading } = useAsyncData(() => transportService.getStudentTransportFees(), [])
  const { data: routes } = useAsyncData(() => transportService.getTransportRoutes(), [])
  const { data: pickupPoints } = useAsyncData(() => transportService.getPickupPoints(), [])
  const { data: assignVehicles } = useAsyncData(() => transportService.getAssignVehicles(), [])
  const { data: vehicles } = useAsyncData(() => transportService.getVehicles(), [])

  const rows = studentFees || []
  const allRoutes = routes || []
  const allPickupPoints = pickupPoints || []
  const allAssignVehicles = assignVehicles || []
  const allVehicles = vehicles || []

  // Filter to get all transport records for this student
  const studentTransports = useMemo(() => rows.filter((r) => r.student_id === studentId), [rows, studentId])

  const transportDetails = useMemo(() => {
    if (studentTransports.length === 0) return null

    // Use the first record for basic details (route, pickup point, vehicle)
    const firstRecord = studentTransports[0]
    const route = allRoutes.find(r => r._id === firstRecord.route_id)
    const pickupPoint = allPickupPoints.find(p => p._id === firstRecord.pickup_point_id)
    
    // Find vehicle assigned to this route
    const assignVehicle = allAssignVehicles.find(av => av.route_id === firstRecord.route_id)
    const vehicle = assignVehicle ? allVehicles.find(v => v._id === assignVehicle.vehicle_id) : null

    // Sum up all fees from multiple records
    const totalFees = studentTransports.reduce((sum, r) => sum + (r.fees_amount || 0), 0)
    const paidFees = studentTransports.reduce((sum, r) => sum + (r.paid_amount || 0), 0)
    const dueFees = Math.max(0, totalFees - paidFees)

    return {
      route,
      pickupPoint,
      vehicle,
      totalFees,
      paidFees,
      dueFees,
      feeRecords: studentTransports,
      createdAt: firstRecord.createdAt,
    }
  }, [studentTransports, allRoutes, allPickupPoints, allAssignVehicles, allVehicles])

  const formatINR = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`
  }

  const feeColumns = useMemo(() => [
    {
      accessorKey: 'fees_amount',
      header: 'Fee Amount',
      cell: ({ row }) => formatINR(row.original.fees_amount),
    },
    {
      accessorKey: 'paid_amount',
      header: 'Paid Amount',
      cell: ({ row }) => {
        const paid = row.original.paid_amount
        if (paid === null || paid === undefined || paid === 0) {
          return <span className="text-muted-foreground">Not Paid</span>
        }
        return formatINR(paid)
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ], [])

  if (role !== 'student') {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">This page is only accessible to students.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }, { label: 'My Transport' }]} />
      <PageHeader
        title="My Transport"
        description="View your transport details and assigned vehicle."
        icon={Bus}
      />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : !transportDetails ? (
        <NoData title="No Transport Assigned" description="You haven't been assigned to any transport route yet." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Fees" value={formatINR(transportDetails.totalFees)} icon={IndianRupee} accent="primary" />
            <StatCard label="Paid" value={formatINR(transportDetails.paidFees)} icon={IndianRupee} accent="success" />
            <StatCard label="Due" value={formatINR(transportDetails.dueFees)} icon={IndianRupee} accent="destructive" />
            <StatCard label="Route" value={transportDetails.route?.route_name || 'N/A'} icon={RouteIcon} accent="chart2" />
          </div>

          <div className="rounded-lg border bg-card">
            <div className="border-b bg-muted/50 px-6 py-4">
              <h3 className="text-lg font-semibold">Transport Details</h3>
            </div>
            <div className="p-6">
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="py-4 text-sm text-muted-foreground w-1/3">
                      <div className="flex items-center gap-2">
                        <RouteIcon className="h-4 w-4" />
                        <span>Route</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium">{transportDetails.route?.route_name || 'N/A'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Pickup Point</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium">{transportDetails.pickupPoint?.point_name || 'N/A'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Pickup Time</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium">{transportDetails.pickupPoint?.pickup_time || 'N/A'}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <span>Vehicle Number</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium">{transportDetails.vehicle?.vehicle_number || 'Not Assigned'}</td>
                  </tr>
                  <tr>
                    <td className="py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4" />
                        <span>Vehicle Type</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium">{transportDetails.vehicle?.type || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border bg-card">
            <div className="border-b bg-muted/50 px-6 py-4">
              <h3 className="text-lg font-semibold">Fee Records</h3>
            </div>
            <DataTable
              columns={feeColumns}
              data={transportDetails.feeRecords}
            />
          </div>
        </>
      )}
    </div>
  )
}
