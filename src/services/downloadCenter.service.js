import apiClient from "./api";
import { academicsService } from "./academics.service";

export const downloadCenterService = {
  // ==========================================================
  // Content Types
  // ==========================================================

  getContentTypes(params = {}) {
    return apiClient.get("/download/content-type", {
      params,
    });
  },

  getContentType(id) {
    return apiClient.get(`/download/content-type/${id}`);
  },

  createContentType(payload) {
    return apiClient.post("/download/content-type", payload);
  },

  updateContentType(id, payload) {
    return apiClient.put(`/download/content-type/${id}`, payload);
  },

  deleteContentType(id) {
    return apiClient.delete(`/download/content-type/${id}`);
  },

  // ==========================================================
  // Upload / Share Content
  // ==========================================================

  getContents(params = {}) {
    return apiClient.get("/download/upload-share-content", {
      params,
    });
  },

  getContent(id) {
    return apiClient.get(`/download/upload-share-content/${id}`);
  },

  createContent(payload) {
    return apiClient.post("/download/upload-share-content", payload);
  },

  updateContent(id, payload) {
    return apiClient.put(`/download/upload-share-content/${id}`, payload);
  },

  deleteContent(id) {
    return apiClient.delete(`/download/upload-share-content/${id}`);
  },

  // ==========================================================
  // Content Share List
  // ==========================================================

  getShareLists(params = {}) {
    return apiClient.get("/download/content-share-list", {
      params,
    });
  },

  getShareList(id) {
    return apiClient.get(`/download/content-share-list/${id}`);
  },

  createShareList(payload) {
    return apiClient.post("/download/content-share-list", payload);
  },

  updateShareList(id, payload) {
    return apiClient.put(`/download/content-share-list/${id}`, payload);
  },

  deleteShareList(id) {
    return apiClient.delete(`/download/content-share-list/${id}`);
  },

  // ==========================================================
  // Helper to get classes (reuses academics service)
  // ==========================================================

  getClasses() {
    return academicsService.classes();
  },

  // ==========================================================
  // Video Tutorials
  // ==========================================================

  getVideoTutorials(params = {}) {
    return apiClient.get("/download/video-tutorial", {
      params,
    });
  },

  getVideoTutorial(id) {
    return apiClient.get(`/download/video-tutorial/${id}`);
  },

  createVideoTutorial(payload) {
    return apiClient.post("/download/video-tutorial", payload);
  },

  updateVideoTutorial(id, payload) {
    return apiClient.put(`/download/video-tutorial/${id}`, payload);
  },

  deleteVideoTutorial(id) {
    return apiClient.delete(`/download/video-tutorial/${id}`);
  },
};

export default downloadCenterService;