// ====================================================================
// Certificate Service
//
// Service layer isolates all backend communication for the Certificate
// module. Pages never call APIs directly — they call these methods.
//
// Backend routes (all mounted under /api/certificate):
//   student-certificate     — CRUD for student certificate templates
//   generate-certificate   — CRUD for generated certificates
//   student-id-card        — CRUD for student ID card designs
//   generate-id-card       — CRUD for generated student ID cards
//   staff-id-card          — CRUD for staff ID card designs
//   generate-staff-id-card — CRUD for generated staff ID cards
// ====================================================================

import apiClient from './api'

export const certificateService = {
  // ─── Student Certificates ────────────────────────────────────────────────────
  async getStudentCertificates() {
    return apiClient.get('/certificate/student-certificate')
  },
  async getStudentCertificateById(id) {
    return apiClient.get(`/certificate/student-certificate/${id}`)
  },
  async createStudentCertificate(payload) {
    return apiClient.post('/certificate/student-certificate', payload)
  },
  async updateStudentCertificate(id, payload) {
    return apiClient.put(`/certificate/student-certificate/${id}`, payload)
  },
  async deleteStudentCertificate(id) {
    return apiClient.delete(`/certificate/student-certificate/${id}`)
  },

  // ─── Generated Certificates ──────────────────────────────────────────────────
  async getGeneratedCertificates() {
    return apiClient.get('/certificate/generate-certificate')
  },
  async getGeneratedCertificateById(id) {
    return apiClient.get(`/certificate/generate-certificate/${id}`)
  },
  async createGeneratedCertificate(payload) {
    return apiClient.post('/certificate/generate-certificate', payload)
  },
  async updateGeneratedCertificate(id, payload) {
    return apiClient.put(`/certificate/generate-certificate/${id}`, payload)
  },
  async deleteGeneratedCertificate(id) {
    return apiClient.delete(`/certificate/generate-certificate/${id}`)
  },

  // ─── Student ID Card Designs ──────────────────────────────────────────────────
  async getStudentIdCards() {
    return apiClient.get('/certificate/student-id-card')
  },
  async getStudentIdCardById(id) {
    return apiClient.get(`/certificate/student-id-card/${id}`)
  },
  async createStudentIdCard(payload) {
    return apiClient.post('/certificate/student-id-card', payload)
  },
  async updateStudentIdCard(id, payload) {
    return apiClient.put(`/certificate/student-id-card/${id}`, payload)
  },
  async deleteStudentIdCard(id) {
    return apiClient.delete(`/certificate/student-id-card/${id}`)
  },

  // ─── Generated Student ID Cards ──────────────────────────────────────────────
  async getGeneratedStudentIdCards() {
    return apiClient.get('/certificate/generate-id-card')
  },
  async getGeneratedStudentIdCardById(id) {
    return apiClient.get(`/certificate/generate-id-card/${id}`)
  },
  async createGeneratedStudentIdCard(payload) {
    return apiClient.post('/certificate/generate-id-card', payload)
  },
  async updateGeneratedStudentIdCard(id, payload) {
    return apiClient.put(`/certificate/generate-id-card/${id}`, payload)
  },
  async deleteGeneratedStudentIdCard(id) {
    return apiClient.delete(`/certificate/generate-id-card/${id}`)
  },

  // ─── Staff ID Card Designs ────────────────────────────────────────────────────
  async getStaffIdCards() {
    return apiClient.get('/certificate/staff-id-card')
  },
  async getStaffIdCardById(id) {
    return apiClient.get(`/certificate/staff-id-card/${id}`)
  },
  async createStaffIdCard(payload) {
    return apiClient.post('/certificate/staff-id-card', payload)
  },
  async updateStaffIdCard(id, payload) {
    return apiClient.put(`/certificate/staff-id-card/${id}`, payload)
  },
  async deleteStaffIdCard(id) {
    return apiClient.delete(`/certificate/staff-id-card/${id}`)
  },

  // ─── Generated Staff ID Cards ────────────────────────────────────────────────
  async getGeneratedStaffIdCards() {
    return apiClient.get('/certificate/generate-staff-id-card')
  },
  async getGeneratedStaffIdCardById(id) {
    return apiClient.get(`/certificate/generate-staff-id-card/${id}`)
  },
  async createGeneratedStaffIdCard(payload) {
    return apiClient.post('/certificate/generate-staff-id-card', payload)
  },
  async updateGeneratedStaffIdCard(id, payload) {
    return apiClient.put(`/certificate/generate-staff-id-card/${id}`, payload)
  },
  async deleteGeneratedStaffIdCard(id) {
    return apiClient.delete(`/certificate/generate-staff-id-card/${id}`)
  },
}

export default certificateService
