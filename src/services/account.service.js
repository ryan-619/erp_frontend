// ====================================================================
// Account self-service — password change and admin-initiated reset.
//
// These endpoints hang off the auth mount (`/users/...`), NOT `/api/users`,
// which index.js gives to the settings module. Same reason auth.service.js
// strips the `/api` suffix before calling login/logout.
// ====================================================================

import apiClient from './api'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
const ROOT_BASE = API_BASE.replace(/\/api\/?$/, '')

// `baseURL: ''` is what stops axios re-prepending `/api` when ROOT_BASE is
// empty (the same-origin deploy case) — matches authRequest() in auth.service.js.
const post = (path, body) =>
  apiClient.post(`${ROOT_BASE}${path}`, body, { baseURL: '', withCredentials: true })

export const accountService = {
  changePassword: (body) => post('/users/change-password', body),
  resetPassword:  (body) => post('/users/reset-password', body),
}

export default accountService
