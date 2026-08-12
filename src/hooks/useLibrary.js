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
import { libraryService } from '@/services/library.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import { calculateFine } from '@/components/FineSummary'

// ─── useBooks ───────────────────────────────────────────────────────────────────
// Manages library book catalog list, filtering, stats, and CRUD operations.
export function useBooks() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => libraryService.getBooks(), [])
  const { data: categoriesData } = useAsyncData(() => libraryService.getCategories(), [])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')

  const rows = data || []
  const categories = categoriesData || []

  // Memoize filtered books for better performance — avoids re-filtering on every render.
  const filtered = useMemo(
    () =>
      rows.filter((b) => {
        const q = search.toLowerCase()
        const matchSearch =
          !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.toLowerCase().includes(q)
        const matchCategory = categoryFilter === 'all' || b.category === categoryFilter
        const matchAvailability =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'available' && b.available > 0) ||
          (availabilityFilter === 'issued' && b.available === 0)
        return matchSearch && matchCategory && matchAvailability
      }),
    [rows, search, categoryFilter, availabilityFilter],
  )

  const stats = useMemo(
    () => ({
      totalTitles: rows.length,
      totalCopies: rows.reduce((sum, b) => sum + b.quantity, 0),
      available: rows.reduce((sum, b) => sum + b.available, 0),
      issued: rows.reduce((sum, b) => sum + (b.quantity - b.available), 0),
    }),
    [rows],
  )

  const saveBook = useCallback(
    async (payload, id) => {
      if (id) {
        await libraryService.updateBook(id, payload)
        toast({ title: 'Book updated', description: payload.title })
      } else {
        await libraryService.createBook(payload)
        toast({ title: 'Book added', description: payload.title })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteBook = useCallback(
    async (id) => {
      await libraryService.deleteBook(id)
      toast({ title: 'Book deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allBooks: rows,
    categories,
    stats,
    isLoading,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    availabilityFilter, setAvailabilityFilter,
    saveBook,
    deleteBook,
  }
}

// ─── useIssueRecords ─────────────────────────────────────────────────────────────
// Manages book issue/return records list, filtering, stats, and issue/return ops.
export function useIssueRecords() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => libraryService.getIssueRecords(), [])
  const { data: booksData } = useAsyncData(() => libraryService.getBooks(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [memberTypeFilter, setMemberTypeFilter] = useState('all')

  const rows = data || []
  const books = booksData || []

  // Memoize filtered records — avoids re-filtering on every render.
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch =
          !q ||
          r.book_title.toLowerCase().includes(q) ||
          r.member_name.toLowerCase().includes(q) ||
          r.book_isbn.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        const matchMemberType = memberTypeFilter === 'all' || r.member_type === memberTypeFilter
        return matchSearch && matchStatus && matchMemberType
      }),
    [rows, search, statusFilter, memberTypeFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      issued: rows.filter((r) => r.status === 'issued').length,
      overdue: rows.filter((r) => r.status === 'overdue').length,
      returned: rows.filter((r) => r.status === 'returned').length,
    }),
    [rows],
  )

  const issueBook = useCallback(
    async (payload) => {
      await libraryService.issueBook(payload)
      toast({ title: 'Book issued', description: payload.book_title })
      refetch()
    },
    [refetch, toast],
  )

  // Return a book — marks the issue record as returned and calculates the fine.
  const returnBook = useCallback(
    async (record) => {
      const fine = calculateFine(record.due_date, new Date().toISOString().slice(0, 10))
      await libraryService.returnBook(record._id, {
        return_date: new Date().toISOString().slice(0, 10),
        fine,
        status: 'returned',
      })
      toast({ title: 'Book returned', description: fine > 0 ? `Fine: $${fine.toFixed(2)}` : 'No fine' })
      refetch()
    },
    [refetch, toast],
  )

  const deleteRecord = useCallback(
    async (id) => {
      await libraryService.deleteIssueRecord(id)
      toast({ title: 'Record deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allRecords: rows,
    books,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    memberTypeFilter, setMemberTypeFilter,
    issueBook,
    returnBook,
    deleteRecord,
  }
}

// ─── useLibraryStaff ─────────────────────────────────────────────────────────────
// Manages library staff list, filtering, and CRUD operations.
export function useLibraryStaff() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => libraryService.getLibraryStaff(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        return matchSearch && matchStatus
      }),
    [rows, search, statusFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
    }),
    [rows],
  )

  const saveStaff = useCallback(
    async (payload, id) => {
      if (id) {
        await libraryService.updateLibraryStaff(id, payload)
        toast({ title: 'Staff updated', description: payload.name })
      } else {
        await libraryService.addLibraryStaff(payload)
        toast({ title: 'Staff added', description: payload.name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteStaff = useCallback(
    async (id) => {
      await libraryService.deleteLibraryStaff(id)
      toast({ title: 'Staff deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allStaff: rows,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveStaff,
    deleteStaff,
  }
}
