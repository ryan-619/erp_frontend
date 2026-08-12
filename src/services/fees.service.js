// ====================================================================
// Fees Service
//
// Backend Endpoints:
//
// /api/fees/type
// /api/fees/group
// /api/fees/master
// /api/fees/collect
// /api/fees/discount
// /api/fees/carry-forward
// /api/fees/reminder
// /api/fees/offline-payment
// /api/fees/search-due
// /api/fees/search-payment
//
// Response Format:
// {
//   success,
//   message,
//   data,
//   pagination
// }
// ====================================================================

import apiClient from './api'

export const feesService = {
  // ==========================================================
  // Fees Type
  // ==========================================================

  async getFeesTypes(params = {}) {
    return apiClient.get('/fees/type', { params })
  },

  async getFeesType(id) {
    return apiClient.get(`/fees/type/${id}`)
  },

  async createFeesType(payload) {
    return apiClient.post('/fees/type', payload)
  },

  async updateFeesType(id, payload) {
    return apiClient.put(`/fees/type/${id}`, payload)
  },

  async deleteFeesType(id) {
    return apiClient.delete(`/fees/type/${id}`)
  },

  // ==========================================================
  // Fees Group
  // ==========================================================

  async getFeesGroups(params = {}) {
    return apiClient.get('/fees/group', { params })
  },

  async getFeesGroup(id) {
    return apiClient.get(`/fees/group/${id}`)
  },

  async createFeesGroup(payload) {
    return apiClient.post('/fees/group', payload)
  },

  async updateFeesGroup(id, payload) {
    return apiClient.put(`/fees/group/${id}`, payload)
  },

  async deleteFeesGroup(id) {
    return apiClient.delete(`/fees/group/${id}`)
  },

  // ==========================================================
  // Fees Master
  // ==========================================================

  async getFeesMaster(params = {}) {
    return apiClient.get('/fees/master', { params })
  },

  async getFeesMasterById(id) {
    return apiClient.get(`/fees/master/${id}`)
  },

  async createFeesMaster(payload) {
    return apiClient.post('/fees/master', payload)
  },

  async updateFeesMaster(id, payload) {
    return apiClient.put(`/fees/master/${id}`, payload)
  },

  async deleteFeesMaster(id) {
    return apiClient.delete(`/fees/master/${id}`)
  },

  // ==========================================================
  // Collect Fees
  // ==========================================================

  async getCollectedFees(params = {}) {
    return apiClient.get('/fees/collect', { params })
  },

  async getCollectedFee(id) {
    return apiClient.get(`/fees/collect/${id}`)
  },

  async collectPayment(payload) {
    return apiClient.post('/fees/collect', payload)
  },

  async updateCollectedFee(id, payload) {
    return apiClient.put(`/fees/collect/${id}`, payload)
  },

  async deleteCollectedFee(id) {
    return apiClient.delete(`/fees/collect/${id}`)
  },

  // ==========================================================
  // Fees Discount
  // ==========================================================

  async getFeesDiscounts(params = {}) {
    return apiClient.get('/fees/discount', { params })
  },

  async getFeesDiscount(id) {
    return apiClient.get(`/fees/discount/${id}`)
  },

  async createFeesDiscount(payload) {
    return apiClient.post('/fees/discount', payload)
  },

  async updateFeesDiscount(id, payload) {
    return apiClient.put(`/fees/discount/${id}`, payload)
  },

  async deleteFeesDiscount(id) {
    return apiClient.delete(`/fees/discount/${id}`)
  },

  // ==========================================================
  // Carry Forward
  // ==========================================================

  async getCarryForward(params = {}) {
    return apiClient.get('/fees/carry-forward', { params })
  },

  async getCarryForwardById(id) {
    return apiClient.get(`/fees/carry-forward/${id}`)
  },

  async createCarryForward(payload) {
    return apiClient.post('/fees/carry-forward', payload)
  },

  async updateCarryForward(id, payload) {
    return apiClient.put(`/fees/carry-forward/${id}`, payload)
  },

  async deleteCarryForward(id) {
    return apiClient.delete(`/fees/carry-forward/${id}`)
  },

  // ==========================================================
  // Fees Reminder
  // ==========================================================

  async getReminders(params = {}) {
    return apiClient.get('/fees/reminder', { params })
  },

  async getReminder(id) {
    return apiClient.get(`/fees/reminder/${id}`)
  },

  async createReminder(payload) {
    return apiClient.post('/fees/reminder', payload)
  },

  async updateReminder(id, payload) {
    return apiClient.put(`/fees/reminder/${id}`, payload)
  },

  async deleteReminder(id) {
    return apiClient.delete(`/fees/reminder/${id}`)
  },

  // ==========================================================
  // Offline Bank Payment
  // ==========================================================

  async getOfflinePayments(params = {}) {
    return apiClient.get('/fees/offline-payment', { params })
  },

  async getOfflinePayment(id) {
    return apiClient.get(`/fees/offline-payment/${id}`)
  },

  async createOfflinePayment(payload) {
    return apiClient.post('/fees/offline-payment', payload)
  },

  async updateOfflinePayment(id, payload) {
    return apiClient.put(`/fees/offline-payment/${id}`, payload)
  },

  async deleteOfflinePayment(id) {
    return apiClient.delete(`/fees/offline-payment/${id}`)
  },

  // ==========================================================
  // Search Due Fees
  //
  // params:
  // class_id
  // section
  // session
  // page
  // limit
  // ==========================================================

  async searchDueFees(params = {}) {
    return apiClient.get('/fees/search-due', {
      params,
    })
  },

  // ==========================================================
  // Search Fee Payments
  //
  // body:
  // {
  //   keyword
  // }
  //
  // params:
  // page
  // limit
  // ==========================================================

  async searchFeesPayment(payload, params = {}) {
    return apiClient.post('/fees/search-payment', payload, {
      params,
    })
  },

  // ==========================================================
  // Alias methods used by hooks/pages
  // ==========================================================

  // useFeesCollection hook calls getFeesCollection
  async getFeesCollection(params = {}) {
    return apiClient.get('/fees/collect', { params })
  },

  // CollectFees page calls getStudentFeeSummary
  async getStudentFeeSummary(studentId) {
    return apiClient.get(`/fees/collect/student/${studentId}`)
  },

  // useFeesReminder hook calls getFeesReminder
  async getFeesReminder(params = {}) {
    return apiClient.get('/fees/reminder', { params })
  },

  // useDueFees hook calls getDueFees
  async getDueFees(params = {}) {
    return apiClient.get('/fees/search-due', { params })
  },

  // useFeesPayments hook calls getFeesPayments
 async getFeesPayments(keyword = "", params = {}) {
  return apiClient.post(
    "/fees/search-payment",
    {
      keyword,
    },
    {
      params,
    }
  )
},


  // useOfflinePayments hook calls approveOfflinePayment / rejectOfflinePayment
  async approveOfflinePayment(id) {
    return apiClient.put(`/fees/offline-payment/${id}/approve`)
  },

  async rejectOfflinePayment(id) {
    return apiClient.put(`/fees/offline-payment/${id}/reject`)
  },

  // useFeesCollection hook calls searchStudents
  async searchStudents(query) {
    const students = await apiClient.get('/student/details/all', { params: { page: 1, limit: 100 } })
    const term = String(query || '').trim().toLowerCase()
    return (Array.isArray(students) ? students : students?.data || []).filter((student) => {
      const name = [student.name?.first, student.name?.last].filter(Boolean).join(' ')
      return !term || [name, student.email, student.mobile, student.roll_number, student.class_name]
        .some((field) => String(field || '').toLowerCase().includes(term))
    })
  },
} 

export default feesService
