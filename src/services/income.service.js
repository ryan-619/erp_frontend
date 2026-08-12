import apiClient from "./api";

export const incomeService = {
  // ==============================
  // Income Heads
  // ==============================

  getIncomeHeads(params = {}) {
    return apiClient.get("/income/head", {
      params,
    });
  },

  getIncomeHead(id) {
    return apiClient.get(`/income/head/${id}`);
  },

  createIncomeHead(payload) {
    return apiClient.post("/income/head", payload);
  },

  updateIncomeHead(id, payload) {
    return apiClient.put(`/income/head/${id}`, payload);
  },

  deleteIncomeHead(id) {
    return apiClient.delete(`/income/head/${id}`);
  },

  // ==============================
  // Income
  // ==============================

  getIncomes(params = {}) {
    return apiClient.get("/income/add", {
      params,
    });
  },

  getIncome(id) {
    return apiClient.get(`/income/add/${id}`);
  },

  createIncome(payload) {
    return apiClient.post("/income/add", payload);
  },

  updateIncome(id, payload) {
    return apiClient.put(`/income/add/${id}`, payload);
  },

  deleteIncome(id) {
    return apiClient.delete(`/income/add/${id}`);
  },

  // ==============================
  // Search Income
  // ==============================

  searchIncomes(params = {}) {
    return apiClient.get("/income/search", {
      params,
    });
  },
};

export default incomeService;