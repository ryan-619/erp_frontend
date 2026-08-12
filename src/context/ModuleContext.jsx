// ====================================================================
// ModuleContext — Dynamic Module & Permission State
//
// Purpose:
// Fetches enabled modules and role permissions from the backend so
// the sidebar and route guards can dynamically show/hide modules and
// pages based on what the tenant has enabled and what the user's role
// permits.
//
// Consumed by:
//   - Sidebar (filters sidebar items to enabled modules + permitted pages)
//   - ProtectedRoute (blocks access to disabled modules / unauthorized pages)
// ====================================================================

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react'
import { settingsService } from '@/services/settings.service'
import { useAuth } from '@/context/AuthContext'

const ModuleContext = createContext(null)

export function ModuleProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const [modules, setModules] = useState([])
  const [permissions, setPermissions] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchModules = useCallback(async () => {
    if (!isAuthenticated) {
      setModules([])
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      const data = await settingsService.getModules()
      setModules(data || [])
    } catch {
      // If modules API fails, show all modules as fallback.
      setModules([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions(null)
      return
    }
    // Superadmin has all permissions.
    if (user.role === 'superadmin') {
      setPermissions(null)
      return
    }
    try {
      const roles = await settingsService.getRolePermissions()
      // Find the role matching the user's role.
      const role = (roles || []).find((r) =>
        r.role_name === user.role || r.role_type === user.role,
      )
      setPermissions(role?.permissions || null)
    } catch {
      setPermissions(null)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    fetchModules()
    fetchPermissions()
  }, [fetchModules, fetchPermissions])

  // Check if a module is enabled (status === 'active').
  const isModuleEnabled = useCallback((moduleId) => {
    if (!modules.length) return true // fallback: show all if not loaded
    const mod = modules.find(
      (m) => m.module_name?.toLowerCase().replace(/\s+/g, '-') === moduleId
      || m.module_type?.toLowerCase() === moduleId,
    )
    return !mod || mod.status === 'active'
  }, [modules])

  // Check if a specific page/action is permitted for the current role.
  const hasPermission = useCallback((module, action = 'view') => {
    if (!permissions) return true // superadmin or permissions not loaded
    const mod = permissions[module]
    if (mod === undefined) return true // module not in permissions map = allowed
    if (typeof mod === 'boolean') return mod
    if (typeof mod === 'object') return mod[action] !== false
    return true
  }, [permissions])

  const value = useMemo(
    () => ({
      modules,
      permissions,
      isLoading,
      isModuleEnabled,
      hasPermission,
      refetchModules: fetchModules,
    }),
    [modules, permissions, isLoading, isModuleEnabled, hasPermission, fetchModules],
  )

  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
}

export function useModules() {
  const ctx = useContext(ModuleContext)
  if (!ctx) throw new Error('useModules must be used within ModuleProvider')
  return ctx
}

export default ModuleContext
