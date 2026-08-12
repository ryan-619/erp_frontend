import apiClient from "./api";

export const lessonService = {
  // ==========================================================
  // Lessons
  // ==========================================================

  getLessons(params = {}) {
    return apiClient.get("/lesson/lesson", { params });
  },

  getLesson(id) {
    return apiClient.get(`/lesson/lesson/${id}`);
  },

  createLesson(payload) {
    return apiClient.post("/lesson/lesson", payload);
  },

  updateLesson(id, payload) {
    return apiClient.put(`/lesson/lesson/${id}`, payload);
  },

  deleteLesson(id) {
    return apiClient.delete(`/lesson/lesson/${id}`);
  },

  // ==========================================================
  // Topics
  // ==========================================================

  getTopics(params = {}) {
    return apiClient.get("/lesson/topic", { params });
  },

  getTopic(id) {
    return apiClient.get(`/lesson/topic/${id}`);
  },

  createTopic(payload) {
    return apiClient.post("/lesson/topic", payload);
  },

  updateTopic(id, payload) {
    return apiClient.put(`/lesson/topic/${id}`, payload);
  },

  deleteTopic(id) {
    return apiClient.delete(`/lesson/topic/${id}`);
  },

  // ==========================================================
  // Lesson Plans
  // ==========================================================

  getLessonPlans(params = {}) {
    return apiClient.get("/lesson/lesson-plan", { params });
  },

  getLessonPlan(id) {
    return apiClient.get(`/lesson/lesson-plan/${id}`);
  },

  createLessonPlan(payload) {
    return apiClient.post("/lesson/lesson-plan", payload);
  },

  updateLessonPlan(id, payload) {
    return apiClient.put(`/lesson/lesson-plan/${id}`, payload);
  },

  deleteLessonPlan(id) {
    return apiClient.delete(`/lesson/lesson-plan/${id}`);
  },

  // ==========================================================
  // Syllabus Status
  // ==========================================================

  getSyllabusStatuses(params = {}) {
    return apiClient.get("/lesson/syllabus-status", { params });
  },

  getSyllabusStatus(id) {
    return apiClient.get(`/lesson/syllabus-status/${id}`);
  },

  createSyllabusStatus(payload) {
    return apiClient.post("/lesson/syllabus-status", payload);
  },

  updateSyllabusStatus(id, payload) {
    return apiClient.put(`/lesson/syllabus-status/${id}`, payload);
  },

  deleteSyllabusStatus(id) {
    return apiClient.delete(`/lesson/syllabus-status/${id}`);
  },
};

export default lessonService;
