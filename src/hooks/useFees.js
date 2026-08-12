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
import { feesService } from '@/services/fees.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/utils/format'

// ─── useFeesCollection ──────────────────────────────────────────────────────────
// Manages fee collection list, student search, and payment collection.
export function useFeesCollection() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getFeesCollection(), [])

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered fee records
  // unless list or filters change.
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch =
          !q ||
          (r.fees_group_name || '').toLowerCase().includes(q) ||
          (r.fees_group_type || '').toLowerCase().includes(q)
        const matchClass = classFilter === 'all' || r.class === classFilter
        const matchStatus = true
        return matchSearch && matchClass && matchStatus
      }),
    [rows, search, classFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.length,
    }),
    [rows],
  )

  const collectPayment = useCallback(
    async (payload) => {
      await feesService.collectPayment(payload)
      toast({ title: 'Payment collected', description: formatCurrency(payload.amount) })
      refetch()
    },
    [refetch, toast],
  )

  const searchStudents = useCallback(
    async (query) => {
      const results = await feesService.searchStudents(query)
      return results
    },
    [],
  )

  return {
    rows: filtered,
    allFees: rows,
    stats,
    isLoading,
    search, setSearch,
    classFilter, setClassFilter,
    statusFilter, setStatusFilter,
    collectPayment,
    searchStudents,
  }
}

// ─── useFeesGroups ──────────────────────────────────────────────────────────────
// Manages fees groups list, filtering, stats, and CRUD operations.
export function useFeesGroups() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getFeesGroups(), [])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch =
          !q ||
          (r.fees_group_name || '').toLowerCase().includes(q) ||
          (r.fees_group_type || '').toLowerCase().includes(q)
        const matchStatus = status === 'all' || r.status === status
        return matchSearch && matchStatus
      }),
    [rows, search, status],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.length,
    }),
    [rows],
  )

  const saveGroup = useCallback(
    async (payload, id) => {
      if (id) {
        await feesService.updateFeesGroup(id, payload)
        toast({
  title: 'Group updated',
  description: payload.fees_group_name,
})
      } else {
        await feesService.createFeesGroup(payload)
        toast({
          title: 'Group added',
          description: payload.fees_group_name,
        })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteGroup = useCallback(
    async (id) => {
      await feesService.deleteFeesGroup(id)
      toast({ title: 'Group deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allGroups: rows,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    saveGroup,
    deleteGroup,
  }
}

// ─── useFeesTypes ──────────────────────────────────────────────────────────────
// Manages fees types list, filtering, and CRUD operations.
export function useFeesTypes() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getFeesTypes(), [])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
        const matchStatus = status === 'all' || r.status === status
        return matchSearch && matchStatus
      }),
    [rows, search, status],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
    }),
    [rows],
  )

  const saveType = useCallback(
    async (payload, id) => {
      if (id) {
        await feesService.updateFeesType(id, payload)
        toast({ title: 'Fee type updated', description: payload.fees_type_name })
      } else {
        await feesService.createFeesType(payload)
        toast({ title: 'Fee type added', description: payload.fees_type_name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteType = useCallback(
    async (id) => {
      await feesService.deleteFeesType(id)
      toast({ title: 'Fee type deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allTypes: rows,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    saveType,
    deleteType,
  }
}

// ─── useFeesMaster ──────────────────────────────────────────────────────────────
// Manages fees master list, filtering, and CRUD operations.
export function useFeesMaster() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getFeesMaster(), [])

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.name.toLowerCase().includes(q) || (r.class || '').toLowerCase().includes(q)
        const matchClass = classFilter === 'all' || r.class === classFilter
        return matchSearch && matchClass
      }),
    [rows, search, classFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      classes: new Set(rows.map((r) => r.class)).size,
    }),
    [rows],
  )

  const saveMaster = useCallback(
    async (payload, id) => {
      if (id) {
        await feesService.updateFeesMaster(id, payload)
        toast({ title: 'Fees master updated', description: payload.fees_master_name })
      } else {
        await feesService.createFeesMaster(payload)
        toast({ title: 'Fees master added', description: payload.fees_master_name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteMaster = useCallback(
    async (id) => {
      await feesService.deleteFeesMaster(id)
      toast({ title: 'Fees master deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allMaster: rows,
    stats,
    isLoading,
    search, setSearch,
    classFilter, setClassFilter,
    saveMaster,
    deleteMaster,
  }
}

// ─── useFeesDiscounts ───────────────────────────────────────────────────────────
// Manages fees discounts list, filtering, and CRUD operations.
export function useFeesDiscounts() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getFeesDiscounts(), [])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.name.toLowerCase().includes(q) || (r.student_name || '').toLowerCase().includes(q)
        const matchStatus = status === 'all' || r.status === status
        return matchSearch && matchStatus
      }),
    [rows, search, status],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      totalDiscount: rows.reduce((s, r) => s + (r.amount || 0), 0),
    }),
    [rows],
  )

  const saveDiscount = useCallback(
    async (payload, id) => {
      if (id) {
        await feesService.updateFeesDiscount(id, payload)
        toast({ title: 'Discount updated', description: payload.discount_name })
      } else {
        await feesService.createFeesDiscount(payload)
        toast({ title: 'Discount added', description: payload.discount_name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteDiscount = useCallback(
    async (id) => {
      await feesService.deleteFeesDiscount(id)
      toast({ title: 'Discount deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allDiscounts: rows,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    saveDiscount,
    deleteDiscount,
  }
}

// ─── useFeesCarryForward ────────────────────────────────────────────────────────
// Manages fees carry-forward records list, filtering, and CRUD operations.
export function useFeesCarryForward() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getCarryForward(), [])

  const [search, setSearch] = useState('')
  const [session, setSession] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.student_name.toLowerCase().includes(q) || r.admission_no.toLowerCase().includes(q)
        const matchSession = session === 'all' || r.session === session
        return matchSearch && matchSession
      }),
    [rows, search, session],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      totalAmount: rows.reduce((s, r) => s + (r.amount || 0), 0),
    }),
    [rows],
  )

  const saveCarryForward = useCallback(
    async (payload, id) => {
      if (id) {
        await feesService.updateCarryForward(id, payload)
        toast({ title: 'Carry forward updated' })
      } else {
        await feesService.createCarryForward(payload)
        toast({ title: 'Carry forward added' })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteCarryForward = useCallback(
    async (id) => {
      await feesService.deleteCarryForward(id)
      toast({ title: 'Carry forward record deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allCarryForward: rows,
    stats,
    isLoading,
    search, setSearch,
    session, setSession,
    saveCarryForward,
    deleteCarryForward,
  }
}

// ─── useFeesReminder ──────────────────────────────────────────────────────────────
// Manages class-wise fee collection report and aggregate stats.
export function useFeesReminder() {
  const { data, isLoading } = useAsyncData(() => feesService.getFeesReminder(), [])

  const rows = data || []

  const stats = useMemo(
    () => ({
      totalFees: rows.reduce((a, b) => a + b.total_fees, 0),
      collected: rows.reduce((a, b) => a + b.collected, 0),
      due: rows.reduce((a, b) => a + b.due, 0),
      avgRate: rows.length ? Math.round(rows.reduce((a, b) => a + b.collection_rate, 0) / rows.length) : 0,
    }),
    [rows],
  )

  return {
    rows,
    stats,
    isLoading,
  }
}

// ─── useDueFees ──────────────────────────────────────────────────────────────────
// Manages due fees list, filtering, stats, and reminder sending.
export function useDueFees() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getDueFees(), [])

  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.student_name.toLowerCase().includes(q) || r.admission_no.toLowerCase().includes(q)
        const matchClass = classFilter === 'all' || r.class === classFilter
        return matchSearch && matchClass
      }),
    [rows, search, classFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      totalDue: rows.reduce((s, r) => s + (r.due_amount || 0), 0),
    }),
    [rows],
  )

  const sendReminder = useCallback(
    async (id) => {
      await feesService.sendReminder(id)
      toast({ title: 'Reminder sent', description: 'Fee reminder sent to the student.' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allDueFees: rows,
    stats,
    isLoading,
    search, setSearch,
    classFilter, setClassFilter,
    sendReminder,
  }
}

// ─── useFeesPayments ────────────────────────────────────────────────────────────
// Manages fees payments history list, filtering, and stats.
export function useFeesPayments() {
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getFeesPayments(), [])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.student_name.toLowerCase().includes(q) || r.admission_no.toLowerCase().includes(q)
        const matchStatus = status === 'all' || r.status === status
        const matchFrom = !fromDate || new Date(r.date) >= new Date(fromDate)
        const matchTo = !toDate || new Date(r.date) <= new Date(toDate)
        return matchSearch && matchStatus && matchFrom && matchTo
      }),
    [rows, search, status, fromDate, toDate],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      totalAmount: rows.reduce((s, r) => s + (r.amount || 0), 0),
    }),
    [rows],
  )

  return {
    rows: filtered,
    allPayments: rows,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    fromDate, setFromDate,
    toDate, setToDate,
    refetch,
  }
}

// ─── useOfflinePayments ─────────────────────────────────────────────────────────
// Manages offline payments list, filtering, stats, and approve/reject operations.
export function useOfflinePayments() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getOfflinePayments(), [])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.student_name.toLowerCase().includes(q) || r.admission_no.toLowerCase().includes(q)
        const matchStatus = status === 'all' || r.status === status
        return matchSearch && matchStatus
      }),
    [rows, search, status],
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

  const createOfflinePayment = useCallback(
    async (payload) => {
      await feesService.createOfflinePayment(payload)
      toast({ title: 'Offline payment recorded', description: formatCurrency(payload.amount) })
      refetch()
    },
    [refetch, toast],
  )

  const updateOfflinePayment = useCallback(
    async (id, payload) => {
      await feesService.updateOfflinePayment(id, payload)
      toast({ title: 'Offline payment updated' })
      refetch()
    },
    [refetch, toast],
  )

  const deleteOfflinePayment = useCallback(
    async (id) => {
      await feesService.deleteOfflinePayment(id)
      toast({ title: 'Offline payment deleted' })
      refetch()
    },
    [refetch, toast],
  )

  const approvePayment = useCallback(
    async (id) => {
      await feesService.approveOfflinePayment(id)
      toast({ title: 'Payment approved' })
      refetch()
    },
    [refetch, toast],
  )

  const rejectPayment = useCallback(
    async (id) => {
      await feesService.rejectOfflinePayment(id)
      toast({ title: 'Payment rejected' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allOfflinePayments: rows,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    createOfflinePayment,
    updateOfflinePayment,
    deleteOfflinePayment,
    approvePayment,
    rejectPayment,
  }
}
