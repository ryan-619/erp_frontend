// useColleges
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps collegeService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.

import { useMemo, useState, useCallback } from 'react'
import { collegeService } from '@/services/college.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useColleges ──────────────────────────────────────────────────────────────
// Manages colleges list state, filtering, stats, and CRUD operations.
export function useColleges() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => collegeService.list(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered colleges
  // unless college list or filters change.
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (r.college_name || '').toLowerCase().includes(q) ||
      (r.college_code || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  // Derived stats so the page can render StatCards without an extra endpoint.
  const stats = useMemo(() => ({
    total_colleges: rows.length,
    active: rows.filter((r) => r.status === 'active').length,
    inactive: rows.filter((r) => r.status === 'inactive').length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveCollege = useCallback(async (payload, id) => {
    if (id) {
      await collegeService.update(id, payload)
      toast({ title: 'College updated', description: payload.college_name })
    } else {
      await collegeService.create(payload)
      toast({ title: 'College added', description: payload.college_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteCollege = useCallback(async (id) => {
    await collegeService.remove(id)
    toast({ title: 'College deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveCollege,
    deleteCollege,
  }
}

export default useColleges
