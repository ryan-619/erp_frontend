import apiClient from "./api";

export const schoolService = {
  // ==========================================================
  // Schools
  // ==========================================================

  list(params = {}) {
    return apiClient.get("/schools", {
      params,
    });
  },

  get(id) {
    return apiClient.get(`/schools/${id}`);
  },

  create(payload) {
    return apiClient.post("/schools", payload);
  },

  update(id, payload) {
    return apiClient.put(`/schools/${id}`, payload);
  },

  remove(id) {
    return apiClient.delete(`/schools/${id}`);
  },

  stats(id) {
    return apiClient.get(`/schools/${id}/stats`);
  },
};

export default schoolService;