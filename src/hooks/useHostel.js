// useHostel
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps hostelService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.

import { useMemo, useState, useCallback } from 'react'
import { hostelService } from '@/services/hostel.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useHostelRooms ────────────────────────────────────────────────────────────
// Manages room list state, filtering, stats, and CRUD operations.
export function useHostelRooms() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hostelService.getRooms(), [])
  const { data: roomTypesData } = useAsyncData(() => hostelService.getRoomTypes(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [blockFilter, setBlockFilter] = useState('all')

  const rows = data || []
  const roomTypes = roomTypesData || []

  // useMemo prevents recalculating filtered rooms
  // unless room list or filters change.
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.room_number.toLowerCase().includes(q) ||
      r.block.toLowerCase().includes(q) ||
      (r.room_type_name || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || r.room_status === statusFilter
    const matchBlock = blockFilter === 'all' || r.block === blockFilter
    return matchSearch && matchStatus && matchBlock
  }), [rows, search, statusFilter, blockFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    available: rows.filter((r) => r.room_status === 'available').length,
    occupied: rows.filter((r) => r.room_status === 'occupied').length,
    maintenance: rows.filter((r) => r.room_status === 'maintenance').length,
  }), [rows])

  const blocks = useMemo(() => [...new Set(rows.map((r) => r.block))], [rows])

  // Prevent unnecessary child re-renders.
  const saveRoom = useCallback(async (payload, id) => {
    if (id) {
      await hostelService.updateRoom(id, payload)
      toast({ title: 'Room updated', description: payload.room_number })
    } else {
      await hostelService.createRoom(payload)
      toast({ title: 'Room added', description: payload.room_number })
    }
    refetch()
  }, [refetch, toast])

  const deleteRoom = useCallback(async (id) => {
    await hostelService.deleteRoom(id)
    toast({ title: 'Room deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    allRooms: rows,
    roomTypes,
    blocks,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    blockFilter, setBlockFilter,
    saveRoom,
    deleteRoom,
  }
}

// ─── useHostelAllocations ─────────────────────────────────────────────────────
// Manages allocation list state, filtering, stats, and allocation operations.
export function useHostelAllocations() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hostelService.getAllocations(), [])
  const { data: roomsData } = useAsyncData(() => hostelService.getRooms(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roomFilter, setRoomFilter] = useState('all')

  const rows = data || []
  const rooms = roomsData || []

  // useMemo prevents recalculating filtered allocations
  // unless allocation list or filters change.
  const filtered = useMemo(() => rows.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      a.student_name.toLowerCase().includes(q) ||
      a.admission_no.toLowerCase().includes(q) ||
      a.room_number.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || a.allocation_status === statusFilter
    const matchRoom = roomFilter === 'all' || a.room_id === roomFilter
    return matchSearch && matchStatus && matchRoom
  }), [rows, search, statusFilter, roomFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((a) => a.allocation_status === 'active').length,
    vacated: rows.filter((a) => a.allocation_status === 'vacated').length,
  }), [rows])

  // Capacity validation lives in the service so pages stay UI-only.
  const allocateRoom = useCallback(async (payload) => {
    const result = await hostelService.allocateRoom(payload)
    if (!result.success) {
      toast({ title: 'Allocation failed', description: result.message, variant: 'destructive' })
      return false
    }
    toast({ title: 'Student allocated', description: payload.student_name })
    refetch()
    return true
  }, [refetch, toast])

  const vacateAllocation = useCallback(async (id, studentName) => {
    await hostelService.vacateAllocation(id)
    toast({ title: 'Room vacated', description: studentName })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    rooms,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    roomFilter, setRoomFilter,
    allocateRoom,
    vacateAllocation,
  }
}

// ─── useHostelFees ─────────────────────────────────────────────────────────────
// Manages fee list state, filtering, stats, and payment collection.
export function useHostelFees() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => hostelService.getFees(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered fees
  // unless fee list or filters change.
  const filtered = useMemo(() => rows.filter((f) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      f.student_name.toLowerCase().includes(q) ||
      f.admission_no.toLowerCase().includes(q) ||
      (f.room_number || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || f.fee_status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    totalCollected: rows.reduce((sum, f) => sum + f.paid_amount, 0),
    totalDue: rows.reduce((sum, f) => sum + f.due_amount, 0),
    pending: rows.filter((f) => f.fee_status !== 'paid').length,
  }), [rows])

  const collectFee = useCallback(async (id, payload) => {
    await hostelService.collectFee(id, payload)
    toast({ title: 'Payment collected', description: `${payload.amount}` })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    collectFee,
  }
}
