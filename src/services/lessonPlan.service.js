import apiClient from "./api";

export const lessonPlanService = {
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
  // Reference Data
  // ==========================================================
  getClasses(params = {}) {
    return apiClient.get("/academic/class", { params });
  },

  getSubjects(params = {}) {
    return apiClient.get("/academic/subject", { params });
  },
};

export default lessonPlanService;