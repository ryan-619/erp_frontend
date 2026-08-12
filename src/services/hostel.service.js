import apiClient from "./api";

export const hostelService = {
  // ==========================================================
  // Hostels
  // ==========================================================

  getHostels(params = {}) {
    return apiClient.get("/hostel/hostel", {
      params,
    });
  },

  getHostelById(id) {
    return apiClient.get(`/hostel/hostel/${id}`);
  },

  createHostel(payload) {
    return apiClient.post("/hostel/hostel", payload);
  },

  updateHostel(id, payload) {
    return apiClient.put(`/hostel/hostel/${id}`, payload);
  },

  deleteHostel(id) {
    return apiClient.delete(`/hostel/hostel/${id}`);
  },

  // ==========================================================
  // Room Types
  // ==========================================================

  getRoomTypes(params = {}) {
    return apiClient.get("/hostel/room-type", {
      params,
    });
  },

  getRoomTypeById(id) {
    return apiClient.get(`/hostel/room-type/${id}`);
  },

  createRoomType(payload) {
    return apiClient.post("/hostel/room-type", payload);
  },

  updateRoomType(id, payload) {
    return apiClient.put(`/hostel/room-type/${id}`, payload);
  },

  deleteRoomType(id) {
    return apiClient.delete(`/hostel/room-type/${id}`);
  },

  // ==========================================================
  // Hostel Rooms
  // ==========================================================

  getHostelRooms(params = {}) {
    return apiClient.get("/hostel/rooms", {
      params,
    });
  },

  getHostelRoomById(id) {
    return apiClient.get(`/hostel/rooms/${id}`);
  },

  createHostelRoom(payload) {
    return apiClient.post("/hostel/rooms", payload);
  },

  updateHostelRoom(id, payload) {
    return apiClient.put(`/hostel/rooms/${id}`, payload);
  },

  deleteHostelRoom(id) {
    return apiClient.delete(`/hostel/rooms/${id}`);
  },
};

export default hostelService;
