// ====================================================================
// Auth Service
//
// Handles all backend communication for authentication across 5 roles.
//
// Backend:
// SuperAdmin -> /api/auth/*
// Admin      -> /users/admin/*
// Staff      -> /users/staff/*
// Student    -> /users/student/*
// Parent     -> /users/parent/*
//
// ====================================================================

import apiClient from './api'
import { AUTH_ENDPOINTS, USER_ROLES } from '@/constants/navigation'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const ROOT_BASE = API_BASE.replace('/api', '')

const VALID_ROLES = Object.values(USER_ROLES)

function getEndpoints(role) {
  const endpoints = AUTH_ENDPOINTS[role]

  if (!endpoints) {
    throw new Error(`Invalid role: ${role}`)
  }

  return endpoints
}

function authRequest(role, url, payload) {
  // SuperAdmin uses /api
  if (role === USER_ROLES.SUPER_ADMIN) {
    return apiClient.post(url, payload)
  }

  // Admin / Staff / Student / Parent don't use /api
  return apiClient.post(
    `${ROOT_BASE}${url}`,
    payload,
    {
      baseURL: '',
      withCredentials: true,
    }
  )
}

export const authService = {
  // ----------------------------------------------------
  // Login
  // ----------------------------------------------------
  async login(role, credentials) {
    if (!role || !VALID_ROLES.includes(role)) {
      return Promise.reject({
        message: 'A valid role is required.',
      })
    }

    if (!credentials?.email || !credentials?.password) {
      return Promise.reject({
        message: 'Email and password are required.',
      })
    }

    const { login } = getEndpoints(role)

    return authRequest(role, login, {
      email: credentials.email,
      password: credentials.password,
    })
  },

  // ----------------------------------------------------
  // Signup
  // ----------------------------------------------------
  async signup(role, data) {
    if (!role || !VALID_ROLES.includes(role)) {
      return Promise.reject({
        message: 'A valid role is required.',
      })
    }

    if (!data?.email || !data?.password) {
      return Promise.reject({
        message: 'Email and password are required.',
      })
    }

    const { signup } = getEndpoints(role)

    return authRequest(role, signup, data)
  },

  // ----------------------------------------------------
  // Logout
  // ----------------------------------------------------
  async logout(role) {
    const endpoints = AUTH_ENDPOINTS[role]

    if (!endpoints?.logout) {
      return Promise.resolve({ success: true })
    }

    if (role === USER_ROLES.SUPER_ADMIN) {
      return apiClient.post(endpoints.logout).catch(() => ({
        success: true,
      }))
    }

    return apiClient.post(
      `${ROOT_BASE}${endpoints.logout}`,
      {},
      {
        baseURL: '',
        withCredentials: true,
      }
    ).catch(() => ({
      success: true,
    }))
  },
}

export default authService