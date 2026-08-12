// useExpenses
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps expensesService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.

import { useMemo, useState, useCallback } from 'react'
import { expensesService } from '@/services/expenses.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useExpenseHeads ───────────────────────────────────────────────────────────
// Manages expense head list state, filtering, stats, and CRUD operations.
export function useExpenseHeads() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => expensesService.getExpenseHeads(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  // useMemo prevents recalculating filtered expense heads
  // unless expense head list or filters change.
  const filtered = useMemo(() => rows.filter((h) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      h.expense_head_name.toLowerCase().includes(q)
    return matchSearch
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveExpenseHead = useCallback(async (payload, id) => {
    if (id) {
      await expensesService.updateExpenseHead(id, payload)
      toast({ title: 'Expense head updated', description: payload.expense_head_name })
    } else {
      await expensesService.createExpenseHead(payload)
      toast({ title: 'Expense head added', description: payload.expense_head_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteExpenseHead = useCallback(async (id) => {
    await expensesService.deleteExpenseHead(id)
    toast({ title: 'Expense head deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    saveExpenseHead,
    deleteExpenseHead,
  }
}

// ─── useExpenses ───────────────────────────────────────────────────────────────
// Manages expense record list state, filtering, stats, and CRUD operations.
export function useExpenses() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => expensesService.getExpenses(), [])
  const { data: headsData } = useAsyncData(() => expensesService.getExpenseHeads(), [])

  const [search, setSearch] = useState('')
  const [headFilter, setHeadFilter] = useState('all')

  const rows = data || []
  const expenseHeads = headsData || []

  // Create a mapping of expense head IDs to names
  const headMap = useMemo(() => {
    return expenseHeads.reduce((map, head) => {
      map[head._id] = head.expense_head_name
      return map
    }, {})
  }, [expenseHeads])

  // Create a set of valid expense head IDs
  const validHeadIds = useMemo(() => {
    return new Set(expenseHeads.map(h => h._id))
  }, [expenseHeads])

  // useMemo prevents recalculating filtered expenses
  // unless expense list or filters change.
  const filtered = useMemo(() => rows.filter((e) => {
    // Filter out expenses with deleted/invalid expense heads
    if (!validHeadIds.has(e.expense_head_id)) {
      return false
    }

    const q = search.toLowerCase()
    const headName = headMap[e.expense_head_id] || ''
    const matchSearch = !q ||
      headName.toLowerCase().includes(q) ||
      (e.note || '').toLowerCase().includes(q)
    const matchHead = headFilter === 'all' || e.expense_head_id === headFilter
    return matchSearch && matchHead
  }), [rows, search, headFilter, headMap, validHeadIds])

  const stats = useMemo(() => ({
    total: filtered.reduce((sum, e) => sum + (e.amount || 0), 0),
    thisMonth: filtered
      .filter((e) => {
        const d = new Date(e.date)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    entries: filtered.length,
  }), [filtered])

  // Prevent unnecessary child re-renders.
  const saveExpense = useCallback(async (payload, id) => {
    if (id) {
      await expensesService.updateExpense(id, payload)
      toast({ title: 'Expense updated', description: payload.expense_head_name })
    } else {
      await expensesService.createExpense(payload)
      toast({ title: 'Expense added', description: payload.expense_head_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteExpense = useCallback(async (id) => {
    await expensesService.deleteExpense(id)
    toast({ title: 'Expense deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    expenseHeads,
    stats,
    isLoading,
    search, setSearch,
    headFilter, setHeadFilter,
    saveExpense,
    deleteExpense,
  }
}
