import apiClient from "./api";

export const onlineExamService = {
  // ==========================================================
  // Online Exams
  // ==========================================================

  getExams(params = {}) {
    return apiClient.get("/online-exam/exam", {
      params,
    });
  },

  getExam(id) {
    return apiClient.get(`/online-exam/exam/${id}`);
  },

  createExam(payload) {
    return apiClient.post("/online-exam/exam", payload);
  },

  updateExam(id, payload) {
    return apiClient.put(`/online-exam/exam/${id}`, payload);
  },

  deleteExam(id) {
    return apiClient.delete(`/online-exam/exam/${id}`);
  },

  // ==========================================================
  // Question Bank
  // ==========================================================

  getQuestions(params = {}) {
    return apiClient.get("/online-exam/question-bank", {
      params,
    });
  },

  getQuestion(id) {
    return apiClient.get(`/online-exam/question-bank/${id}`);
  },

  createQuestion(payload) {
    return apiClient.post("/online-exam/question-bank", payload);
  },

  updateQuestion(id, payload) {
    return apiClient.put(`/online-exam/question-bank/${id}`, payload);
  },

  deleteQuestion(id) {
    return apiClient.delete(`/online-exam/question-bank/${id}`);
  },
};

export default onlineExamService;