import apiClient from "./api";

export const transportService = {
  // ==========================================================
  // Transport Routes
  // ==========================================================

  getTransportRoutes(params = {}) {
    return apiClient.get("/transport/routes", {
      params,
    });
  },

  getTransportRouteById(id) {
    return apiClient.get(`/transport/routes/${id}`);
  },

  createTransportRoute(payload) {
    return apiClient.post("/transport/routes", payload);
  },

  updateTransportRoute(id, payload) {
    return apiClient.put(`/transport/routes/${id}`, payload);
  },

  deleteTransportRoute(id) {
    return apiClient.delete(`/transport/routes/${id}`);
  },

  // ==========================================================
  // Vehicles
  // ==========================================================

  getVehicles(params = {}) {
    return apiClient.get("/transport/vehicles", {
      params,
    });
  },

  getVehicleById(id) {
    return apiClient.get(`/transport/vehicles/${id}`);
  },

  createVehicle(payload) {
    return apiClient.post("/transport/vehicles", payload);
  },

  updateVehicle(id, payload) {
    return apiClient.put(`/transport/vehicles/${id}`, payload);
  },

  deleteVehicle(id) {
    return apiClient.delete(`/transport/vehicles/${id}`);
  },

  // ==========================================================
  // Pickup Points
  // ==========================================================

  getPickupPoints(params = {}) {
    return apiClient.get("/transport/pickup-point", {
      params,
    });
  },

  getPickupPointById(id) {
    return apiClient.get(`/transport/pickup-point/${id}`);
  },

  createPickupPoint(payload) {
    return apiClient.post("/transport/pickup-point", payload);
  },

  updatePickupPoint(id, payload) {
    return apiClient.put(`/transport/pickup-point/${id}`, payload);
  },

  deletePickupPoint(id) {
    return apiClient.delete(`/transport/pickup-point/${id}`);
  },

  // ==========================================================
  // Route Pickup Points (Assign Pickup Point)
  // ==========================================================

  getRoutePickupPoints(params = {}) {
    return apiClient.get("/transport/route-pickup-point", {
      params,
    });
  },

  getRoutePickupPointById(id) {
    return apiClient.get(`/transport/route-pickup-point/${id}`);
  },

  createRoutePickupPoint(payload) {
    return apiClient.post("/transport/route-pickup-point", payload);
  },

  updateRoutePickupPoint(id, payload) {
    return apiClient.put(`/transport/route-pickup-point/${id}`, payload);
  },

  deleteRoutePickupPoint(id) {
    return apiClient.delete(`/transport/route-pickup-point/${id}`);
  },

  // ==========================================================
  // Assign Vehicle
  // ==========================================================

  getAssignVehicles(params = {}) {
    return apiClient.get("/transport/assign-vehicle", {
      params,
    });
  },

  getAssignVehicleById(id) {
    return apiClient.get(`/transport/assign-vehicle/${id}`);
  },

  createAssignVehicle(payload) {
    return apiClient.post("/transport/assign-vehicle", payload);
  },

  updateAssignVehicle(id, payload) {
    return apiClient.put(`/transport/assign-vehicle/${id}`, payload);
  },

  deleteAssignVehicle(id) {
    return apiClient.delete(`/transport/assign-vehicle/${id}`);
  },

  // ==========================================================
  // Transport Fees Master
  // ==========================================================

  getTransportFeesMaster(params = {}) {
    return apiClient.get("/transport/fees-master", {
      params,
    });
  },

  getTransportFeesMasterById(id) {
    return apiClient.get(`/transport/fees-master/${id}`);
  },

  createTransportFeesMaster(payload) {
    return apiClient.post("/transport/fees-master", payload);
  },

  updateTransportFeesMaster(id, payload) {
    return apiClient.put(`/transport/fees-master/${id}`, payload);
  },

  deleteTransportFeesMaster(id) {
    return apiClient.delete(`/transport/fees-master/${id}`);
  },

  // ==========================================================
  // Student Transport Fees
  // ==========================================================

  getStudentTransportFees(params = {}) {
    return apiClient.get("/transport/student-fees", {
      params,
    });
  },

  getStudentTransportFeeById(id) {
    return apiClient.get(`/transport/student-fees/${id}`);
  },

  createStudentTransportFee(payload) {
    return apiClient.post("/transport/student-fees", payload);
  },

  updateStudentTransportFee(id, payload) {
    return apiClient.put(`/transport/student-fees/${id}`, payload);
  },

  deleteStudentTransportFee(id) {
    return apiClient.delete(`/transport/student-fees/${id}`);
  },
};

export default transportService;
