import apiClient from "./api";

export const expensesService = {
  // ==========================================================
  // Expense Heads
  // ==========================================================

  getExpenseHeads(params = {}) {
    return apiClient.get("/expenses/head", {
      params,
    });
  },

  getExpenseHead(id) {
    return apiClient.get(`/expenses/head/${id}`);
  },

  createExpenseHead(payload) {
    return apiClient.post("/expenses/head", payload);
  },

  updateExpenseHead(id, payload) {
    return apiClient.put(`/expenses/head/${id}`, payload);
  },

  deleteExpenseHead(id) {
    return apiClient.delete(`/expenses/head/${id}`);
  },

  // ==========================================================
  // Expenses
  // ==========================================================

  getExpenses(params = {}) {
    return apiClient.get("/expenses/add", {
      params,
    });
  },

  getExpense(id) {
    return apiClient.get(`/expenses/add/${id}`);
  },

  createExpense(payload) {
    return apiClient.post("/expenses/add", payload);
  },

  updateExpense(id, payload) {
    return apiClient.put(`/expenses/add/${id}`, payload);
  },

  deleteExpense(id) {
    return apiClient.delete(`/expenses/add/${id}`);
  },

  // ==========================================================
  // Search Expenses
  // ==========================================================

  searchExpenses(payload) {
    return apiClient.post("/expenses/search", payload);
  },

  searchExpensesDateWise(payload) {
    return apiClient.post("/expenses/search/date-wise", payload);
  },
};

export default expensesService;