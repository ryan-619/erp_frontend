import apiClient from "./api";

export const homeworkService = {
  // ==========================================================
  // Homework
  // ==========================================================

  getHomeworks(params = {}) {
    return apiClient.get("/homework/add", {
      params,
    });
  },

  getHomework(id) {
    return apiClient.get(`/homework/add/${id}`);
  },

  createHomework(payload) {
    return apiClient.post("/homework/add", payload);
  },

  updateHomework(id, payload) {
    return apiClient.put(`/homework/add/${id}`, payload);
  },

  deleteHomework(id) {
    return apiClient.delete(`/homework/add/${id}`);
  },

  // ==========================================================
  // Daily Assignments
  // ==========================================================

  getDailyAssignments(params = {}) {
    return apiClient.get("/homework/daily-assignment", {
      params,
    });
  },

  getDailyAssignment(id) {
    return apiClient.get(`/homework/daily-assignment/${id}`);
  },

  createDailyAssignment(payload) {
    return apiClient.post("/homework/daily-assignment", payload);
  },

  updateDailyAssignment(id, payload) {
    return apiClient.put(`/homework/daily-assignment/${id}`, payload);
  },

  deleteDailyAssignment(id) {
    return apiClient.delete(`/homework/daily-assignment/${id}`);
  },

  // ==========================================================
  // Reference Data
  // ==========================================================

  getClasses(params = {}) {
    return apiClient.get("/academic/class", {
      params,
    });
  },

  getSubjects(params = {}) {
    return apiClient.get("/academic/subjects", {
      params,
    });
  },

  getTeachers(params = {}) {
    return apiClient.get("/hr/staff-directory", {
      params,
    });
  },
};

export default homeworkService;