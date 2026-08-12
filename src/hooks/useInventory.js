// useInventory
//
// Keeps business logic separate from UI.
//
// Later backend APIs will automatically work without changing pages.
//
// This hook wraps inventoryService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.

import { useMemo, useState, useCallback } from 'react'
import { inventoryService } from '@/services/inventory.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// Threshold below which a stock entry is considered "low stock".
const LOW_STOCK_THRESHOLD = 10

// ─── useInventoryStats ─────────────────────────────────────────────────────────
// Fetches dashboard stats. Returns { stats, isLoading }.
export function useInventoryStats() {
  const { data, isLoading } = useAsyncData(() => inventoryService.getStats(), [])
  return {
    stats: data,
    isLoading,
  }
}

// ─── useItemCategories ─────────────────────────────────────────────────────────
// Manages item category list state, filtering, stats, and CRUD operations.
export function useItemCategories() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => inventoryService.getItemCategories(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered categories
  // unless category list or filters change.
  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (c.category_name || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((c) => c.status === 'active').length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveItemCategory = useCallback(async (payload, id) => {
    if (id) {
      await inventoryService.updateItemCategory(id, payload)
      toast({ title: 'Item category updated', description: payload.category_name })
    } else {
      await inventoryService.createItemCategory(payload)
      toast({ title: 'Item category created', description: payload.category_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteItemCategory = useCallback(async (id) => {
    await inventoryService.deleteItemCategory(id)
    toast({ title: 'Item category deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveItemCategory,
    deleteItemCategory,
  }
}

// ─── useItems ─────────────────────────────────────────────────────────────────
// Manages item list state, filtering, stats, and CRUD operations.
export function useItems() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => inventoryService.getItems(), [])
  const { data: categoriesData } = useAsyncData(() => inventoryService.getItemCategories(), [])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []
  const categories = categoriesData || []

  // useMemo prevents recalculating filtered items
  // unless item list or filters change.
  const filtered = useMemo(() => rows.filter((i) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (i.item_name || '').toLowerCase().includes(q) ||
      (i.category_name || '').toLowerCase().includes(q)
    const matchCategory = categoryFilter === 'all' || i.category_id === categoryFilter
    const matchStatus = statusFilter === 'all' || i.status === statusFilter
    return matchSearch && matchCategory && matchStatus
  }), [rows, search, categoryFilter, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    active: rows.filter((i) => i.status === 'active').length,
    categories: new Set(rows.map((i) => i.category_id)).size,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveItem = useCallback(async (payload, id) => {
    // Resolve category_name from category_id so the table shows it immediately.
    const cat = categories.find((c) => c._id === payload.category_id)
    const enriched = { ...payload, category_name: cat?.category_name || payload.category_name || '' }
    if (id) {
      await inventoryService.updateItem(id, enriched)
      toast({ title: 'Item updated', description: payload.item_name })
    } else {
      await inventoryService.createItem(enriched)
      toast({ title: 'Item added', description: payload.item_name })
    }
    refetch()
  }, [refetch, toast, categories])

  const deleteItem = useCallback(async (id) => {
    await inventoryService.deleteItem(id)
    toast({ title: 'Item deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    categories,
    stats,
    isLoading,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    statusFilter, setStatusFilter,
    saveItem,
    deleteItem,
  }
}

// ─── useItemStores ────────────────────────────────────────────────────────────
// Manages item store list state, filtering, and CRUD operations.
export function useItemStores() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => inventoryService.getItemStores(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered stores
  // unless store list or filters change.
  const filtered = useMemo(() => rows.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (s.store_name || '').toLowerCase().includes(q) ||
      (s.location || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  // Prevent unnecessary child re-renders.
  const saveItemStore = useCallback(async (payload, id) => {
    if (id) {
      await inventoryService.updateItemStore(id, payload)
      toast({ title: 'Item store updated', description: payload.store_name })
    } else {
      await inventoryService.createItemStore(payload)
      toast({ title: 'Item store added', description: payload.store_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteItemStore = useCallback(async (id) => {
    await inventoryService.deleteItemStore(id)
    toast({ title: 'Item store deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveItemStore,
    deleteItemStore,
  }
}

// ─── useItemSuppliers ──────────────────────────────────────────────────────────
// Manages item supplier list state, filtering, and CRUD operations.
export function useItemSuppliers() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => inventoryService.getItemSuppliers(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  // useMemo prevents recalculating filtered suppliers
  // unless supplier list or filters change.
  const filtered = useMemo(() => rows.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (s.supplier_name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  // Prevent unnecessary child re-renders.
  const saveItemSupplier = useCallback(async (payload, id) => {
    if (id) {
      await inventoryService.updateItemSupplier(id, payload)
      toast({ title: 'Item supplier updated', description: payload.supplier_name })
    } else {
      await inventoryService.createItemSupplier(payload)
      toast({ title: 'Item supplier added', description: payload.supplier_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteItemSupplier = useCallback(async (id) => {
    await inventoryService.deleteItemSupplier(id)
    toast({ title: 'Item supplier deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveItemSupplier,
    deleteItemSupplier,
  }
}

// ─── useItemStock ─────────────────────────────────────────────────────────────
// Manages item stock list state, filtering, stats, and CRUD operations.
export function useItemStock() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => inventoryService.getItemStocks(), [])
  const { data: itemsData } = useAsyncData(() => inventoryService.getItems(), [])
  const { data: storesData } = useAsyncData(() => inventoryService.getItemStores(), [])
  const { data: suppliersData } = useAsyncData(() => inventoryService.getItemSuppliers(), [])

  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []
  const items = itemsData || []
  const stores = storesData || []
  const suppliers = suppliersData || []

  // useMemo prevents recalculating filtered stock
  // unless stock list or filters change.
  const filtered = useMemo(() => rows.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (s.item_name || '').toLowerCase().includes(q) ||
      (s.store_name || '').toLowerCase().includes(q) ||
      (s.supplier_name || '').toLowerCase().includes(q)
    const matchStore = storeFilter === 'all' || s.store_id === storeFilter
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStore && matchStatus
  }), [rows, search, storeFilter, statusFilter])

  const stats = useMemo(() => ({
    total_value: rows.reduce((sum, s) => sum + (s.total_value || 0), 0),
    low_stock_count: rows.filter((s) => s.quantity < LOW_STOCK_THRESHOLD).length,
    total: rows.length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const saveItemStock = useCallback(async (payload, id) => {
    // Resolve display names from the related entities so the table updates instantly.
    const item = items.find((i) => i._id === payload.item_id)
    const store = stores.find((s) => s._id === payload.store_id)
    const supplier = suppliers.find((s) => s._id === payload.supplier_id)
    const enriched = {
      ...payload,
      item_name: item?.item_name || payload.item_name || '',
      store_name: store?.store_name || payload.store_name || '',
      supplier_name: supplier?.supplier_name || payload.supplier_name || '',
    }
    if (id) {
      await inventoryService.updateItemStock(id, enriched)
      toast({ title: 'Stock updated', description: enriched.item_name })
    } else {
      await inventoryService.createItemStock(enriched)
      toast({ title: 'Stock added', description: enriched.item_name })
    }
    refetch()
  }, [refetch, toast, items, stores, suppliers])

  const deleteItemStock = useCallback(async (id) => {
    await inventoryService.deleteItemStock(id)
    toast({ title: 'Stock entry deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    items,
    stores,
    suppliers,
    stats,
    isLoading,
    search, setSearch,
    storeFilter, setStoreFilter,
    statusFilter, setStatusFilter,
    LOW_STOCK_THRESHOLD,
    saveItemStock,
    deleteItemStock,
  }
}

// ─── useIssueItems ─────────────────────────────────────────────────────────────
// Manages issue item list state, filtering, stats, and CRUD operations.
export function useIssueItems() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => inventoryService.getIssueItems(), [])
  const { data: itemsData } = useAsyncData(() => inventoryService.getItems(), [])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []
  const items = itemsData || []

  // useMemo prevents recalculating filtered issues
  // unless issue list or filters change.
  const filtered = useMemo(() => rows.filter((i) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (i.item_name || '').toLowerCase().includes(q) ||
      (i.issued_to_name || '').toLowerCase().includes(q)
    const matchType = typeFilter === 'all' || i.issued_to_type === typeFilter
    const matchStatus = statusFilter === 'all' || i.status === statusFilter
    return matchSearch && matchType && matchStatus
  }), [rows, search, typeFilter, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    issued: rows.filter((i) => i.status === 'issued').length,
    returned: rows.filter((i) => i.status === 'returned').length,
  }), [rows])

  // Prevent unnecessary child re-renders.
  const createIssueItem = useCallback(async (payload) => {
    // Resolve item_name from item_id so the table shows it immediately.
    const item = items.find((i) => i._id === payload.item_id)
    const enriched = { ...payload, item_name: item?.item_name || payload.item_name || '' }
    await inventoryService.createIssueItem(enriched)
    toast({ title: 'Item issued', description: enriched.item_name })
    refetch()
  }, [refetch, toast, items])

  const returnItem = useCallback(async (id, issuedToName) => {
    await inventoryService.returnItem(id, { return_date: new Date().toISOString().slice(0, 10) })
    toast({ title: 'Item returned', description: issuedToName })
    refetch()
  }, [refetch, toast])

  const deleteIssueItem = useCallback(async (id) => {
    await inventoryService.deleteIssueItem(id)
    toast({ title: 'Issue entry deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    items,
    stats,
    isLoading,
    search, setSearch,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    createIssueItem,
    returnItem,
    deleteIssueItem,
  }
}
