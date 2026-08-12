// ====================================================================
// Front CMS Service
//
// Service layer isolates all backend communication for the Front CMS module.
// Pages never call APIs directly — they call these methods.
//
// Backend routes (all mounted under /api/front-cms):
//   banner-images  — CRUD for homepage banners (multipart: image)
//   news           — CRUD for news articles (multipart: image)
//   event          — CRUD for events (multipart: image)
//   gallery        — CRUD for gallery items (multipart: image)
//   media-manager  — CRUD for media files (multipart: file)
//   pages          — CRUD for CMS pages (JSON body)
//   menus          — CRUD for navigation menus (JSON body)
// ====================================================================

import apiClient from './api'

// Helper: builds FormData from a payload + optional file field.
function buildFormData(payload, file, fileField) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    }
  })
  if (file) formData.append(fileField, file)
  return formData
}

export const frontCmsService = {
  // ─── Banners ──────────────────────────────────────────────────────────────────
  async getBanners() {
    return apiClient.get('/front-cms/banner-images')
  },
  async getBannerById(id) {
    return apiClient.get(`/front-cms/banner-images/${id}`)
  },
  async createBanner(payload, file) {
    const formData = buildFormData(payload, file, 'image')
    return apiClient.post('/front-cms/banner-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  async updateBanner(id, payload) {
    return apiClient.put(`/front-cms/banner-images/${id}`, payload)
  },
  async deleteBanner(id) {
    return apiClient.delete(`/front-cms/banner-images/${id}`)
  },

  // ─── News ──────────────────────────────────────────────────────────────────────
  async getNews() {
    return apiClient.get('/front-cms/news')
  },
  async getNewsById(id) {
    return apiClient.get(`/front-cms/news/${id}`)
  },
  async createNews(payload, file) {
    const formData = buildFormData(payload, file, 'image')
    return apiClient.post('/front-cms/news', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  async updateNews(id, payload) {
    return apiClient.put(`/front-cms/news/${id}`, payload)
  },
  async deleteNews(id) {
    return apiClient.delete(`/front-cms/news/${id}`)
  },

  // ─── Events ────────────────────────────────────────────────────────────────────
  async getEvents() {
    return apiClient.get('/front-cms/event')
  },
  async getEventById(id) {
    return apiClient.get(`/front-cms/event/${id}`)
  },
  async createEvent(payload, file) {
    const formData = buildFormData(payload, file, 'image')
    return apiClient.post('/front-cms/event', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  async updateEvent(id, payload) {
    return apiClient.put(`/front-cms/event/${id}`, payload)
  },
  async deleteEvent(id) {
    return apiClient.delete(`/front-cms/event/${id}`)
  },

  // ─── Gallery ────────────────────────────────────────────────────────────────────
  async getGallery() {
    return apiClient.get('/front-cms/gallery')
  },
  async getGalleryById(id) {
    return apiClient.get(`/front-cms/gallery/${id}`)
  },
  async createGallery(payload, file) {
    const formData = buildFormData(payload, file, 'image')
    return apiClient.post('/front-cms/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  async updateGallery(id, payload) {
    return apiClient.put(`/front-cms/gallery/${id}`, payload)
  },
  async deleteGallery(id) {
    return apiClient.delete(`/front-cms/gallery/${id}`)
  },

  // ─── Media Manager ──────────────────────────────────────────────────────────────
  async getMedia() {
    return apiClient.get('/front-cms/media-manager')
  },
  async getMediaById(id) {
    return apiClient.get(`/front-cms/media-manager/${id}`)
  },
  async createMedia(payload, file) {
    const formData = buildFormData(payload, file, 'file')
    return apiClient.post('/front-cms/media-manager', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  async updateMedia(id, payload) {
    return apiClient.put(`/front-cms/media-manager/${id}`, payload)
  },
  async deleteMedia(id) {
    return apiClient.delete(`/front-cms/media-manager/${id}`)
  },

  // ─── Pages ────────────────────────────────────────────────────────────────────────
  async getPages() {
    return apiClient.get('/front-cms/pages')
  },
  async getPageById(id) {
    return apiClient.get(`/front-cms/pages/${id}`)
  },
  async createPage(payload) {
    return apiClient.post('/front-cms/pages', payload)
  },
  async updatePage(id, payload) {
    return apiClient.put(`/front-cms/pages/${id}`, payload)
  },
  async deletePage(id) {
    return apiClient.delete(`/front-cms/pages/${id}`)
  },

  // ─── Menus ────────────────────────────────────────────────────────────────────────
  async getMenus() {
    return apiClient.get('/front-cms/menus')
  },
  async getMenuById(id) {
    return apiClient.get(`/front-cms/menus/${id}`)
  },
  async createMenu(payload) {
    return apiClient.post('/front-cms/menus', payload)
  },
  async updateMenu(id, payload) {
    return apiClient.put(`/front-cms/menus/${id}`, payload)
  },
  async deleteMenu(id) {
    return apiClient.delete(`/front-cms/menus/${id}`)
  },
}

export default frontCmsService
