// ====================================================================
// Attendance Service
//
// Handles all backend communication for Attendance Module.
//
// Backend Endpoints:
//   /api/attendance/student
//   /api/attendance/by-date
//   /api/attendance/approve-leave
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

export const attendanceService = {
  // ==========================================================
  // Student Attendance
  // ==========================================================

  async list(params = {}) {
    const res = await apiClient.get('/attendance/student', {
      params,
    })
    return res || []
  },

  async get(id) {
    const res = await apiClient.get(`/attendance/student/${id}`)
    return res
  },

  async create(payload) {
    const res = await apiClient.post('/attendance/student', payload)
    return res
  },

  async update(id, payload) {
    const res = await apiClient.put(`/attendance/student/${id}`, payload)
    return res
  },

  async remove(id) {
    const res = await apiClient.delete(`/attendance/student/${id}`)
    return res
  },

  async markAttendance(id, payload) {
    const res = await apiClient.put(`/attendance/student/${id}`, payload)
    return res
  },

  async bulkMark(payload) {
    const res = await apiClient.post('/attendance/student/bulk', payload)
    return res
  },

  // Alias for getLeaves — hooks call leaves()
  async leaves(params = {}) {
    const res = await apiClient.get('/attendance/approve-leave', { params })
    return res || []
  },

  // ==========================================================
  // Attendance By Date
  // Backend expects:
  // {
  //   attendanceDate: "2026-07-28"
  // }
  //
  // Optional Query Params:
  // page
  // limit
  // ==========================================================
async byDate(date, params = {}) {
  return await apiClient.post(
    '/attendance/by-date',
    {
      attendanceDate: date,
    },
    {
      params,
    }
  )
},

  // ==========================================================
  // Leave Approval
  // ==========================================================

  async getLeaves(params = {}) {
    const res = await apiClient.get('/attendance/approve-leave', {
      params,
    })
    return res || []
  },

  async getLeave(id) {
    const res = await apiClient.get(`/attendance/approve-leave/${id}`)
    return res
  },

  async createLeave(payload) {
    const res = await apiClient.post('/attendance/approve-leave', payload)
    return res
  },

  async updateLeave(id, payload) {
    const res = await apiClient.put(`/attendance/approve-leave/${id}`, payload)
    return res
  },

  async deleteLeave(id) {
    const res = await apiClient.delete(`/attendance/approve-leave/${id}`)
    return res
  },
}

export default attendanceService