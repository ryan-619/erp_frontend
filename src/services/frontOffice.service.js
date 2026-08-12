import apiClient from "./api";

export const frontOfficeService = {
  // ==========================================================
  // Admission Enquiry
  // ==========================================================

  getEnquiries(params = {}) {
    return apiClient.get("/office/admission-enquiry", {
      params,
    });
  },

  getEnquiry(id) {
    return apiClient.get(`/office/admission-enquiry/${id}`);
  },

  createEnquiry(payload) {
    return apiClient.post("/office/admission-enquiry", payload);
  },

  updateEnquiry(id, payload) {
    return apiClient.put(`/office/admission-enquiry/${id}`, payload);
  },

  deleteEnquiry(id) {
    return apiClient.delete(`/office/admission-enquiry/${id}`);
  },

  // ==========================================================
  // Visitor Book
  // ==========================================================

  getVisitors(params = {}) {
    return apiClient.get("/office/visitor-book", {
      params,
    });
  },

  getVisitor(id) {
    return apiClient.get(`/office/visitor-book/${id}`);
  },

  createVisitor(payload) {
    return apiClient.post("/office/visitor-book", payload);
  },

  updateVisitor(id, payload) {
    return apiClient.put(`/office/visitor-book/${id}`, payload);
  },

  deleteVisitor(id) {
    return apiClient.delete(`/office/visitor-book/${id}`);
  },

  // ==========================================================
  // Phone Call Log
  // ==========================================================

  getCallLogs(params = {}) {
    return apiClient.get("/office/phone-call-log", {
      params,
    });
  },

  getCallLog(id) {
    return apiClient.get(`/office/phone-call-log/${id}`);
  },

  createCallLog(payload) {
    return apiClient.post("/office/phone-call-log", payload);
  },

  updateCallLog(id, payload) {
    return apiClient.put(`/office/phone-call-log/${id}`, payload);
  },

  deleteCallLog(id) {
    return apiClient.delete(`/office/phone-call-log/${id}`);
  },

  // ==========================================================
  // Postal Dispatch
  // ==========================================================

  getDispatches(params = {}) {
    return apiClient.get("/office/postal-dispatch", {
      params,
    });
  },

  getDispatch(id) {
    return apiClient.get(`/office/postal-dispatch/${id}`);
  },

  createDispatch(payload) {
    return apiClient.post("/office/postal-dispatch", payload);
  },

  updateDispatch(id, payload) {
    return apiClient.put(`/office/postal-dispatch/${id}`, payload);
  },

  deleteDispatch(id) {
    return apiClient.delete(`/office/postal-dispatch/${id}`);
  },

  // ==========================================================
  // Postal Receive
  // ==========================================================

  getReceives(params = {}) {
    return apiClient.get("/office/postal-receive", {
      params,
    });
  },

  getReceive(id) {
    return apiClient.get(`/office/postal-receive/${id}`);
  },

  createReceive(payload) {
    return apiClient.post("/office/postal-receive", payload);
  },

  updateReceive(id, payload) {
    return apiClient.put(`/office/postal-receive/${id}`, payload);
  },

  deleteReceive(id) {
    return apiClient.delete(`/office/postal-receive/${id}`);
  },

  // ==========================================================
  // Complaints
  // ==========================================================

  getComplaints(params = {}) {
    return apiClient.get("/office/complaint", {
      params,
    });
  },

  getComplaint(id) {
    return apiClient.get(`/office/complaint/${id}`);
  },

  createComplaint(payload) {
    return apiClient.post("/office/complaint", payload);
  },

  updateComplaint(id, payload) {
    return apiClient.put(`/office/complaint/${id}`, payload);
  },

  deleteComplaint(id) {
    return apiClient.delete(`/office/complaint/${id}`);
  },

  // ==========================================================
  // Front Office Setup
  // ==========================================================

  getSetup(params = {}) {
    return apiClient.get("/office/setup", {
      params,
    });
  },

  getSetupItem(id) {
    return apiClient.get(`/office/setup/${id}`);
  },

  createSetupItem(payload) {
    return apiClient.post("/office/setup", payload);
  },

  updateSetupItem(id, payload) {
    return apiClient.put(`/office/setup/${id}`, payload);
  },

  deleteSetupItem(id) {
    return apiClient.delete(`/office/setup/${id}`);
  },
};

export default frontOfficeService;