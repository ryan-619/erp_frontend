// ====================================================================
// Leave Service
//
// Handles all backend communication for student leave requests
//
// Backend endpoints:
// - GET /api/attendance/approve-leave - Get all leave requests
// - POST /api/attendance/approve-leave - Create leave request
// - GET /api/attendance/approve-leave/:id - Get specific leave request
// - PUT /api/attendance/approve-leave/:id - Update leave request (approve/reject)
// - DELETE /api/attendance/approve-leave/:id - Delete leave request
// ====================================================================

import apiClient from './api'

export const leaveService = {
  // Get all leave requests (for staff/admin to view pending requests)
  async getAllLeaveRequests() {
    return apiClient.get('/attendance/approve-leave')
  },

  // Get leave requests for current student
  async getMyLeaveRequests() {
    return apiClient.get('/attendance/approve-leave')
  },

  // Create new leave request (student applies for leave)
  async applyLeave(leaveData) {
    return apiClient.post('/attendance/approve-leave', {
      ...leaveData,
      status: 'pending' // Ensure status is set to pending by default
    })
  },

  // Get specific leave request by ID
  async getLeaveById(id) {
    return apiClient.get(`/attendance/approve-leave/${id}`)
  },

  // Update leave request (approve/reject)
  async updateLeaveRequest(id, updateData) {
    return apiClient.put(`/attendance/approve-leave/${id}`, updateData)
  },

  // Delete leave request
  async deleteLeaveRequest(id) {
    return apiClient.delete(`/attendance/approve-leave/${id}`)
  },

  // Approve leave request
  async approveLeave(id) {
    return this.updateLeaveRequest(id, { status: 'approved' })
  },

  // Reject leave request
  async rejectLeave(id, reason) {
    return this.updateLeaveRequest(id, { status: 'rejected', rejection_reason: reason })
  }
}

export default leaveService