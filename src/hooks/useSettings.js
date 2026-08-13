// useSettings
//
// Keeps business logic separate from UI.
//
// Wraps settingsService calls and provides memoized filtering,
// statistics, and CRUD handlers so pages stay UI-only.
//
// Backend models use these field names:
//   settings:        school_name, logo, theme, timezone, date_format, currency, language, config
//   session:         session_name, start_date, end_date, status (Active|Inactive)
//   rolePermission:  role_name, role_type, permissions
//   module:          module_name, module_type, status (active|inactive), icon
//   notification:    notification_type, template, enabled
//   smsSettings:     provider, api_key, sender_id, status (Active|Inactive)
//   paymentSettings: provider, api_key, secret_key, mode (sandbox|live), status (Active|Inactive)
//   currency:        currency_name, symbol, code, exchange_rate, is_base, status (active|inactive)
//   language:        language_name, code, is_rtl, status (active|inactive), is_active
//   captcha:         provider, site_key, secret_key, status (active|inactive)
//   fileType:        allowed_extensions ([String]), max_size (Number) - NO DELETE, NO BYID
//   customField:     field_name, field_type, module, options ([String]), required
//   systemField:     field_name, field_type, module, status (active|inactive)
//   user:            name, email, password, role_id, user_type, status (active|inactive)

import { useMemo, useState, useCallback } from 'react'
import { settingsService } from '@/services/settings.service'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useToast } from '@/hooks/use-toast'

// ─── useSettingsStats ──────────────────────────────────────────────────────────
// Dashboard stats derived from parallel list fetches (no getStats endpoint).
export function useSettingsStats() {
  const sessions = useAsyncData(() => settingsService.getSessions(), [])
  const rolePermissions = useAsyncData(() => settingsService.getRolePermissions(), [])
  const users = useAsyncData(() => settingsService.getUsers(), [])
  const currencies = useAsyncData(() => settingsService.getCurrencies(), [])
  const languages = useAsyncData(() => settingsService.getLanguages(), [])
  const modules = useAsyncData(() => settingsService.getModules(), [])

  const isLoading =
    sessions.isLoading ||
    rolePermissions.isLoading ||
    users.isLoading ||
    currencies.isLoading ||
    languages.isLoading ||
    modules.isLoading

  const stats = useMemo(() => {
    const sessionRows = sessions.data || []
    const moduleRows = modules.data || []
    return {
      total_sessions: sessionRows.length,
      active_sessions: sessionRows.filter((s) => s.status === 'Active').length,
      total_roles: (rolePermissions.data || []).length,
      total_users: (users.data || []).length,
      total_currencies: (currencies.data || []).length,
      total_languages: (languages.data || []).length,
      enabled_modules: moduleRows.filter((m) => m.status === 'active').length,
    }
  }, [sessions.data, rolePermissions.data, users.data, currencies.data, languages.data, modules.data])

  return { stats, isLoading }
}

// ─── useGeneralSettings ────────────────────────────────────────────────────────
// General school info form (singleton object).
export function useGeneralSettings() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getGeneralSettings(), [])

  const updateSettings = useCallback(async (payload) => {
    await settingsService.saveGeneralSettings(payload)
    toast({ title: 'Settings saved' })
    refetch()
  }, [refetch, toast])

  // Handle both direct data and data.data (for singleton responses)
  const settings = data?.data || data || {}

  return { settings, isLoading, updateSettings }
}

// ─── useSessions ────────────────────────────────────────────────────────────────
// Session CRUD with search + status filter. Status values: 'Active'/'Inactive'.
export function useSessions() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getSessions(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((s) => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.session_name.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  const saveSession = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updateSession(id, payload)
      toast({ title: 'Session updated', description: payload.session_name })
    } else {
      await settingsService.createSession(payload)
      toast({ title: 'Session added', description: payload.session_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteSession = useCallback(async (id) => {
    await settingsService.deleteSession(id)
    toast({ title: 'Session deleted' })
    refetch()
  }, [refetch, toast])

  const activateSession = useCallback(async (id) => {
    await settingsService.activateSession(id)
    toast({ title: 'Session activated' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveSession,
    deleteSession,
    activateSession,
  }
}

// ─── useRolePermissions ────────────────────────────────────────────────────────
// Role permission CRUD with search by role_name and role_type.
export function useRolePermissions() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getRolePermissions(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || r.role_name.toLowerCase().includes(q) || (r.role_type || '').toLowerCase().includes(q)
  }), [rows, search])

  const saveRolePermission = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updateRolePermission(id, payload)
      toast({ title: 'Role updated', description: payload.role_name })
    } else {
      await settingsService.createRolePermission(payload)
      toast({ title: 'Role added', description: payload.role_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteRolePermission = useCallback(async (id) => {
    await settingsService.deleteRolePermission(id)
    toast({ title: 'Role deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    saveRolePermission,
    deleteRolePermission,
  }
}

// ─── useUsers ──────────────────────────────────────────────────────────────────
// User CRUD with search + status filter. Status values: 'active'/'inactive'.
export function useUsers() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getUsers(), [])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.user_type || '').toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchStatus
  }), [rows, search, statusFilter])

  const saveUser = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updateUser(id, payload)
      toast({ title: 'User updated', description: payload.name })
    } else {
      await settingsService.createUser(payload)
      toast({ title: 'User added', description: payload.name })
    }
    refetch()
  }, [refetch, toast])

  const deleteUser = useCallback(async (id) => {
    await settingsService.deleteUser(id)
    toast({ title: 'User deleted' })
    refetch()
  }, [refetch, toast])

  const updateUserStatus = useCallback(async (id, status) => {
    await settingsService.updateUserStatus(id, status)
    toast({ title: 'User status updated' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveUser,
    deleteUser,
    updateUserStatus,
  }
}

// ─── useNotifications ───────────────────────────────────────────────────────────
// Notification CRUD (NOT singleton). Fields: notification_type, template, enabled.
export function useNotifications() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getNotifications(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((n) => {
    const q = search.toLowerCase()
    return !q || (n.notification_type || '').toLowerCase().includes(q) || (n.template || '').toLowerCase().includes(q)
  }), [rows, search])

  const saveNotification = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updateNotification(id, payload)
      toast({ title: 'Notification updated', description: payload.notification_type })
    } else {
      await settingsService.createNotification(payload)
      toast({ title: 'Notification added', description: payload.notification_type })
    }
    refetch()
  }, [refetch, toast])

  const deleteNotification = useCallback(async (id) => {
    await settingsService.deleteNotification(id)
    toast({ title: 'Notification deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    saveNotification,
    deleteNotification,
  }
}

// ─── useSmsSettings ────────────────────────────────────────────────────────────
// SMS settings CRUD (NOT singleton). Fields: provider, api_key, sender_id, status.
export function useSmsSettings() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getSmsSettings(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((s) => {
    const q = search.toLowerCase()
    return !q || (s.provider || '').toLowerCase().includes(q) || (s.sender_id || '').toLowerCase().includes(q)
  }), [rows, search])

  const saveSms = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updateSmsSettings(id, payload)
      toast({ title: 'SMS settings updated', description: payload.provider })
    } else {
      await settingsService.createSmsSettings(payload)
      toast({ title: 'SMS settings added', description: payload.provider })
    }
    refetch()
  }, [refetch, toast])

  const deleteSms = useCallback(async (id) => {
    await settingsService.deleteSmsSettings(id)
    toast({ title: 'SMS settings deleted' })
    refetch()
  }, [refetch, toast])

  const activateSms = useCallback(async (id) => {
    await settingsService.activateSms(id)
    toast({ title: 'SMS settings activated' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    saveSms,
    deleteSms,
    activateSms,
  }
}

// ─── usePaymentSettings ─────────────────────────────────────────────────────────
// Payment settings CRUD. Fields: provider, api_key, secret_key, mode, status.
export function usePaymentSettings() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getPaymentSettings(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((p) => {
    const q = search.toLowerCase()
    return !q || (p.provider || '').toLowerCase().includes(q) || (p.mode || '').toLowerCase().includes(q)
  }), [rows, search])

  const savePayment = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updatePaymentSettings(id, payload)
      toast({ title: 'Payment settings updated', description: payload.provider })
    } else {
      await settingsService.createPaymentSettings(payload)
      toast({ title: 'Payment settings added', description: payload.provider })
    }
    refetch()
  }, [refetch, toast])

  const deletePayment = useCallback(async (id) => {
    await settingsService.deletePaymentSettings(id)
    toast({ title: 'Payment settings deleted' })
    refetch()
  }, [refetch, toast])

  const activatePayment = useCallback(async (id) => {
    await settingsService.activatePayment(id)
    toast({ title: 'Payment settings activated' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    savePayment,
    deletePayment,
    activatePayment,
  }
}

// ─── useCurrencies ──────────────────────────────────────────────────────────────
// Currency CRUD with search by code and currency_name.
export function useCurrencies() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getCurrencies(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  // Initialize base currency from localStorage on load
  useEffect(() => {
    if (rows.length > 0) {
      const baseCurrency = rows.find(c => c.is_base)
      if (baseCurrency?.code) {
        localStorage.setItem('baseCurrency', baseCurrency.code)
      }
    }
  }, [rows])

  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    return !q || (c.code || '').toLowerCase().includes(q) || (c.currency_name || '').toLowerCase().includes(q)
  }), [rows, search])

  const saveCurrency = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updateCurrency(id, payload)
      toast({ title: 'Currency updated', description: payload.code })
    } else {
      await settingsService.createCurrency(payload)
      toast({ title: 'Currency added', description: payload.code })
    }
    refetch()
  }, [refetch, toast])

  const deleteCurrency = useCallback(async (id) => {
    await settingsService.deleteCurrency(id)
    toast({ title: 'Currency deleted' })
    refetch()
  }, [refetch, toast])

  const setBaseCurrency = useCallback(async (id) => {
    await settingsService.setBaseCurrency(id)
    // Save base currency code to localStorage for use in formatCurrency
    const currency = rows.find(c => c._id === id)
    if (currency?.code) {
      localStorage.setItem('baseCurrency', currency.code)
    }
    toast({ title: 'Base currency set' })
    refetch()
  }, [refetch, toast, rows])

  const updateCurrencyStatus = useCallback(async (id, status) => {
    await settingsService.updateCurrencyStatus(id, status)
    toast({ title: 'Currency status updated' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    saveCurrency,
    deleteCurrency,
    setBaseCurrency,
    updateCurrencyStatus,
  }
}

// ─── useLanguages ──────────────────────────────────────────────────────────────
// Language CRUD with search by language_name and code.
export function useLanguages() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getLanguages(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((l) => {
    const q = search.toLowerCase()
    return !q || (l.language_name || '').toLowerCase().includes(q) || (l.code || '').toLowerCase().includes(q)
  }), [rows, search])

  const saveLanguage = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updateLanguage(id, payload)
      toast({ title: 'Language updated', description: payload.language_name })
    } else {
      await settingsService.createLanguage(payload)
      toast({ title: 'Language added', description: payload.language_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteLanguage = useCallback(async (id) => {
    await settingsService.deleteLanguage(id)
    toast({ title: 'Language deleted' })
    refetch()
  }, [refetch, toast])

  const setActiveLanguage = useCallback(async (id) => {
    await settingsService.setActiveLanguage(id)
    toast({ title: 'Active language set' })
    refetch()
  }, [refetch, toast])

  const toggleLanguageRtl = useCallback(async (id) => {
    await settingsService.toggleLanguageRtl(id)
    toast({ title: 'RTL toggled' })
    refetch()
  }, [refetch, toast])

  const updateLanguageStatus = useCallback(async (id, status) => {
    await settingsService.updateLanguageStatus(id, status)
    toast({ title: 'Language status updated' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    saveLanguage,
    deleteLanguage,
    setActiveLanguage,
    toggleLanguageRtl,
    updateLanguageStatus,
  }
}

// ─── useCaptchaSettings ─────────────────────────────────────────────────────────
// Captcha settings CRUD. Fields: provider, site_key, secret_key, status.
export function useCaptchaSettings() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getCaptchaSettings(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((c) => {
    const q = search.toLowerCase()
    return !q || (c.provider || '').toLowerCase().includes(q) || (c.site_key || '').toLowerCase().includes(q)
  }), [rows, search])

  const saveCaptcha = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updateCaptchaSettings(id, payload)
      toast({ title: 'Captcha settings updated', description: payload.provider })
    } else {
      await settingsService.createCaptchaSettings(payload)
      toast({ title: 'Captcha settings added', description: payload.provider })
    }
    refetch()
  }, [refetch, toast])

  const deleteCaptcha = useCallback(async (id) => {
    await settingsService.deleteCaptchaSettings(id)
    toast({ title: 'Captcha settings deleted' })
    refetch()
  }, [refetch, toast])

  const updateCaptchaStatus = useCallback(async (id, status) => {
    await settingsService.updateCaptchaStatus(id, status)
    toast({ title: 'Captcha status updated' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    saveCaptcha,
    deleteCaptcha,
    updateCaptchaStatus,
  }
}

// ─── useModules ─────────────────────────────────────────────────────────────────
// Module list with status toggle (active/inactive) via updateModuleStatus.
export function useModules() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getModules(), [])

  const toggleModule = useCallback(async (mod) => {
    await settingsService.updateModuleStatus(mod._id, mod.status === 'active' ? 'inactive' : 'active')
    toast({ title: mod.status === 'active' ? 'Module disabled' : 'Module enabled', description: mod.module_name })
    refetch()
  }, [refetch, toast])

  return { modules: data || [], isLoading, toggleModule }
}

// ─── useFrontCmsSettings ────────────────────────────────────────────────────────
// Front CMS settings form (singleton object).
export function useFrontCmsSettings() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getFrontCmsSettings(), [])

  const updateSettings = useCallback(async (payload) => {
    await settingsService.saveFrontCmsSettings(payload)
    toast({ title: 'Settings saved' })
    refetch()
  }, [refetch, toast])

  // Handle both direct data and data.data (for singleton responses)
  const settings = data?.data || data || {}

  return { settings, isLoading, updateSettings }
}

// ─── useCustomFields ─────────────────────────────────────────────────────────────
// Custom field CRUD with search + module filter.
// Fields: field_name, field_type, module, options, required.
export function useCustomFields() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getCustomFields(), [])

  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((f) => {
    const q = search.toLowerCase()
    const matchSearch = !q || (f.field_name || '').toLowerCase().includes(q) || (f.module || '').toLowerCase().includes(q)
    const matchModule = moduleFilter === 'all' || f.module === moduleFilter
    return matchSearch && matchModule
  }), [rows, search, moduleFilter])

  const saveCustomField = useCallback(async (payload, id) => {
    if (id) {
      await settingsService.updateCustomField(id, payload)
      toast({ title: 'Field updated', description: payload.field_name })
    } else {
      await settingsService.createCustomField(payload)
      toast({ title: 'Field added', description: payload.field_name })
    }
    refetch()
  }, [refetch, toast])

  const deleteCustomField = useCallback(async (id) => {
    await settingsService.deleteCustomField(id)
    toast({ title: 'Field deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    moduleFilter, setModuleFilter,
    saveCustomField,
    deleteCustomField,
  }
}

// ─── useSystemFields ────────────────────────────────────────────────────────────
// System field list with search + status update via updateSystemFieldStatus.
// Fields: field_name, field_type, module, status.
export function useSystemFields() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getSystemFields(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((f) => {
    const q = search.toLowerCase()
    return !q || (f.field_name || '').toLowerCase().includes(q) || (f.module || '').toLowerCase().includes(q)
  }), [rows, search])

  const updateSystemFieldStatus = useCallback(async (id, status) => {
    await settingsService.updateSystemFieldStatus(id, status)
    toast({ title: 'Field status updated' })
    refetch()
  }, [refetch, toast])

  const deleteSystemField = useCallback(async (id) => {
    await settingsService.deleteSystemField(id)
    toast({ title: 'Field deleted' })
    refetch()
  }, [refetch, toast])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    updateSystemFieldStatus,
    deleteSystemField,
  }
}

// ─── useFileTypes ───────────────────────────────────────────────────────────────
// File type settings. Fields: allowed_extensions ([String]), max_size (Number).
// No delete endpoint; updateFileType takes payload (no id).
export function useFileTypes() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => settingsService.getFileTypes(), [])

  const [search, setSearch] = useState('')

  const rows = data || []

  const filtered = useMemo(() => rows.filter((f) => {
    const q = search.toLowerCase()
    const exts = Array.isArray(f.allowed_extensions) ? f.allowed_extensions.join(', ') : ''
    return !q || exts.toLowerCase().includes(q)
  }), [rows, search])

  const saveFileType = useCallback(async (payload) => {
    // If a record already exists, update it (no id); otherwise create.
    if (rows.length > 0) {
      await settingsService.updateFileType(payload)
      toast({ title: 'File type settings updated' })
    } else {
      await settingsService.createFileType(payload)
      toast({ title: 'File type settings added' })
    }
    refetch()
  }, [refetch, toast, rows.length])

  return {
    rows: filtered,
    isLoading,
    search, setSearch,
    saveFileType,
  }
}
