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
import { hrService } from '@/services/hr.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/utils/format'

// ─── useStaff ───────────────────────────────────────────────────────────────────
// Manages staff directory list, filtering, stats, and CRUD operations.
export function useStaff() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hrService.getStaff(), [])

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // Filter rows based on search query, department and status
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchSearch =
          !search ||
          (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.email || '').toLowerCase().includes(search.toLowerCase()) ||
          (r.employee_id || '').toLowerCase().includes(search.toLowerCase())
        const matchDept = deptFilter === 'all' || r.department_id === deptFilter
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        return matchSearch && matchDept && matchStatus
      }),
    [rows, search, deptFilter, statusFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      inactive: rows.filter((r) => r.status === 'inactive').length,
      departments: new Set(rows.map((r) => r.department_id)).size,
    }),
    [rows],
  )

  const deptOptions = useMemo(() => [...new Set(rows.map((r) => r.department_id))], [rows])

  const saveStaff = useCallback(
    async (payload, id) => {
      try {
        if (id) {
          await hrService.updateStaff(id, payload)
          toast({ title: 'Staff updated', description: payload.name })
        } else {
          await hrService.createStaff(payload)
          toast({ title: 'Staff added', description: payload.name })
        }
        await refetch()
      } catch (error) {
        console.error('Failed to save staff:', error)
        toast({
          title: 'Failed to save staff',
          variant: 'destructive',
        })
        throw error
      }
    },
    [refetch, toast],
  )

  const deleteStaff = useCallback(
    async (id, name) => {
      try {
        await hrService.deleteStaff(id)
        toast({ title: 'Staff deleted', description: `${name} has been removed.` })
        await refetch()
      } catch (error) {
        console.error('Failed to delete staff:', error)
        toast({
          title: 'Failed to delete staff',
          variant: 'destructive',
        })
        throw error
      }
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allStaff: rows,
    stats,
    deptOptions,
    isLoading,
    search, setSearch,
    deptFilter, setDeptFilter,
    statusFilter, setStatusFilter,
    saveStaff,
    deleteStaff,
  }
}

// ─── useDepartments ──────────────────────────────────────────────────────────────
// Manages departments list, filtering, stats, and CRUD operations.
export function useDepartments() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hrService.getDepartments(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchSearch =
          !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        return matchSearch && matchStatus
      }),
    [rows, search, statusFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      totalStaff: rows.reduce((s, r) => s + (r.staff_count || 0), 0),
      inactive: rows.filter((r) => r.status !== 'active').length,
    }),
    [rows],
  )

  const saveDepartment = useCallback(
    async (payload, id) => {
      if (id) {
        await hrService.updateDepartment(id, payload)
        toast({ title: 'Department updated', description: payload.name })
      } else {
        await hrService.createDepartment(payload)
        toast({ title: 'Department created', description: payload.name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteDepartment = useCallback(
    async (id) => {
      await hrService.deleteDepartment(id)
      toast({ title: 'Department deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allDepartments: rows,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveDepartment,
    deleteDepartment,
  }
}

// ─── useDesignations ─────────────────────────────────────────────────────────────
// Manages designations list, filtering, and CRUD operations.
export function useDesignations() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hrService.getDesignations(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        return !q || (r.name || '').toLowerCase().includes(q)
      }),
    [rows, search],
  )

  const saveDesignation = useCallback(
    async (payload, id) => {
      if (id) {
        await hrService.updateDesignation(id, payload)
        toast({ title: 'Designation updated', description: payload.name })
      } else {
        await hrService.createDesignation(payload)
        toast({ title: 'Designation added', description: payload.name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteDesignation = useCallback(
    async (id) => {
      await hrService.deleteDesignation(id)
      toast({ title: 'Designation deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allDesignations: rows,
    isLoading,
    search, setSearch,
    saveDesignation,
    deleteDesignation,
  }
}

// ─── useLeaveTypes ────────────────────────────────────────────────────────────────
// Manages leave types list, filtering, and CRUD operations.
export function useLeaveTypes() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hrService.getLeaveTypes(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        return !q || (r.leave_type || '').toLowerCase().includes(q)
      }),
    [rows, search],
  )

  const saveLeaveType = useCallback(
    async (payload, id) => {
      if (id) {
        await hrService.updateLeaveType(id, payload)
        toast({ title: 'Leave type updated', description: payload.leave_type })
      } else {
        await hrService.createLeaveType(payload)
        toast({ title: 'Leave type added', description: payload.leave_type })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteLeaveType = useCallback(
    async (id) => {
      await hrService.deleteLeaveType(id)
      toast({ title: 'Leave type deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allLeaveTypes: rows,
    isLoading,
    search, setSearch,
    saveLeaveType,
    deleteLeaveType,
  }
}

// ─── useStaffLeaves ──────────────────────────────────────────────────────────────
// Manages staff leave applications list, filtering, stats, and approve/reject.
export function useStaffLeaves() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hrService.getLeaves(), [])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.staff_name.toLowerCase().includes(q) || r.employee_id.toLowerCase().includes(q)
        const matchStatus = status === 'all' || r.status === status
        const matchDept = deptFilter === 'all' || r.department === deptFilter
        return matchSearch && matchStatus && matchDept
      }),
    [rows, search, status, deptFilter],
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
    async (id) => {
      await hrService.approveLeave(id)
      toast({ title: 'Leave approved' })
      refetch()
    },
    [refetch, toast],
  )

  const rejectLeave = useCallback(
    async (id) => {
      await hrService.rejectLeave(id)
      toast({ title: 'Leave rejected' })
      refetch()
    },
    [refetch, toast],
  )

  const applyLeave = useCallback(
    async (payload) => {
      await hrService.applyLeave(payload)
      toast({ title: 'Leave applied' })
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
    deptFilter, setDeptFilter,
    approveLeave,
    rejectLeave,
    applyLeave,
  }
}

// ─── useStaffAttendance ──────────────────────────────────────────────────────────
// Manages staff attendance list, filtering, stats, and mark/bulk operations.
export function useStaffAttendance() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hrService.getAttendance(), [])

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.name.toLowerCase().includes(q) || r.employee_id.toLowerCase().includes(q)
        const matchDept = deptFilter === 'all' || r.department === deptFilter
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        return matchSearch && matchDept && matchStatus
      }),
    [rows, search, deptFilter, statusFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      present: rows.filter((r) => r.status === 'present').length,
      absent: rows.filter((r) => r.status === 'absent').length,
      leave: rows.filter((r) => r.status === 'leave').length,
    }),
    [rows],
  )

  const markStatus = useCallback(
    async (id, status) => {
      await hrService.markAttendance(id, status)
      toast({ title: 'Attendance marked', description: `Marked ${status}.` })
      refetch()
    },
    [refetch, toast],
  )

  const bulkMark = useCallback(
    async (selected, status) => {
      await hrService.bulkMarkAttendance(selected.map((r) => r._id), status)
      toast({ title: `${selected.length} staff marked ${status}` })
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
    deptFilter, setDeptFilter,
    statusFilter, setStatusFilter,
    markStatus,
    bulkMark,
  }
}

// ─── usePayroll ──────────────────────────────────────────────────────────────────
// Manages monthly payroll list, filtering, summary, and payment processing.
export function usePayroll(month) {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hrService.getPayroll(month), [month])

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  const deptOptions = useMemo(() => [...new Set(rows.map((r) => r.department))], [rows])

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchSearch =
          !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.employee_id.toLowerCase().includes(search.toLowerCase())
        const matchDept = deptFilter === 'all' || r.department === deptFilter
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        return matchSearch && matchDept && matchStatus
      }),
    [rows, search, deptFilter, statusFilter],
  )

  // Aggregate salary totals for the summary cards
  const summary = useMemo(
    () => ({
      totalGross: rows.reduce((a, b) => a + b.basic_salary + b.total_allowances, 0),
      totalNet: rows.reduce((a, b) => a + b.net_salary, 0),
      totalDeductions: rows.reduce((a, b) => a + b.total_deductions, 0),
      paid: rows.filter((r) => r.status === 'paid').length,
      pending: rows.filter((r) => r.status === 'pending').length,
    }),
    [rows],
  )

  const processPayment = useCallback(
    async (row) => {
      await hrService.processPayment(row._id)
      toast({ title: 'Payment processed', description: `${row.name} — ${formatCurrency(row.net_salary)}` })
      refetch()
    },
    [refetch, toast],
  )

  const bulkProcess = useCallback(
    async (selected) => {
      await hrService.bulkProcessPayment(selected.map((r) => r._id))
      toast({ title: `${selected.length} payments processed` })
      refetch()
    },
    [refetch, toast],
  )

  const generate = useCallback(
    async () => {
      await hrService.generatePayroll(month)
      toast({ title: `Payroll generated for ${month}` })
      refetch()
    },
    [refetch, toast, month],
  )

  return {
    rows: filtered,
    allPayroll: rows,
    summary,
    deptOptions,
    isLoading,
    search, setSearch,
    deptFilter, setDeptFilter,
    statusFilter, setStatusFilter,
    processPayment,
    bulkProcess,
    generate,
  }
}

// ─── useTeachersRating ───────────────────────────────────────────────────────────
// Manages teachers rating list, filtering, and submit/update operations.
export function useTeachersRating() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hrService.getTeachersRating(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        return !q || (r.name || '').toLowerCase().includes(q) || (r.department || '').toLowerCase().includes(q)
      }),
    [rows, search],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      avgRating: rows.length ? (rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length).toFixed(1) : 0,
    }),
    [rows],
  )

  const submitRating = useCallback(
    async (payload) => {
      await hrService.submitRating(payload)
      toast({ title: 'Rating submitted' })
      refetch()
    },
    [refetch, toast],
  )

  const updateRating = useCallback(
    async (id, payload) => {
      await hrService.updateRating(id, payload)
      toast({ title: 'Rating updated' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allRatings: rows,
    stats,
    isLoading,
    search, setSearch,
    submitRating,
    updateRating,
  }
}

// ─── useDisabledStaff ────────────────────────────────────────────────────────────
// Manages disabled/inactive staff list, filtering, and restore operations.
export function useDisabledStaff() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hrService.getDisabledStaff(), [])

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.name.toLowerCase().includes(q) || r.employee_id.toLowerCase().includes(q)
        const matchDept = deptFilter === 'all' || r.department === deptFilter
        return matchSearch && matchDept
      }),
    [rows, search, deptFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      departments: new Set(rows.map((r) => r.department)).size,
    }),
    [rows],
  )

  const restore = useCallback(
    async (id) => {
      await hrService.restoreStaff(id)
      toast({ title: 'Staff restored' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allDisabledStaff: rows,
    stats,
    isLoading,
    search, setSearch,
    deptFilter, setDeptFilter,
    restore,
  }
}
