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
import { transportService } from '@/services/transport.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/utils/format'

// ─── useTransportRoutes ──────────────────────────────────────────────────────────
// Manages transport routes list, filtering, stats, and CRUD operations.
export function useTransportRoutes() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => transportService.getRoutes(), [])
  const { data: driversData } = useAsyncData(() => transportService.getDrivers(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []
  const drivers = driversData || []

  // Memoize filtered routes to avoid unnecessary calculations on every render.
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch =
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          (r.driver_name || '').toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        return matchSearch && matchStatus
      }),
    [rows, search, statusFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      withDriver: rows.filter((r) => r.driver_name).length,
      totalDistance: rows.reduce((sum, r) => sum + r.distance, 0),
    }),
    [rows],
  )

  const saveRoute = useCallback(
    async (payload, id) => {
      if (id) {
        await transportService.updateRoute(id, payload)
        toast({ title: 'Route updated', description: payload.name })
      } else {
        await transportService.createRoute(payload)
        toast({ title: 'Route created', description: payload.name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteRoute = useCallback(
    async (id) => {
      await transportService.deleteRoute(id)
      toast({ title: 'Route deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allRoutes: rows,
    drivers,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveRoute,
    deleteRoute,
  }
}

// ─── useVehicles ─────────────────────────────────────────────────────────────────
// Manages transport vehicles list, filtering, stats, and CRUD operations.
export function useVehicles() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => transportService.getVehicles(), [])
  const { data: driversData } = useAsyncData(() => transportService.getDrivers(), [])
  const { data: routesData } = useAsyncData(() => transportService.getRoutes(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []
  const drivers = driversData || []
  const routes = routesData || []

  const filtered = useMemo(
    () =>
      rows.filter((v) => {
        const q = search.toLowerCase()
        const matchSearch =
          !q ||
          v.vehicle_number.toLowerCase().includes(q) ||
          v.registration_number.toLowerCase().includes(q) ||
          (v.driver_name || '').toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || v.status === statusFilter
        return matchSearch && matchStatus
      }),
    [rows, search, statusFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((v) => v.status === 'active').length,
      totalCapacity: rows.reduce((sum, v) => sum + v.capacity, 0),
      totalOccupied: rows.reduce((sum, v) => sum + v.occupied, 0),
    }),
    [rows],
  )

  const saveVehicle = useCallback(
    async (payload, id) => {
      if (id) {
        await transportService.updateVehicle(id, payload)
        toast({ title: 'Vehicle updated', description: payload.vehicle_number })
      } else {
        await transportService.createVehicle(payload)
        toast({ title: 'Vehicle added', description: payload.vehicle_number })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deleteVehicle = useCallback(
    async (id) => {
      await transportService.deleteVehicle(id)
      toast({ title: 'Vehicle deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allVehicles: rows,
    drivers,
    routes,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveVehicle,
    deleteVehicle,
  }
}

// ─── usePickupPoints ──────────────────────────────────────────────────────────────
// Manages pickup points list, filtering, and CRUD operations.
export function usePickupPoints() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => transportService.getPickupPoints(), [])

  const [search, setSearch] = useState('')
  const [routeFilter, setRouteFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || (r.name || '').toLowerCase().includes(q)
        const matchRoute = routeFilter === 'all' || r.route_id === routeFilter
        return matchSearch && matchRoute
      }),
    [rows, search, routeFilter],
  )

  const savePickupPoint = useCallback(
    async (payload, id) => {
      if (id) {
        await transportService.updatePickupPoint(id, payload)
        toast({ title: 'Pickup point updated', description: payload.name })
      } else {
        await transportService.createPickupPoint(payload)
        toast({ title: 'Pickup point added', description: payload.name })
      }
      refetch()
    },
    [refetch, toast],
  )

  const deletePickupPoint = useCallback(
    async (id) => {
      await transportService.deletePickupPoint(id)
      toast({ title: 'Pickup point deleted' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allPickupPoints: rows,
    isLoading,
    search, setSearch,
    routeFilter, setRouteFilter,
    savePickupPoint,
    deletePickupPoint,
  }
}

// ─── useVehicleAssignments ───────────────────────────────────────────────────────
// Manages student-to-vehicle assignments list, filtering, and CRUD operations.
export function useVehicleAssignments() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => transportService.getVehicleAssignments(), [])

  const [search, setSearch] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [routeFilter, setRouteFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.student_name.toLowerCase().includes(q) || r.admission_no.toLowerCase().includes(q)
        const matchVehicle = vehicleFilter === 'all' || r.vehicle_id === vehicleFilter
        const matchRoute = routeFilter === 'all' || r.route_id === routeFilter
        return matchSearch && matchVehicle && matchRoute
      }),
    [rows, search, vehicleFilter, routeFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      vehicles: new Set(rows.map((r) => r.vehicle_id)).size,
    }),
    [rows],
  )

  const assignVehicle = useCallback(
    async (payload) => {
      await transportService.assignVehicle(payload)
      toast({ title: 'Vehicle assigned', description: payload.student_name })
      refetch()
    },
    [refetch, toast],
  )

  const updateAssignment = useCallback(
    async (id, payload) => {
      await transportService.updateAssignment(id, payload)
      toast({ title: 'Assignment updated' })
      refetch()
    },
    [refetch, toast],
  )

  const deleteAssignment = useCallback(
    async (id) => {
      await transportService.deleteAssignment(id)
      toast({ title: 'Assignment removed' })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allAssignments: rows,
    stats,
    isLoading,
    search, setSearch,
    vehicleFilter, setVehicleFilter,
    routeFilter, setRouteFilter,
    assignVehicle,
    updateAssignment,
    deleteAssignment,
  }
}

// ─── useTransportFees ────────────────────────────────────────────────────────────
// Manages transport fees list, filtering, stats, and fee collection.
export function useTransportFees() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => transportService.getTransportFees(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [routeFilter, setRouteFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const q = search.toLowerCase()
        const matchSearch = !q || r.student_name.toLowerCase().includes(q) || r.admission_no.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || r.status === statusFilter
        const matchRoute = routeFilter === 'all' || r.route_id === routeFilter
        return matchSearch && matchStatus && matchRoute
      }),
    [rows, search, statusFilter, routeFilter],
  )

  const stats = useMemo(
    () => ({
      total: rows.length,
      paid: rows.filter((r) => r.status === 'paid').length,
      pending: rows.filter((r) => r.status === 'pending').length,
      totalCollected: rows.reduce((s, r) => s + (r.paid_amount || 0), 0),
      totalPending: rows.reduce((s, r) => s + (r.due_amount || 0), 0),
    }),
    [rows],
  )

  const collectFee = useCallback(
    async (id, payload) => {
      await transportService.collectFee(id, payload)
      toast({ title: 'Fee collected', description: formatCurrency(payload.amount) })
      refetch()
    },
    [refetch, toast],
  )

  return {
    rows: filtered,
    allFees: rows,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    routeFilter, setRouteFilter,
    collectFee,
  }
}

// ─── useTransportStats ───────────────────────────────────────────────────────────
// Manages transport dashboard stats, charts, and fee breakdown.
export function useTransportStats() {
  const { data: stats, isLoading } = useAsyncData(() => transportService.getStats(), [])
  const { data: routeSum } = useAsyncData(() => transportService.getRouteSummary(), [])
  const { data: occupancy } = useAsyncData(() => transportService.getVehicleOccupancy(), [])
  const { data: fees } = useAsyncData(() => transportService.getFeeBreakdown(), [])

  // Donut chart data for vehicle occupancy — occupied vs available seats.
  const occupancyDonut = useMemo(() => {
    if (!occupancy) return []
    return [
      { label: 'Occupied', value: occupancy.reduce((s, v) => s + v.value, 0), color: 'chart-1' },
      { label: 'Available', value: occupancy.reduce((s, v) => s + (v.capacity - v.value), 0), color: 'chart-3' },
    ]
  }, [occupancy])

  return {
    stats,
    routeSum,
    occupancy,
    occupancyDonut,
    fees,
    isLoading,
  }
}
