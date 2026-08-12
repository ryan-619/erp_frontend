// ====================================================================
// Settings Service
//
// Service layer isolates all backend communication for the Settings module.
// Pages never call APIs directly — they call these methods.
//
// Backend routes:
//   /api/settings         — General settings (singleton: GET, POST)
//   /api/session          — Academic sessions (CRUD + activate)
//   /api/role-permission  — Role permissions (CRUD)
//   /api/users            — Tenant users (CRUD + filter by type + status)
//   /api/notification    — Notification settings (CRUD)
//   /api/sms              — SMS gateway settings (CRUD + activate)
//   /api/payment          — Payment gateway settings (CRUD + activate)
//   /api/currency         — Currencies (CRUD + status + set base)
//   /api/language         — Languages (CRUD + status + RTL + set active)
//   /api/captcha          — Captcha settings (CRUD + status)
//   /api/modules          — Module control (CRUD + filter by type + status)
//   /api/front-cms        — Front CMS settings (singleton: GET, POST)
//   /api/custom-fields    — Custom fields (CRUD)
//   /api/system-fields    — System fields (CRUD + filter by module + status)
//   /api/file-settings    — File type settings (GET, POST, PUT - NO DELETE, NO BYID)
// ====================================================================

import apiClient from './api'

export const settingsService = {
  // ─── General Settings (singleton) ────────────────────────────────────────────
  async getGeneralSettings() {
    return apiClient.get('/settings')
  },
  async saveGeneralSettings(payload) {
    return apiClient.post('/settings', payload)
  },

  // ─── Session Settings ────────────────────────────────────────────────────────
  async getSessions() {
    return apiClient.get('/session')
  },
  async getSessionById(id) {
    return apiClient.get(`/session/${id}`)
  },
  async createSession(payload) {
    return apiClient.post('/session', payload)
  },
  async updateSession(id, payload) {
    return apiClient.put(`/session/${id}`, payload)
  },
  async deleteSession(id) {
    return apiClient.delete(`/session/${id}`)
  },
  async activateSession(id) {
    return apiClient.put(`/session/activate/${id}`)
  },

  // ─── Role Permissions ────────────────────────────────────────────────────────
  async getRolePermissions() {
    return apiClient.get('/role-permission')
  },
  async getRolePermissionById(id) {
    return apiClient.get(`/role-permission/${id}`)
  },
  async createRolePermission(payload) {
    return apiClient.post('/role-permission', payload)
  },
  async updateRolePermission(id, payload) {
    return apiClient.put(`/role-permission/${id}`, payload)
  },
  async deleteRolePermission(id) {
    return apiClient.delete(`/role-permission/${id}`)
  },

  // ─── Users ────────────────────────────────────────────────────────────────────
  async getUsers() {
    return apiClient.get('/users')
  },
  async getUsersByType(type) {
    return apiClient.get(`/users/type/${type}`)
  },
  async getUserById(id) {
    return apiClient.get(`/users/${id}`)
  },
  async createUser(payload) {
    return apiClient.post('/users', payload)
  },
  async updateUser(id, payload) {
    return apiClient.put(`/users/${id}`, payload)
  },
  async deleteUser(id) {
    return apiClient.delete(`/users/${id}`)
  },
  async updateUserStatus(id, status) {
    return apiClient.patch(`/users/status/${id}`, { status })
  },

  // ─── Notification Settings ────────────────────────────────────────────────────
  async getNotifications() {
    return apiClient.get('/notification')
  },
  async getNotificationById(id) {
    return apiClient.get(`/notification/${id}`)
  },
  async createNotification(payload) {
    return apiClient.post('/notification', payload)
  },
  async updateNotification(id, payload) {
    return apiClient.put(`/notification/${id}`, payload)
  },
  async deleteNotification(id) {
    return apiClient.delete(`/notification/${id}`)
  },

  // ─── SMS Settings ─────────────────────────────────────────────────────────────
  async getSmsSettings() {
    return apiClient.get('/sms')
  },
  async getSmsSettingById(id) {
    return apiClient.get(`/sms/${id}`)
  },
  async createSmsSettings(payload) {
    return apiClient.post('/sms', payload)
  },
  async updateSmsSettings(id, payload) {
    return apiClient.put(`/sms/${id}`, payload)
  },
  async deleteSmsSettings(id) {
    return apiClient.delete(`/sms/${id}`)
  },
  async activateSms(id) {
    return apiClient.put(`/sms/activate/${id}`)
  },

  // ─── Payment Settings ─────────────────────────────────────────────────────────
  async getPaymentSettings() {
    return apiClient.get('/payment')
  },
  async getPaymentSettingById(id) {
    return apiClient.get(`/payment/${id}`)
  },
  async createPaymentSettings(payload) {
    return apiClient.post('/payment', payload)
  },
  async updatePaymentSettings(id, payload) {
    return apiClient.put(`/payment/${id}`, payload)
  },
  async deletePaymentSettings(id) {
    return apiClient.delete(`/payment/${id}`)
  },
  async activatePayment(id) {
    return apiClient.put(`/payment/activate/${id}`)
  },

  // ─── Currency Settings ────────────────────────────────────────────────────────
  async getCurrencies() {
    return apiClient.get('/currency')
  },
  async getCurrencyById(id) {
    return apiClient.get(`/currency/${id}`)
  },
  async createCurrency(payload) {
    return apiClient.post('/currency', payload)
  },
  async updateCurrency(id, payload) {
    return apiClient.put(`/currency/${id}`, payload)
  },
  async deleteCurrency(id) {
    return apiClient.delete(`/currency/${id}`)
  },
  async setBaseCurrency(id) {
    return apiClient.patch(`/currency/base/${id}`)
  },
  async updateCurrencyStatus(id, status) {
    return apiClient.patch(`/currency/status/${id}`, { status })
  },

  // ─── Language Settings ────────────────────────────────────────────────────────
  async getLanguages() {
    return apiClient.get('/language')
  },
  async getLanguageById(id) {
    return apiClient.get(`/language/${id}`)
  },
  async createLanguage(payload) {
    return apiClient.post('/language', payload)
  },
  async updateLanguage(id, payload) {
    return apiClient.put(`/language/${id}`, payload)
  },
  async deleteLanguage(id) {
    return apiClient.delete(`/language/${id}`)
  },
  async setActiveLanguage(id) {
    return apiClient.patch(`/language/active/${id}`)
  },
  async toggleLanguageRtl(id) {
    return apiClient.patch(`/language/rtl/${id}`)
  },
  async updateLanguageStatus(id, status) {
    return apiClient.patch(`/language/status/${id}`, { status })
  },

  // ─── Captcha Settings ──────────────────────────────────────────────────────────
  async getCaptchaSettings() {
    return apiClient.get('/captcha')
  },
  async getCaptchaSettingById(id) {
    return apiClient.get(`/captcha/${id}`)
  },
  async createCaptchaSettings(payload) {
    return apiClient.post('/captcha', payload)
  },
  async updateCaptchaSettings(id, payload) {
    return apiClient.put(`/captcha/${id}`, payload)
  },
  async deleteCaptchaSettings(id) {
    return apiClient.delete(`/captcha/${id}`)
  },
  async updateCaptchaStatus(id, status) {
    return apiClient.patch(`/captcha/status/${id}`, { status })
  },

  // ─── Modules ──────────────────────────────────────────────────────────────────
  async getModules() {
    return apiClient.get('/modules')
  },
  async getModulesByType(type) {
    return apiClient.get(`/modules/type/${type}`)
  },
  async getModuleById(id) {
    return apiClient.get(`/modules/${id}`)
  },
  async createModule(payload) {
    return apiClient.post('/modules', payload)
  },
  async updateModule(id, payload) {
    return apiClient.put(`/modules/${id}`, payload)
  },
  async deleteModule(id) {
    return apiClient.delete(`/modules/${id}`)
  },
  async updateModuleStatus(id, status) {
    return apiClient.patch(`/modules/status/${id}`, { status })
  },

  // ─── Front CMS Settings (singleton) ────────────────────────────────────────────
  async getFrontCmsSettings() {
    return apiClient.get('/front-cms')
  },
  async saveFrontCmsSettings(payload) {
    return apiClient.post('/front-cms', payload)
  },

  // ─── Custom Fields ──────────────────────────────────────────────────────────────
  async getCustomFields() {
    return apiClient.get('/custom-fields')
  },
  async getCustomFieldById(id) {
    return apiClient.get(`/custom-fields/${id}`)
  },
  async createCustomField(payload) {
    return apiClient.post('/custom-fields', payload)
  },
  async updateCustomField(id, payload) {
    return apiClient.put(`/custom-fields/${id}`, payload)
  },
  async deleteCustomField(id) {
    return apiClient.delete(`/custom-fields/${id}`)
  },

  // ─── System Fields ──────────────────────────────────────────────────────────────
  async getSystemFields() {
    return apiClient.get('/system-fields')
  },
  async getSystemFieldsByType(type) {
    return apiClient.get(`/system-fields/type/${type}`)
  },
  async getSystemFieldById(id) {
    return apiClient.get(`/system-fields/${id}`)
  },
  async createSystemField(payload) {
    return apiClient.post('/system-fields', payload)
  },
  async updateSystemFieldStatus(id, status) {
    return apiClient.patch(`/system-fields/status/${id}`, { status })
  },
  async deleteSystemField(id) {
    return apiClient.delete(`/system-fields/${id}`)
  },

  // ─── File Types ──────────────────────────────────────────────────────────────────
  // NOTE: Backend only supports GET, POST, PUT (no DELETE, no byId)
  async getFileTypes() {
    return apiClient.get('/file-settings')
  },
  async createFileType(payload) {
    return apiClient.post('/file-settings', payload)
  },
  async updateFileType(payload) {
    return apiClient.put('/file-settings', payload)
  },
}

export default settingsService
