// ====================================================================
// Custom Hook
//
// Purpose:
// Contains business logic for this module.
//
// Responsibilities:
// - Search
// - Filter
// - Sorting
// - CRUD orchestration
//
// Keeps page components focused on UI.
// ====================================================================

import { useMemo, useState, useCallback } from 'react'
import { attendanceService } from '@/services/attendance.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'


// ─── useStudentAttendance ──────────────────────────────────────────────────────
// Manages student attendance list, filtering, stats, and mark/bulk operations.
export function useStudentAttendance() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => attendanceService.list(), [])

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  
  const deleteAttendance = useCallback(
  async (id) => {
    await attendanceService.remove(id)
    toast({
      title: "Attendance deleted",
    })
    refetch()
  },
  [refetch, toast]
)

  const rows = data || []

  // useMemo prevents recalculating filtered attendance
  // unless list or filters change.
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        let name, rollNumber
        if (typeof r.student_id === 'object' && r.student_id !== null) {
          name = r.student_id.name ? `${r.student_id.name.first} ${r.student_id.name.last}` : ''
          rollNumber = r.student_id.roll_number || ''
        } else {
          // student_id is a string ID - we can't look it up here without the map
          name = ''
          rollNumber = ''
        }
        
        const q = search.toLowerCase()
        const matchSearch = !q || name.toLowerCase().includes(q) || rollNumber.toLowerCase().includes(q)
        const matchClass = classFilter === 'all' || r.class_id === classFilter
        const matchSection = sectionFilter === 'all' || r.section === sectionFilter
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        const matchDate = !dateFilter || r.attendance_date === dateFilter
        return matchSearch && matchClass && matchSection && matchStatus && matchDate
      }),
    [rows, search, classFilter, sectionFilter, statusFilter, dateFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      present: rows.filter((r) => r.status === 'present').length,
      absent: rows.filter((r) => r.status === 'absent').length,
      leave: rows.filter((r) => r.status === 'leave').length,
      late: rows.filter((r) => r.status === 'late').length,
    }),
    [rows],
  )

  const markStatus = useCallback(
    async (row, status) => {
      await attendanceService.markAttendance(row._id, { status })
      const name = row.student_id?.name ? `${row.student_id.name.first} ${row.student_id.name.last}` : 'Student'
      toast({ title: 'Attendance marked', description: `${name} marked ${status}.` })
      refetch()
    },
    [refetch, toast],
  )

  const bulkMark = useCallback(
    async (selected, status) => {
      await attendanceService.bulkMark({ ids: selected.map((r) => r._id), status })
      toast({ title: `${selected.length} students marked ${status}` })
      refetch()
    },
    [refetch, toast],
  )

  const updateAttendance = useCallback(
    async (id, payload) => {
      await attendanceService.markAttendance(id, { status: payload.status })
      toast({ title: 'Attendance updated' })
      refetch()
    },
    [refetch, toast],
  )

  const createAttendance = useCallback(
    async (payload) => {
      await attendanceService.create(payload)
      toast({ title: 'Attendance created' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allAttendance: rows,
    stats,
    isLoading,
    search, setSearch,
    classFilter, setClassFilter,
    sectionFilter, setSectionFilter,
    statusFilter, setStatusFilter,
    dateFilter, setDateFilter,
    markStatus,
    bulkMark,
    updateAttendance,
    createAttendance,
    deleteAttendance,
  }
}

// ─── useAttendanceByDate ────────────────────────────────────────────────────────
// Manages attendance records for a specific date.
export function useAttendanceByDate(date) {
  const { data, isLoading, refetch } = useAsyncData(
    () => attendanceService.byDate(date),
    [date],
  )

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const name = r.student_id?.name ? `${r.student_id.name.first} ${r.student_id.name.last}` : ''
        const q = search.toLowerCase()
        const matchSearch = !q || name.toLowerCase().includes(q) || r.student_id?.roll_number?.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        return matchSearch && matchStatus
      }),
    [rows, search, statusFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      present: rows.filter((r) => r.status === 'present').length,
      absent: rows.filter((r) => r.status === 'absent').length,
      leave: rows.filter((r) => r.status === 'leave').length,
      late: rows.filter((r) => r.status === 'late').length,
    }),
    [rows],
  )

  return {
    rows: filtered,
    allAttendance: rows,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    refetch,
  }
}

// ─── useLeaveApprovals ──────────────────────────────────────────────────────────
// Manages student leave applications list, filtering, stats, and approve/reject.
export function useLeaveApprovals() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => attendanceService.leaves(), [])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const rows = data || []

  // useMemo prevents recalculating filtered leave applications
  // unless list or filters change.
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.student_id?.toLowerCase().includes(q)
        const matchStatus = status === 'all' || r.status === status
        const matchFrom = !fromDate || new Date(r.from_date) >= new Date(fromDate)
        const matchTo = !toDate || new Date(r.to_date) <= new Date(toDate)
        return matchSearch && matchStatus && matchFrom && matchTo
      }),
    [rows, search, status, fromDate, toDate],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((r) => r.status === 'pending').length,
      approved: rows.filter((r) => r.status === 'approved').length,
      rejected: rows.filter((r) => r.status === 'rejected').length,
    }),
    [rows],
  )

  const approveLeave = useCallback(
    async (app) => {
      await attendanceService.updateLeave(app._id, { status: 'approved' })
      toast({ title: 'Leave approved', description: 'Leave has been approved.' })
      refetch()
    },
    [refetch, toast],
  )

  const rejectLeave = useCallback(
    async (app) => {
      await attendanceService.updateLeave(app._id, { status: 'rejected' })
      toast({ title: 'Leave rejected', description: 'Leave has been rejected.' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allLeaves: rows,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    classFilter, setClassFilter,
    sectionFilter, setSectionFilter,
    fromDate, setFromDate,
    toDate, setToDate,
    approveLeave,
    rejectLeave,
    refetch,
  }

  return {
    rows: filtered,
    allLeaves: rows,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    classFilter, setClassFilter,
    sectionFilter, setSectionFilter,
    fromDate, setFromDate,
    toDate, setToDate,
    approveLeave,
    rejectLeave,
    
  }
}
