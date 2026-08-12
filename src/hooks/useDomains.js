// useDomains
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps domainService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.
import { useMemo, useState, useCallback } from 'react'
import { domainService } from '@/services/domain.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useDomains ──────────────────────────────────────────────────────────────
// Manages domains list state, filtering, stats, and CRUD operations.
export function useDomains() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => domainService.list(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
console.log("Domain API Response:", data);

const rows = Array.isArray(data)
  ? data
  : data
    ? [data]
    : [];

  // useMemo prevents recalculating filtered domains
  // unless domain list or filters change.
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (r.domain || '').toLowerCase().includes(q) ||
      (r.school_name || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  // Derived stats so the page can render StatCards without an extra endpoint.
  const stats = useMemo(() => ({
    total_domains: rows.length,
    verified: rows.filter((r) => r.verified).length,
    pending: rows.filter((r) => !r.verified).length,
    active: rows.filter((r) => r.status === 'active').length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveDomain = useCallback(async (payload, id) => {
    if (id) {
      await domainService.update(id, payload)
      toast({ title: 'Domain updated', description: payload.domain })
    } else {
      await domainService.create(payload)
      toast({ title: 'Domain registered', description: payload.domain })
    }
    refetch()
  }, [refetch, toast])

  const deleteDomain = useCallback(async (id) => {
    await domainService.remove(id)
    toast({ title: 'Domain deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveDomain,
    deleteDomain,
  }
}

export default useDomains
