// ====================================================================
// AuthContext — Authentication + Tenant State
//
// Exposes:
//   - login(role, credentials)   → POST to role-specific endpoint
//   - signup(role, data)          → POST to role-specific endpoint
//   - logout()                     → clear session + call backend
//   - user, role, token            → current session
//   - isAuthenticated              → boolean
//   - isLoading                    → during API calls
//   - tenant                       → school/tenant info
//
// Session shape: { token, user: { id, name, email, role }, role }
// Stored in localStorage under STORAGE_KEYS.AUTH.
// ====================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '@/services/auth.service'
import { settingsService } from '@/services/settings.service'
import { STORAGE_KEYS, ROLE_DASHBOARD } from '@/constants/navigation'

const AuthContext = createContext(null)

function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.AUTH)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readStoredTenant() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.TENANT)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession())
  const [tenant, setTenant] = useState(() => readStoredTenant())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(session))
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH)
    }
  }, [session])

  useEffect(() => {
    if (tenant) {
      sessionStorage.setItem(STORAGE_KEYS.TENANT, JSON.stringify(tenant))
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.TENANT)
    }
  }, [tenant])

  const fetchTenant = useCallback(async () => {
    try {
      const settings = await settingsService.getGeneralSettings()
      if (settings) {
        setTenant({
          id: settings._id || settings.id || null,
          slug: settings.slug || null,
          school_name: settings.school_name || '',
          logo: settings.logo || '',
          theme: settings.theme || '',
        })
      }
    } catch {
      // Settings may not be configured yet — tenant stays empty.
    }
  }, [])

  const login = useCallback(
    async (role, credentials) => {
      setIsLoading(true)
      try {
        const data = await authService.login(role, credentials)
        const user = {
          id: data.id || data._id || data.data?.id,
          name: data.name || data.data?.name,
          email: data.email || data.data?.email,
          role: data.role || data.data?.role || role,
        }
        const userToken = data.token || data.data?.token
        const newSession = { token: userToken, user, role: user.role }
        setSession(newSession)
        await fetchTenant()
        return newSession
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTenant],
  )

  const signup = useCallback(
    async (role, data) => {
      setIsLoading(true)
      try {
        const result = await authService.signup(role, data)
        // Some signup responses return a token; if so, establish a session.
        if (result?.token) {
          const user = {
            id: result.id || result._id || result.data?.id,
            name: result.name || result.data?.name,
            email: result.email || result.data?.email,
            role: result.role || result.data?.role || role,
          }
          const userToken = result.token || result.data?.token
          const newSession = { token: userToken, user, role: user.role }
          setSession(newSession)
          await fetchTenant()
          return newSession
        }
        // If no token (e.g. parent stub), just return success.
        return { success: true, data: result }
      } finally {
        setIsLoading(false)
      }
    },
    [fetchTenant],
  )

  const logout = useCallback(async () => {
    const currentRole = session?.role
    try {
      await authService.logout(currentRole)
    } catch {
      // Ignore — clear local state regardless.
    }
    setSession(null)
    setTenant(null)
  }, [session?.role])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      role: session?.role ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session),
      isLoading,
      tenant,
      login,
      logout,
      signup,
    }),
    [session, tenant, isLoading, login, logout, signup],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Resolve the post-login redirect path for a given role.
export function getRoleDashboard(role) {
  return ROLE_DASHBOARD[role] || '/dashboard'
}

export default AuthContext
