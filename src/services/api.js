// ====================================================================
// Centralized Axios instance aligned with the School_erp-b-main backend.
//
// Purpose:
// - Handles all API requests
// - Automatically attaches JWT token
// - Sends httpOnly cookies
// - Unwraps backend response
// - Handles authentication errors globally
//
// Backend Response Format:
// {
//   success: true,
//   message: "...",
//   data: {...}
// }
// ====================================================================

import axios from 'axios'
import { STORAGE_KEYS } from '../constants/navigation'
import { toast } from '@/hooks/use-toast'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL,
  // 45s: serverless (Vercel) cold starts must boot the function and open the
  // MongoDB Atlas connections before the first response — that can exceed a
  // tight timeout. Warm requests still return in ~1s.
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// ====================================================================
// Request Interceptor
// Attach JWT token from localStorage (fallback to cookies)
// ====================================================================

apiClient.interceptors.request.use(
  (config) => {
    const raw = sessionStorage.getItem(STORAGE_KEYS.AUTH)

    if (raw) {
      try {
        const { token } = JSON.parse(raw)

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (err) {
        console.error('Invalid auth data in sessionStorage:', err)
      }
    }

    // Multi-tenant: attach tenant (school) identifier so the backend can
    // resolve the correct tenant DB. The backend reads this from the
    // `x-tenant-id` header (see middleware/tenantMiddleware).
    const tenantRaw = sessionStorage.getItem(STORAGE_KEYS.TENANT)
    if (tenantRaw) {
      try {
        const tenant = JSON.parse(tenantRaw)
        if (tenant?.id) {
          config.headers['x-tenant-id'] = tenant.id
        }
        if (tenant?.slug) {
          config.headers['x-tenant-slug'] = tenant.slug
        }
      } catch {
        // ignore malformed tenant data
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ====================================================================
// Response Interceptor
// Unwrap backend response:
// {
//    success,
//    message,
//    data
// }
// ====================================================================

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data

    if (payload && typeof payload === 'object' && 'success' in payload) {
      if (!payload.success) {
        // A 2xx carrying { success: false } is a business-level failure.
        // It never reaches the error interceptor below, so without this
        // toast the page just renders its empty state and the user is
        // told nothing at all about why their data is missing.
        const message = payload.message || 'Request failed'
        toast({ title: 'Request failed', description: message, variant: 'destructive' })
        return Promise.reject({ message, status: response.status, data: payload })
      }

      return payload.data !== undefined ? payload.data : payload
    }

    return payload
  },
  (error) => {
    const normalized = {
      message:
        error?.response?.data?.message ||
        error?.message ||
        'Unexpected error occurred',
      status: error?.response?.status || 0,
      data: error?.response?.data || null,
    }

    // Show toast for common error codes (non-GET requests only to avoid
    // spamming on background fetches; login/signup show their own inline errors).
    const method = error?.config?.method?.toUpperCase()
    // Only the actual login/signup/logout routes count as "auth endpoints"
    // (they show their own inline errors). This must NOT swallow expiry on
    // user-management pages like /api/users/:id, which should behave like any
    // other endpoint (toast + redirect on 401).
    const reqUrl = error?.config?.url || ''
    const AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/logout',
      '/admin/login', '/admin/signup', '/admin/logout',
      '/staff/login', '/staff/signup', '/staff/logout',
      '/student/login', '/student/signup', '/student/logout',
      '/parent/login', '/parent/signup', '/parent/logout']
    const isAuthEndpoint = AUTH_PATHS.some((p) => reqUrl.includes(p))

    if (!isAuthEndpoint) {
      if (normalized.status === 401) {
        toast({ title: 'Session expired', description: 'Please sign in again.', variant: 'destructive' })
      } else if (normalized.status === 403) {
        toast({ title: 'Access denied', description: 'You do not have permission for this action.', variant: 'destructive' })
      } else if (normalized.status === 404) {
        toast({ title: 'Not found', description: 'The requested resource does not exist.', variant: 'destructive' })
      } else if (normalized.status >= 500) {
        toast({ title: 'Server error', description: 'Something went wrong on our end. Please try again.', variant: 'destructive' })
      } else if (normalized.status === 0) {
        toast({ title: 'Network error', description: 'Unable to reach the server. Check your connection.', variant: 'destructive' })
      }
    }

    // Clear session if backend says Unauthorized (expired/invalid token).
    if (normalized.status === 401 && !isAuthEndpoint) {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH)
      sessionStorage.removeItem(STORAGE_KEYS.TENANT)
      // Redirect to login if we're in the browser (not during SSR/build).
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(normalized)
  },
)

export default apiClient


