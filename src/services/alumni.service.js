import apiClient from "./api";

export const alumniService = {
  // ==========================================================
  // Alumni
  // ==========================================================

  getAlumni(params = {}) {
    return apiClient.get("/alumni/manage", {
      params,
    });
  },

  getAlumniById(id) {
    return apiClient.get(`/alumni/manage/${id}`);
  },

  createAlumni(payload) {
    return apiClient.post("/alumni/manage", payload);
  },

  updateAlumni(id, payload) {
    return apiClient.put(`/alumni/manage/${id}`, payload);
  },

  deleteAlumni(id) {
    return apiClient.delete(`/alumni/manage/${id}`);
  },

  // ==========================================================
  // Alumni Events
  // ==========================================================

  getEvents(params = {}) {
    return apiClient.get("/alumni/events", {
      params,
    });
  },

  getEvent(id) {
    return apiClient.get(`/alumni/events/${id}`);
  },

  createEvent(payload) {
    return apiClient.post("/alumni/events", payload);
  },

  updateEvent(id, payload) {
    return apiClient.put(`/alumni/events/${id}`, payload);
  },

  deleteEvent(id) {
    return apiClient.delete(`/alumni/events/${id}`);
  },
};

export default alumniService;