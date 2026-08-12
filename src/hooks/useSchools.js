// useSchools
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps schoolService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.

import { useMemo, useState, useCallback } from 'react'
import { schoolService } from '@/services/school.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useSchools ───────────────────────────────────────────────────────────────
// Manages schools list state, filtering, stats, and CRUD operations.
export function useSchools() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => schoolService.list(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered schools
  // unless school list or filters change.
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (r.school_name || '').toLowerCase().includes(q) ||
      (r.domain || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  // Derived stats so the page can render StatCards without an extra endpoint.
  const stats = useMemo(() => ({
    total_schools: rows.length,
    active: rows.filter((r) => r.status === 'active').length,
    inactive: rows.filter((r) => r.status === 'inactive').length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveSchool = useCallback(async (payload, id) => {
    if (id) {
      await schoolService.update(id, payload)
      toast({ title: 'School updated', description: payload.school_name })
    } else {
      await schoolService.create(payload)
      toast({ title: 'School added', description: payload.school_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteSchool = useCallback(async (id) => {
    await schoolService.remove(id)
    toast({ title: 'School deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveSchool,
    deleteSchool,
  }
}

export default useSchools
