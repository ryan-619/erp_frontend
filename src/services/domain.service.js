import apiClient from "./api";

export const domainService = {
  list(params = {}) {
    return apiClient.get("/domains", { params });
  },

  get(id) {
    return apiClient.get(`/domains/${id}`);
  },

  create(payload) {
    return apiClient.post("/domains", payload);
  },

  update(id, payload) {
    return apiClient.put(`/domains/${id}`, payload);
  },

  remove(id) {
    return apiClient.delete(`/domains/${id}`);
  },
};

export default domainService;