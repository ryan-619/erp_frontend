// ====================================================================
// Academics Service
//
// Handles all backend communication for Academic Module.
//
// Backend Endpoints:
//
// /api/academic/class
// /api/academic/sections
// /api/academic/subjects
// /api/academic/subject-group
// /api/academic/assign-teacher
// /api/academic/class-timetable
// /api/academic/teacher-timetable
// /api/academic/promote-students
//
// Response Format:
// {
//   success,
//   message,
//   data
// }
// ====================================================================

import apiClient from './api'

export const academicsService = {
  async classes(page = 1, limit = 25) {
    const res = await apiClient.get(`/academic/class?page=${page}&limit=${limit}`)
    return res || []
  },

  createClass(data) {
    return apiClient.post("/academic/class", {
      class_name: data.class_name,
    })
  },

  updateClass(id, data) {
    return apiClient.put(`/academic/class/${id}`, {
      class_name: data.class_name,
    })
  },

  deleteClass(id) {
    return apiClient.delete(`/academic/class/${id}`)
  },


  // ==========================================================
  // Sections
  // ==========================================================

  async sections(params = {}) {
    const res = await apiClient.get('/academic/sections', {
      params,
    })
    return res || []
  },

  async getSection(id) {
    return apiClient.get(`/academic/sections/${id}`)
  },

  async createSection(payload) {
    return apiClient.post('/academic/sections', payload)
  },

  async updateSection(id, payload) {
    return apiClient.put(`/academic/sections/${id}`, payload)
  },

  async deleteSection(id) {
    return apiClient.delete(`/academic/sections/${id}`)
  },

  // ==========================================================
  // Subject Groups
  // ==========================================================

  async subjectGroups(params = {}) {
    const res = await apiClient.get('/academic/subject-group', {
      params,
    })
    return res || []
  },

  async getSubjectGroup(id) {
    return apiClient.get(`/academic/subject-group/${id}`)
  },

  async createSubjectGroup(payload) {
    return apiClient.post('/academic/subject-group', payload)
  },

  async updateSubjectGroup(id, payload) {
    return apiClient.put(`/academic/subject-group/${id}`, payload)
  },

  async deleteSubjectGroup(id) {
    return apiClient.delete(`/academic/subject-group/${id}`)
  },

  // ==========================================================
  // Subjects
  // ==========================================================

  async subjects(params = {}) {
    const res = await apiClient.get('/academic/subjects', { params })
    return res || []
  },

  async getSubject(id) {
    return apiClient.get(`/academic/subjects/${id}`)
  },

  async createSubject(payload) {
    return apiClient.post('/academic/subjects', payload)
  },

  async updateSubject(id, payload) {
    return apiClient.put(`/academic/subjects/${id}`, payload)
  },

  async deleteSubject(id) {
    return apiClient.delete(`/academic/subjects/${id}`)
  },

  // ==========================================================
  // Assign Class Teacher
  // ==========================================================

  async classTeachers(params = {}) {
    const res = await apiClient.get('/academic/assign-teacher', {
      params,
    })
    return res || []
  },

  async getClassTeacher(id) {
    return apiClient.get(`/academic/assign-teacher/${id}`)
  },

  async createClassTeacher(payload) {
    return apiClient.post('/academic/assign-teacher', payload)
  },

  async updateClassTeacher(id, payload) {
    return apiClient.put(`/academic/assign-teacher/${id}`, payload)
  },

  async deleteClassTeacher(id) {
    return apiClient.delete(`/academic/assign-teacher/${id}`)
  },

  // ==========================================================
  // Class Timetable
  // ==========================================================

  async classTimetable(params = {}) {
    const res = await apiClient.get('/academic/class-timetable', {
      params,
    })
    return res || []
  },

  async getClassTimetable(id) {
    return apiClient.get(`/academic/class-timetable/${id}`)
  },

  async createClassTimetable(payload) {
    return apiClient.post('/academic/class-timetable', payload)
  },

  async updateClassTimetable(id, payload) {
    return apiClient.put(`/academic/class-timetable/${id}`, payload)
  },

  async deleteClassTimetable(id) {
    return apiClient.delete(`/academic/class-timetable/${id}`)
  },

  // ==========================================================
  // Teacher Timetable
  // Backend:
  // GET /api/academic/teacher-timetable/:teacherId
  // ==========================================================

  async teacherTimetable(teacherId) {
    const res = await apiClient.get(`/academic/teacher-timetable/${teacherId}`)
    return res || []
  },

  // ==========================================================
  // Promote Students
  // ==========================================================

  async promotedStudents(params = {}) {
    const res = await apiClient.get('/academic/promote-students', {
      params,
    })
    return res || []
  },

  async getPromotion(id) {
    return apiClient.get(`/academic/promote-students/${id}`)
  },

  async promoteStudents(payload) {
    return apiClient.post('/academic/promote-students', payload)
  },

  async updatePromotion(id, payload) {
    return apiClient.put(`/academic/promote-students/${id}`, payload)
  },

  async deletePromotion(id) {
    return apiClient.delete(`/academic/promote-students/${id}`)
  },

  // ==========================================================
  // Alias methods used by hooks
  // Hooks call generic update/remove/bulkDelete — route to entity-specific methods.
  // ==========================================================

  async update(id, payload) { return this.updateClass(id, payload); },
  async remove(id) { return this.deleteClass(id); },
  async bulkDelete(ids) { return apiClient.post('/academic/class/bulk-delete', { ids }); },
}

export default academicsService