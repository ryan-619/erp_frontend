import apiClient from "./api";

export const examinationService = {
  // ==========================================================
  // Exam Groups
  // ==========================================================

  getExamGroups(params = {}) {
    return apiClient.get("/exam/group", { params });
  },

  getExamGroup(id) {
    return apiClient.get(`/exam/group/${id}`);
  },

  createExamGroup(payload) {
    return apiClient.post("/exam/group", payload);
  },

  updateExamGroup(id, payload) {
    return apiClient.put(`/exam/group/${id}`, payload);
  },

  deleteExamGroup(id) {
    return apiClient.delete(`/exam/group/${id}`);
  },

  // ==========================================================
  // Exam Schedule
  // ==========================================================

  getExamSchedules(params = {}) {
    return apiClient.get("/exam/schedule", { params });
  },

  getExamSchedule(id) {
    return apiClient.get(`/exam/schedule/${id}`);
  },

  createExamSchedule(payload) {
    return apiClient.post("/exam/schedule", payload);
  },

  updateExamSchedule(id, payload) {
    return apiClient.put(`/exam/schedule/${id}`, payload);
  },

  deleteExamSchedule(id) {
    return apiClient.delete(`/exam/schedule/${id}`);
  },

  // ==========================================================
  // Exam Results
  // ==========================================================

  getExamResults(params = {}) {
    return apiClient.get("/exam/result", { params });
  },

  getExamResult(id) {
    return apiClient.get(`/exam/result/${id}`);
  },

  createExamResult(payload) {
    return apiClient.post("/exam/result", payload);
  },

  updateExamResult(id, payload) {
    return apiClient.put(`/exam/result/${id}`, payload);
  },

  deleteExamResult(id) {
    return apiClient.delete(`/exam/result/${id}`);
  },

  // ==========================================================
  // Marks Grade
  // ==========================================================

  getMarksGrades(params = {}) {
    return apiClient.get("/exam/marks-grade", { params });
  },

  getMarksGrade(id) {
    return apiClient.get(`/exam/marks-grade/${id}`);
  },

  createMarksGrade(payload) {
    return apiClient.post("/exam/marks-grade", payload);
  },

  updateMarksGrade(id, payload) {
    return apiClient.put(`/exam/marks-grade/${id}`, payload);
  },

  deleteMarksGrade(id) {
    return apiClient.delete(`/exam/marks-grade/${id}`);
  },

  // ==========================================================
  // Marks Division
  // ==========================================================

  getMarksDivisions(params = {}) {
    return apiClient.get("/exam/marks-division", { params });
  },

  getMarksDivision(id) {
    return apiClient.get(`/exam/marks-division/${id}`);
  },

  createMarksDivision(payload) {
    return apiClient.post("/exam/marks-division", payload);
  },

  updateMarksDivision(id, payload) {
    return apiClient.put(`/exam/marks-division/${id}`, payload);
  },

  deleteMarksDivision(id) {
    return apiClient.delete(`/exam/marks-division/${id}`);
  },

  // ==========================================================
  // Design Marksheet
  // ==========================================================

  getMarksheetDesigns(params = {}) {
    return apiClient.get("/exam/design-marksheet", { params });
  },

  getMarksheetDesign(id) {
    return apiClient.get(`/exam/design-marksheet/${id}`);
  },

  createMarksheetDesign(payload) {
    return apiClient.post("/exam/design-marksheet", payload);
  },

  updateMarksheetDesign(id, payload) {
    return apiClient.put(`/exam/design-marksheet/${id}`, payload);
  },

  deleteMarksheetDesign(id) {
    return apiClient.delete(`/exam/design-marksheet/${id}`);
  },

  // ==========================================================
  // Design Admit Card
  // ==========================================================

  getAdmitCardDesigns(params = {}) {
    return apiClient.get("/exam/design-admit-card", { params });
  },

  getAdmitCardDesign(id) {
    return apiClient.get(`/exam/design-admit-card/${id}`);
  },

  createAdmitCardDesign(payload) {
    return apiClient.post("/exam/design-admit-card", payload);
  },

  updateAdmitCardDesign(id, payload) {
    return apiClient.put(`/exam/design-admit-card/${id}`, payload);
  },

  deleteAdmitCardDesign(id) {
    return apiClient.delete(`/exam/design-admit-card/${id}`);
  },

  // ==========================================================
  // Print Marksheet
  // ==========================================================

  printMarksheet(studentId) {
    return apiClient.get(`/exam/print-marksheet/${studentId}`, {
      responseType: 'blob' // Important for PDF responses
    });
  },

  // ==========================================================
  // Print Admit Card
  // ==========================================================

  printAdmitCard(studentId) {
    return apiClient.get(`/exam/print-admit-card/${studentId}`, {
      responseType: 'blob' // Important for PDF responses
    });
  },

  // ==========================================================
  // Alias methods used by hooks/pages
  // ==========================================================

  // Hooks use remove* instead of delete*
  async removeExamGroup(id) { return this.deleteExamGroup(id); },
  async removeSchedule(id) { return this.deleteExamSchedule(id); },
  async removeResult(id) { return this.deleteExamResult(id); },
  async removeMarksGrade(id) { return this.deleteMarksGrade(id); },
  async removeMarksDivision(id) { return this.deleteMarksDivision(id); },

  // Hooks use create*/update* with short nouns
  async createSchedule(payload) { return this.createExamSchedule(payload); },
  async updateSchedule(id, payload) { return this.updateExamSchedule(id, payload); },
  async createResult(payload) { return this.createExamResult(payload); },
  async updateResult(id, payload) { return this.updateExamResult(id, payload); },

  // Hooks use bulkDeleteExamGroups
  async bulkDeleteExamGroups(ids) {
    return apiClient.post('/exam/group/bulk-delete', { ids });
  },

  // Print/Design pages use different names
  // async getAdmitCards(params = {}) { return this.getAdmitCardDesigns(params); },
  async getMarksheets(params = {}) { return this.getMarksheetDesigns(params); },
  async updateAdmitCardTemplate(id, payload) { return this.updateAdmitCardDesign(id, payload); },
  async updateMarksheetTemplate(id, payload) { return this.updateMarksheetDesign(id, payload); },
};

export default examinationService;