import apiClient from "./api";

export const usersService = {
  // ==========================================================
  // Users
  // ==========================================================

  list(params = {}) {
    return apiClient.get("/users", {
      params,
    });
  },

  getByType(type, params = {}) {
    return apiClient.get(`/users/type/${type}`, {
      params,
    });
  },

  get(id) {
    return apiClient.get(`/users/${id}`);
  },

  create(payload) {
    return apiClient.post("/users", payload);
  },

  update(id, payload) {
    return apiClient.put(`/users/${id}`, payload);
  },

  remove(id) {
    return apiClient.delete(`/users/${id}`);
  },

  updateStatus(id, payload) {
    return apiClient.patch(`/users/status/${id}`, payload);
  },

  // ==========================================================
  // Roles & Permissions
  // ==========================================================

  roles(params = {}) {
    return apiClient.get("/role-permission", {
      params,
    });
  },

  getRole(id) {
    return apiClient.get(`/role-permission/${id}`);
  },

  createRole(payload) {
    return apiClient.post("/role-permission", payload);
  },

  updateRole(id, payload) {
    return apiClient.put(`/role-permission/${id}`, payload);
  },

  deleteRole(id) {
    return apiClient.delete(`/role-permission/${id}`);
  },
};

export default usersService;