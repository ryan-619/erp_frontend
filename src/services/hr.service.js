import apiClient from "./api";

export const hrService = {
  // ==========================================================
  // Departments
  // ==========================================================

  getDepartments(params = {}) {
    return apiClient.get("/hr/department", { params });
  },

  getDepartment(id) {
    return apiClient.get(`/hr/department/${id}`);
  },

  createDepartment(payload) {
    return apiClient.post("/hr/department", payload);
  },

  updateDepartment(id, payload) {
    return apiClient.put(`/hr/department/${id}`, payload);
  },

  deleteDepartment(id) {
    return apiClient.delete(`/hr/department/${id}`);
  },

  // ==========================================================
  // Designations
  // ==========================================================

  getDesignations(params = {}) {
    return apiClient.get("/hr/designation", { params });
  },

  getDesignation(id) {
    return apiClient.get(`/hr/designation/${id}`);
  },

  createDesignation(payload) {
    return apiClient.post("/hr/designation", payload);
  },

  updateDesignation(id, payload) {
    return apiClient.put(`/hr/designation/${id}`, payload);
  },

  deleteDesignation(id) {
    return apiClient.delete(`/hr/designation/${id}`);
  },

  // ==========================================================
  // Staff Directory
  // ==========================================================

  getStaff(params = {}) {
    return apiClient.get("/hr/staff-directory", { params });
  },

  getStaffMember(id) {
    return apiClient.get(`/hr/staff-directory/${id}`);
  },

  createStaff(payload) {
    const formData = new FormData();
    
    // Add all text fields
    if (payload.employee_id) formData.append('employee_id', payload.employee_id);
    if (payload.name) formData.append('name', payload.name);
    if (payload.email) formData.append('email', payload.email);
    if (payload.phone) formData.append('phone', payload.phone);
    if (payload.department_id) formData.append('department_id', payload.department_id);
    if (payload.designation_id) formData.append('designation_id', payload.designation_id);
    if (payload.joining_date) formData.append('joining_date', payload.joining_date);
    if (payload.salary) formData.append('salary', payload.salary);
    if (payload.role) formData.append('role', payload.role);
    if (payload.status) formData.append('status', payload.status);
    
    // Add file fields
    if (payload.staff_photo) formData.append('staff_photo', payload.staff_photo);
    if (payload.documents && Array.isArray(payload.documents)) {
      payload.documents.forEach((doc) => {
        formData.append('documents', doc);
      });
    }
    
    return apiClient.post("/hr/staff-directory", formData);
  },

  updateStaff(id, payload) {
    return apiClient.put(`/hr/staff-directory/${id}`, payload);
  },

  deleteStaff(id) {
    return apiClient.delete(`/hr/staff-directory/${id}`);
  },

  // ==========================================================
  // Staff Attendance
  // ==========================================================

  getAttendance(params = {}) {
    return apiClient.get("/hr/staff-attendance", { params });
  },

  getAttendanceById(id) {
    return apiClient.get(`/hr/staff-attendance/${id}`);
  },

  createAttendance(payload) {
    return apiClient.post("/hr/staff-attendance", payload);
  },

  updateAttendance(id, payload) {
    return apiClient.put(`/hr/staff-attendance/${id}`, payload);
  },

  deleteAttendance(id) {
    return apiClient.delete(`/hr/staff-attendance/${id}`);
  },

  // ==========================================================
  // Apply Leave (Staff Leave Applications)
  // ==========================================================

  getApplyLeaves(params = {}) {
    return apiClient.get("/hr/apply-leave", { params });
  },

  getApplyLeave(id) {
    return apiClient.get(`/hr/apply-leave/${id}`);
  },

  createApplyLeave(payload) {
    // Ensure status is set to pending by default
    return apiClient.post("/hr/apply-leave", {
      ...payload,
      status: 'pending'
    });
  },

  updateApplyLeave(id, payload) {
    return apiClient.put(`/hr/apply-leave/${id}`, payload);
  },

  deleteApplyLeave(id) {
    return apiClient.delete(`/hr/apply-leave/${id}`);
  },

  // ==========================================================
  // Approve Leave Request
  // ==========================================================

  getApprovedLeaves(params = {}) {
    return apiClient.get("/hr/approve-leave-request", { params });
  },

  getApprovedLeave(id) {
    return apiClient.get(`/hr/approve-leave-request/${id}`);
  },

  approveLeaveRequest(payload) {
    return apiClient.post("/hr/approve-leave-request", payload);
  },

  updateApprovedLeave(id, payload) {
    return apiClient.put(`/hr/approve-leave-request/${id}`, payload);
  },

  deleteApprovedLeave(id) {
    return apiClient.delete(`/hr/approve-leave-request/${id}`);
  },

  // ==========================================================
  // Leave Types
  // ==========================================================

  getLeaveTypes(params = {}) {
    return apiClient.get("/hr/leave-type", { params });
  },

  getLeaveType(id) {
    return apiClient.get(`/hr/leave-type/${id}`);
  },

  createLeaveType(payload) {
    return apiClient.post("/hr/leave-type", payload);
  },

  updateLeaveType(id, payload) {
    return apiClient.put(`/hr/leave-type/${id}`, payload);
  },

  deleteLeaveType(id) {
    return apiClient.delete(`/hr/leave-type/${id}`);
  },

  // ==========================================================
  // Payroll
  // ==========================================================

  getPayrolls(params = {}) {
    return apiClient.get("/hr/payroll", { params });
  },

  getPayroll(id) {
    return apiClient.get(`/hr/payroll/${id}`);
  },

  createPayroll(payload) {
    return apiClient.post("/hr/payroll", payload);
  },

  updatePayroll(id, payload) {
    return apiClient.put(`/hr/payroll/${id}`, payload);
  },

  deletePayroll(id) {
    return apiClient.delete(`/hr/payroll/${id}`);
  },

  // ==========================================================
  // Disabled Staff
  // ==========================================================

  getDisabledStaff(params = {}) {
    return apiClient.get("/hr/disabled-staff", { params });
  },

  getDisabledStaffMember(id) {
    return apiClient.get(`/hr/disabled-staff/${id}`);
  },

  createDisabledStaff(payload) {
    return apiClient.post("/hr/disabled-staff", payload);
  },

  updateDisabledStaff(id, payload) {
    return apiClient.put(`/hr/disabled-staff/${id}`, payload);
  },

  deleteDisabledStaff(id) {
    return apiClient.delete(`/hr/disabled-staff/${id}`);
  },

  // ==========================================================
  // Teachers Rating
  // ==========================================================

  getTeacherRatings(params = {}) {
    return apiClient.get("/hr/teachers-rating", { params });
  },

  getTeacherRating(id) {
    return apiClient.get(`/hr/teachers-rating/${id}`);
  },

  createTeacherRating(payload) {
    return apiClient.post("/hr/teachers-rating", payload);
  },

  updateTeacherRating(id, payload) {
    return apiClient.put(`/hr/teachers-rating/${id}`, payload);
  },

  deleteTeacherRating(id) {
    return apiClient.delete(`/hr/teachers-rating/${id}`);
  },
};

export default hrService;