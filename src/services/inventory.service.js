import apiClient from "./api";

export const inventoryService = {
  // ==========================================================
  // Item Categories
  // ==========================================================

  getItemCategories(params = {}) {
    return apiClient.get("/inventory/item-category", { params });
  },

  getItemCategory(id) {
    return apiClient.get(`/inventory/item-category/${id}`);
  },

  createItemCategory(payload) {
    return apiClient.post("/inventory/item-category", payload);
  },

  updateItemCategory(id, payload) {
    return apiClient.put(`/inventory/item-category/${id}`, payload);
  },

  deleteItemCategory(id) {
    return apiClient.delete(`/inventory/item-category/${id}`);
  },

  // ==========================================================
  // Items
  // ==========================================================

  getItems(params = {}) {
    return apiClient.get("/inventory/item", { params });
  },

  getItem(id) {
    return apiClient.get(`/inventory/item/${id}`);
  },

  createItem(payload) {
    return apiClient.post("/inventory/item", payload);
  },

  updateItem(id, payload) {
    return apiClient.put(`/inventory/item/${id}`, payload);
  },

  deleteItem(id) {
    return apiClient.delete(`/inventory/item/${id}`);
  },

  // ==========================================================
  // Item Stores
  // ==========================================================

  getItemStores(params = {}) {
    return apiClient.get("/inventory/item-store", { params });
  },

  getItemStore(id) {
    return apiClient.get(`/inventory/item-store/${id}`);
  },

  createItemStore(payload) {
    return apiClient.post("/inventory/item-store", payload);
  },

  updateItemStore(id, payload) {
    return apiClient.put(`/inventory/item-store/${id}`, payload);
  },

  deleteItemStore(id) {
    return apiClient.delete(`/inventory/item-store/${id}`);
  },

  // ==========================================================
  // Item Suppliers
  // ==========================================================

  getItemSuppliers(params = {}) {
    return apiClient.get("/inventory/item-supplier", { params });
  },

  getItemSupplier(id) {
    return apiClient.get(`/inventory/item-supplier/${id}`);
  },

  createItemSupplier(payload) {
    return apiClient.post("/inventory/item-supplier", payload);
  },

  updateItemSupplier(id, payload) {
    return apiClient.put(`/inventory/item-supplier/${id}`, payload);
  },

  deleteItemSupplier(id) {
    return apiClient.delete(`/inventory/item-supplier/${id}`);
  },

  // ==========================================================
  // Item Stock
  // ==========================================================

  getItemStocks(params = {}) {
    return apiClient.get("/inventory/item-stock", { params });
  },

  getItemStock(id) {
    return apiClient.get(`/inventory/item-stock/${id}`);
  },

  createItemStock(payload) {
    return apiClient.post("/inventory/item-stock", payload);
  },

  updateItemStock(id, payload) {
    return apiClient.put(`/inventory/item-stock/${id}`, payload);
  },

  deleteItemStock(id) {
    return apiClient.delete(`/inventory/item-stock/${id}`);
  },

  // ==========================================================
  // Issue Item
  // ==========================================================

  getIssueItems(params = {}) {
    return apiClient.get("/inventory/issue-item", { params });
  },

  getIssueItem(id) {
    return apiClient.get(`/inventory/issue-item/${id}`);
  },

  createIssueItem(payload) {
    return apiClient.post("/inventory/issue-item", payload);
  },

  updateIssueItem(id, payload) {
    return apiClient.put(`/inventory/issue-item/${id}`, payload);
  },

  deleteIssueItem(id) {
    return apiClient.delete(`/inventory/issue-item/${id}`);
  },
};

export default inventoryService;