import { useMemo, useState } from 'react'
import { ClipboardCheck, Calendar, CheckCircle, XCircle, Clock, AlertCircle, User } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAuth } from '@/context/AuthContext'
import { useAsyncData } from '@/hooks/useAsyncData'
import { studentPortalService } from '@/services/studentPortal.service'
import { formatDate, fullName } from '@/utils/format'

export default function MyLeaveRequestsPage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const studentName = user?.name ? fullName(user.name) : 'Unknown'
  const [search, setSearch] = useState('')

  // Fetch leave requests
  const { data: leaveData, isLoading: leaveLoading } = useAsyncData(
    () => studentId ? studentPortalService.getMyLeaveRequests(studentId) : Promise.resolve(null),
    [studentId]
  )

  // Filter leave requests by search
  const filteredLeaves = useMemo(() => {
    if (!Array.isArray(leaveData)) return []
    if (!search) return leaveData
    
    const searchLower = search.toLowerCase()
    return leaveData.filter(entry => {
      const reason = entry.reason || ''
      const status = entry.status || ''
      const fromDate = entry.from_date || ''
      const toDate = entry.to_date || ''
      
      return (
        reason.toLowerCase().includes(searchLower) ||
        status.toLowerCase().includes(searchLower) ||
        fromDate.toLowerCase().includes(searchLower) ||
        toDate.toLowerCase().includes(searchLower)
      )
    })
  }, [leaveData, search])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!Array.isArray(leaveData)) return { approved: 0, pending: 0, rejected: 0, total: 0 }
    
    return {
      approved: leaveData.filter(l => l.status === 'approved').length,
      pending: leaveData.filter(l => l.status === 'pending').length,
      rejected: leaveData.filter(l => l.status === 'rejected').length,
      total: leaveData.length,
    }
  }, [leaveData])

  const columns = useMemo(() => [
    {
      accessorKey: "student_id",
      header: "Student",
      cell: () => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{studentName}</span>
        </div>
      ),
    },
    {
      accessorKey: "from_date",
      header: "From",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.from_date ? formatDate(row.original.from_date) : '—'}</span>
      ),
    },
    {
      accessorKey: "to_date",
      header: "To",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.to_date ? formatDate(row.original.to_date) : '—'}</span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-xs truncate">{row.original.reason || '—'}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Applied On",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.createdAt ? formatDate(row.original.createdAt) : '—'}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status?.toLowerCase()
        const statusConfig = {
          approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Approved' },
          pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
          rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rejected' },
        }
        const config = statusConfig[status] || { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: status || 'Unknown' }
        const Icon = config.icon
        
        return (
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </div>
        )
      },
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

  if (leaveLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance' }, { label: 'My Leave Requests' }]} />
        <PageHeader
          title="My Leave Requests"
          description="View your leave request status."
          icon={ClipboardCheck}
        />
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance' }, { label: 'My Leave Requests' }]} />
      <PageHeader
        title="My Leave Requests"
        description="View the status of your leave applications."
        icon={ClipboardCheck}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Requests"
          value={stats.total}
          icon={ClipboardCheck}
          accent="primary"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={CheckCircle}
          accent="success"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          accent="warning"
        />
        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={XCircle}
          accent="destructive"
        />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by reason, status, or date..." className="max-w-sm" />

      {filteredLeaves.length === 0 ? (
        <NoData 
          title={search ? "No Results Found" : "No Leave Requests"} 
          description={search ? "Try adjusting your search terms." : "You haven't submitted any leave requests yet."} 
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredLeaves}
        />
      )}
    </div>
  )
}
