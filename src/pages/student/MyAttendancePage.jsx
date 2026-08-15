import { useMemo, useState, useEffect } from 'react'
import { ClipboardCheck, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
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
import { attendanceService } from '@/services/attendance.service'
import { formatDate } from '@/utils/format'

export default function MyAttendancePage() {
  const { user, role } = useAuth()
  const studentId = user?.id
  const [search, setSearch] = useState('')

  // Fetch attendance data
  const { data: attendanceData, isLoading: attendanceLoading } = useAsyncData(
    () => studentId ? studentPortalService.getMyAttendance(studentId) : Promise.resolve(null),
    [studentId]
  )

  // Filter attendance by search
  const filteredAttendance = useMemo(() => {
    if (!Array.isArray(attendanceData)) return []
    if (!search) return attendanceData
    
    const searchLower = search.toLowerCase()
    return attendanceData.filter(entry => {
      const date = entry.date || ''
      const status = entry.status || ''
      const remark = entry.remark || ''
      
      return (
        date.toLowerCase().includes(searchLower) ||
        status.toLowerCase().includes(searchLower) ||
        remark.toLowerCase().includes(searchLower)
      )
    })
  }, [attendanceData, search])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!Array.isArray(attendanceData)) return { present: 0, absent: 0, late: 0, total: 0 }
    
    return {
      present: attendanceData.filter(a => a.status === 'present').length,
      absent: attendanceData.filter(a => a.status === 'absent').length,
      late: attendanceData.filter(a => a.status === 'late').length,
      total: attendanceData.length,
    }
  }, [attendanceData])

  const columns = useMemo(() => [
    {
      accessorKey: "attendance_date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.original.attendance_date || row.original.date
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{date ? formatDate(date) : '—'}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status?.toLowerCase()
        const statusConfig = {
          present: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Present' },
          absent: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Absent' },
          late: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Late' },
          half_day: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Half Day' },
        }
        const config = statusConfig[status] || { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', label: status || 'Unknown' }
        const Icon = config.icon
        
        return (
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </div>
        )
      },
    },
    {
      accessorKey: "remarks",
      header: "Remark",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.remarks || row.original.remark || '—'}</span>
      ),
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

  if (attendanceLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance' }, { label: 'My Attendance' }]} />
        <PageHeader
          title="My Attendance"
          description="View your attendance record."
          icon={ClipboardCheck}
        />
        <LoadingSkeleton variant="table" rows={6} cols={5} />
      </div>
    )
  }

  const attendancePercentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance' }, { label: 'My Attendance' }]} />
      <PageHeader
        title="My Attendance"
        description="View your attendance record and statistics."
        icon={ClipboardCheck}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Days"
          value={stats.total}
          icon={Calendar}
          accent="primary"
        />
        <StatCard
          label="Present"
          value={stats.present}
          icon={CheckCircle}
          accent="success"
        />
        <StatCard
          label="Absent"
          value={stats.absent}
          icon={XCircle}
          accent="destructive"
        />
        <StatCard
          label="Attendance %"
          value={`${attendancePercentage}%`}
          icon={ClipboardCheck}
          accent="info"
        />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by date or status..." className="max-w-sm" />

      {filteredAttendance.length === 0 ? (
        <NoData 
          title={search ? "No Results Found" : "No Attendance Records"} 
          description={search ? "Try adjusting your search terms." : "Your attendance records will appear here once marked."} 
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredAttendance}
        />
      )}
    </div>
  )
}
