import apiClient from './api'

// Reports/analytics — aggregated views the plain CRUD lists can't give.
export const reportsService = {
  examAnalysis: (params = {}) => apiClient.get('/reports/exam-analysis', { params }),
  studentReport: (params = {}) => apiClient.get('/reports/student', { params }),
  feeCollection: (params = {}) => apiClient.get('/reports/fee-collection', { params }),
  attendanceSummary: (params = {}) => apiClient.get('/reports/attendance-summary', { params }),
}

export default reportsService
