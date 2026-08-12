import apiClient from "./api";

export const libraryService = {
  // ==========================================================
  // Book List
  // ==========================================================

  getBookList(params = {}) {
    return apiClient.get("/library/book-list", {
      params,
    });
  },

  getBookById(id) {
    return apiClient.get(`/library/book-list/${id}`);
  },

  createBook(payload) {
    return apiClient.post("/library/book-list", payload);
  },

  updateBook(id, payload) {
    return apiClient.put(`/library/book-list/${id}`, payload);
  },

  deleteBook(id) {
    return apiClient.delete(`/library/book-list/${id}`);
  },

  // ==========================================================
  // Issue Return
  // ==========================================================

  getIssueReturns(params = {}) {
    return apiClient.get("/library/issue-return", {
      params,
    });
  },

  getIssueReturnById(id) {
    return apiClient.get(`/library/issue-return/${id}`);
  },

  createIssueReturn(payload) {
    return apiClient.post("/library/issue-return", payload);
  },

  updateIssueReturn(id, payload) {
    return apiClient.put(`/library/issue-return/${id}`, payload);
  },

  deleteIssueReturn(id) {
    return apiClient.delete(`/library/issue-return/${id}`);
  },

  // ==========================================================
  // Library Staff Members
  // ==========================================================

  getLibraryStaffMembers(params = {}) {
    return apiClient.get("/library/staff-member", {
      params,
    });
  },

  getLibraryStaffMemberById(id) {
    return apiClient.get(`/library/staff-member/${id}`);
  },

  createLibraryStaffMember(payload) {
    return apiClient.post("/library/staff-member", payload);
  },

  updateLibraryStaffMember(id, payload) {
    return apiClient.put(`/library/staff-member/${id}`, payload);
  },

  deleteLibraryStaffMember(id) {
    return apiClient.delete(`/library/staff-member/${id}`);
  },

  // ==========================================================
  // Library Students
  // ==========================================================

  getLibraryStudents(params = {}) {
    return apiClient.get("/library/student", {
      params,
    });
  },

  getLibraryStudentById(id) {
    return apiClient.get(`/library/student/${id}`);
  },

  createLibraryStudent(payload) {
    return apiClient.post("/library/student", payload);
  },

  updateLibraryStudent(id, payload) {
    return apiClient.put(`/library/student/${id}`, payload);
  },

  deleteLibraryStudent(id) {
    return apiClient.delete(`/library/student/${id}`);
  },
};

export default libraryService;