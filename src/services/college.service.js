import apiClient from "./api";




console.log("College Service Loaded");


export const collegeService = {
  list(params = {}) {
    return apiClient.get("/college/colleges", { params });
  },

  get(id) {
    return apiClient.get(`/college/colleges/${id}`);
  },

  getByCode(code) {
    return apiClient.get(`/college/colleges/code/${code}`);
  },

  create(payload) {
  console.log("Calling:", "/college/colleges");
  return apiClient.post("/college/colleges", payload);
},

  update(id, payload) {
    return apiClient.put(`/college/colleges/${id}`, payload);
  },

  remove(id) {
    return apiClient.delete(`/college/colleges/${id}`);
  },
};

export default collegeService;