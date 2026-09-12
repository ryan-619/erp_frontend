import apiClient from './api'

// Live tenant snapshot for the admin dashboard. The api.js response
// interceptor unwraps the { success, data } envelope, so this returns the
// dashboard data object directly.
export const dashboardService = {
  getSummary: () => apiClient.get('/dashboard/summary'),
}

export default dashboardService
