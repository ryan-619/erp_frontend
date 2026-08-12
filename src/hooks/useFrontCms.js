// useFrontCms
//
// Keeps business logic separate from UI.
//
// Wraps frontCmsService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.
//
// Backend model field names (do NOT invent fields):
//   banner:   { image_url, title, link, order }
//   news:     { title, content, publish_date, image, author }
//   event:    { event_title, event_date, description, image }
//   gallery:  { gallery_title, image_url, category }
//   page:     { page_title, slug, content, meta_title, meta_description }
//   menu:     { menu_name, link, parent_id, order, menu_type }
//   media:    { file_name, file_url, file_type }
// All models have _id, createdAt, updatedAt.

import { useMemo, useState, useCallback } from 'react'
import { frontCmsService } from '@/services/frontCms.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useFrontCmsStats ──────────────────────────────────────────────────────────
// Derives dashboard stats by fetching all 7 lists and counting rows.
// The backend has no dedicated stats endpoint.
export function useFrontCmsStats() {
  const banners = useAsyncData(() => frontCmsService.getBanners(), [])
  const news = useAsyncData(() => frontCmsService.getNews(), [])
  const events = useAsyncData(() => frontCmsService.getEvents(), [])
  const gallery = useAsyncData(() => frontCmsService.getGallery(), [])
  const pages = useAsyncData(() => frontCmsService.getPages(), [])
  const media = useAsyncData(() => frontCmsService.getMedia(), [])
  const menus = useAsyncData(() => frontCmsService.getMenus(), [])

  const isLoading =
    banners.isLoading ||
    news.isLoading ||
    events.isLoading ||
    gallery.isLoading ||
    pages.isLoading ||
    media.isLoading ||
    menus.isLoading

  const stats = useMemo(() => ({
    total_banners: (banners.data || []).length,
    total_news: (news.data || []).length,
    total_events: (events.data || []).length,
    total_gallery: (gallery.data || []).length,
    total_pages: (pages.data || []).length,
    total_media: (media.data || []).length,
    total_menus: (menus.data || []).length,
  }), [banners.data, news.data, events.data, gallery.data, pages.data, media.data, menus.data])

  return { stats, isLoading }
}

// ─── useBanners ────────────────────────────────────────────────────────────────
// Filter by title. No status filter (backend has no status field).
export function useBanners() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => frontCmsService.getBanners(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((b) => {
    const q = search.toLowerCase()
    return !q || (b.title || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const saveBanner = useCallback(async (payload, file, id) => {
    if (id) {
      await frontCmsService.updateBanner(id, payload)
      toast({ title: 'Banner updated', description: payload.title })
    } else {
      await frontCmsService.createBanner(payload, file)
      toast({ title: 'Banner added', description: payload.title })
    }
    refetch()
  }, [refetch, toast])

  const deleteBanner = useCallback(async (id) => {
    await frontCmsService.deleteBanner(id)
    toast({ title: 'Banner deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    saveBanner,
    deleteBanner,
  }
}

// ─── useNews ────────────────────────────────────────────────────────────────────
// Filter by title and author. No category or status filter (no such fields).
export function useNews() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => frontCmsService.getNews(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((n) => {
    const q = search.toLowerCase()
    return !q ||
      (n.title || '').toLowerCase().includes(q) ||
      (n.author || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const saveNews = useCallback(async (payload, file, id) => {
    if (id) {
      await frontCmsService.updateNews(id, payload)
      toast({ title: 'News updated', description: payload.title })
    } else {
      await frontCmsService.createNews(payload, file)
      toast({ title: 'News added', description: payload.title })
    }
    refetch()
  }, [refetch, toast])

  const deleteNews = useCallback(async (id) => {
    await frontCmsService.deleteNews(id)
    toast({ title: 'News deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    saveNews,
    deleteNews,
  }
}

// ─── useEvents ──────────────────────────────────────────────────────────────────
// Filter by event_title (NOT title) and description. No category or status filter.
export function useEvents() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => frontCmsService.getEvents(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((e) => {
    const q = search.toLowerCase()
    return !q ||
      (e.event_title || '').toLowerCase().includes(q) ||
      (e.description || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const saveEvent = useCallback(async (payload, file, id) => {
    if (id) {
      await frontCmsService.updateEvent(id, payload)
      toast({ title: 'Event updated', description: payload.event_title })
    } else {
      await frontCmsService.createEvent(payload, file)
      toast({ title: 'Event added', description: payload.event_title })
    }
    refetch()
  }, [refetch, toast])

  const deleteEvent = useCallback(async (id) => {
    await frontCmsService.deleteEvent(id)
    toast({ title: 'Event deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    saveEvent,
    deleteEvent,
  }
}

// ─── useGallery ──────────────────────────────────────────────────────────────────
// Filter by gallery_title (NOT title). Keep category filter (field exists). No status filter.
export function useGallery() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => frontCmsService.getGallery(), [])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((g) => {
    const q = search.toLowerCase()
    const matchSearch = !q || (g.gallery_title || '').toLowerCase().includes(q)
    const matchCategory = categoryFilter === 'all' || g.category === categoryFilter
    return matchSearch && matchCategory
  }), [rows, search, categoryFilter])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const saveGallery = useCallback(async (payload, file, id) => {
    if (id) {
      await frontCmsService.updateGallery(id, payload)
      toast({ title: 'Gallery item updated', description: payload.gallery_title })
    } else {
      await frontCmsService.createGallery(payload, file)
      toast({ title: 'Gallery item added', description: payload.gallery_title })
    }
    refetch()
  }, [refetch, toast])

  const deleteGallery = useCallback(async (id) => {
    await frontCmsService.deleteGallery(id)
    toast({ title: 'Gallery item deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    saveGallery,
    deleteGallery,
  }
}

// ─── useMedia ────────────────────────────────────────────────────────────────────
// Filter by file_name and file_type. No uploaded_by. Keep typeFilter matching file_type (mimetype).
export function useMedia() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => frontCmsService.getMedia(), [])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (m.file_name || '').toLowerCase().includes(q) ||
      (m.file_type || '').toLowerCase().includes(q)
    const matchType = typeFilter === 'all' ||
      (m.file_type || '').toLowerCase().includes(typeFilter.toLowerCase())
    return matchSearch && matchType
  }), [rows, search, typeFilter])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const saveMedia = useCallback(async (payload, file, id) => {
    if (id) {
      await frontCmsService.updateMedia(id, payload)
      toast({ title: 'Media updated', description: payload.file_name })
    } else {
      await frontCmsService.createMedia(payload, file)
      toast({ title: 'Media added', description: payload.file_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteMedia = useCallback(async (id) => {
    await frontCmsService.deleteMedia(id)
    toast({ title: 'Media deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    typeFilter, setTypeFilter,
    saveMedia,
    deleteMedia,
  }
}

// ─── useCmsPages ──────────────────────────────────────────────────────────────────
// Filter by page_title and slug. No status filter.
export function useCmsPages() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => frontCmsService.getPages(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((p) => {
    const q = search.toLowerCase()
    return !q ||
      (p.page_title || '').toLowerCase().includes(q) ||
      (p.slug || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const savePage = useCallback(async (payload, id) => {
    if (id) {
      await frontCmsService.updatePage(id, payload)
      toast({ title: 'Page updated', description: payload.page_title })
    } else {
      await frontCmsService.createPage(payload)
      toast({ title: 'Page added', description: payload.page_title })
    }
    refetch()
  }, [refetch, toast])

  const deletePage = useCallback(async (id) => {
    await frontCmsService.deletePage(id)
    toast({ title: 'Page deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    savePage,
    deletePage,
  }
}

// ─── useMenus ────────────────────────────────────────────────────────────────────
// Filter by menu_name and link (NOT link_url). Keep typeFilter matching menu_type.
export function useMenus() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => frontCmsService.getMenus(), [])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (m.menu_name || '').toLowerCase().includes(q) ||
      (m.link || '').toLowerCase().includes(q)
    const matchType = typeFilter === 'all' || m.menu_type === typeFilter
    return matchSearch && matchType
  }), [rows, search, typeFilter])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const saveMenu = useCallback(async (payload, id) => {
    if (id) {
      await frontCmsService.updateMenu(id, payload)
      toast({ title: 'Menu updated', description: payload.menu_name })
    } else {
      await frontCmsService.createMenu(payload)
      toast({ title: 'Menu added', description: payload.menu_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteMenu = useCallback(async (id) => {
    await frontCmsService.deleteMenu(id)
    toast({ title: 'Menu deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    typeFilter, setTypeFilter,
    saveMenu,
    deleteMenu,
  }
}
