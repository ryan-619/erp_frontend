// useIncome
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps incomeService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.

import { useMemo, useState, useCallback } from 'react'
import { incomeService } from '@/services/income.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useIncomeHeads ────────────────────────────────────────────────────────────
// Manages income head list state, filtering, stats, and CRUD operations.
export function useIncomeHeads() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => incomeService.getIncomeHeads(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered income heads
  // unless income head list or filters change.
  const filtered = useMemo(() => rows.filter((h) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      h.income_head_name.toLowerCase().includes(q) ||
      (h.description || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || h.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((h) => h.status === 'active').length,
    inactive: rows.filter((h) => h.status === 'inactive').length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveIncomeHead = useCallback(async (payload, id) => {
    if (id) {
      await incomeService.updateIncomeHead(id, payload)
      toast({ title: 'Income head updated', description: payload.income_head_name })
    } else {
      await incomeService.createIncomeHead(payload)
      toast({ title: 'Income head added', description: payload.income_head_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteIncomeHead = useCallback(async (id) => {
    await incomeService.deleteIncomeHead(id)
    toast({ title: 'Income head deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveIncomeHead,
    deleteIncomeHead,
  }
}

// ─── useIncomes ────────────────────────────────────────────────────────────────
// Manages income record list state, filtering, stats, and CRUD operations.
export function useIncomes() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => incomeService.getIncomes(), [])
  const { data: headsData } = useAsyncData(() => incomeService.getIncomeHeads(), [])

  const [search, setSearch] = useState('')
  const [headFilter, setHeadFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []
  const incomeHeads = headsData || []

  // useMemo prevents recalculating filtered incomes
  // unless income list or filters change.
  const filtered = useMemo(() => rows.filter((i) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (i.income_head_name || '').toLowerCase().includes(q) ||
      (i.note || '').toLowerCase().includes(q)
    const matchHead = headFilter === 'all' || i.income_head_id === headFilter
    const matchStatus = statusFilter === 'all' || i.status === statusFilter
    return matchSearch && matchHead && matchStatus
  }), [rows, search, headFilter, statusFilter])

  const stats = useMemo(() => ({
    total: rows.reduce((sum, i) => sum + i.amount, 0),
    thisMonth: rows
      .filter((i) => {
        const d = new Date(i.date)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, i) => sum + i.amount, 0),
    entries: rows.length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveIncome = useCallback(async (payload, id) => {
    if (id) {
      await incomeService.updateIncome(id, payload)
      toast({ title: 'Income updated', description: payload.income_head_name })
    } else {
      await incomeService.createIncome(payload)
      toast({ title: 'Income added', description: payload.income_head_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteIncome = useCallback(async (id) => {
    await incomeService.deleteIncome(id)
    toast({ title: 'Income deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    incomeHeads,
    stats,
    isLoading,
    search, setSearch,
    headFilter, setHeadFilter,
    statusFilter, setStatusFilter,
    saveIncome,
    deleteIncome,
  }
}

// ─── useIncomeStats ─────────────────────────────────────────────────────────────
// Fetches income dashboard stats only.
export function useIncomeStats() {
  const { data, isLoading } = useAsyncData(() => incomeService.getStats(), [])
  return {
    stats: data || {},
    isLoading,
  }
}
