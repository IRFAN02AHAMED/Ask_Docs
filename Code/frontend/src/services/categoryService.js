// 1. Fetch categories list
// 2. Create a new category
// 3. Update an existing category
// 4. Delete a category


import apiClient from "./apiClient";

/**
 * GET /api/v1/categories
 * Query: page, page_size, search, sort_by, sort_order
 * Returns: { items: CategoryOut[], pagination }
 */
export const getCategories = async (params = {}) => {
  const response = await apiClient.get("/api/v1/categories", { params });
  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
};

/**
 * POST /api/v1/categories
 * Body: { name, description? }
 * Returns: CategoryOut
 */
export const createCategory = async (data) => {
  const response = await apiClient.post("/api/v1/categories", data);
  return response.data.data;
};

/**
 * PATCH /api/v1/categories/{id}
 * Body: { name?, description?, is_active? }
 * Returns: CategoryOut
 */
export const updateCategory = async (id, data) => {
  const response = await apiClient.patch(`/api/v1/categories/${id}`, data);
  return response.data.data;
};

/**
 * DELETE /api/v1/categories/{id}
 * Returns: success message
 */
export const deleteCategory = async (id) => {
  const response = await apiClient.delete(`/api/v1/categories/${id}`);
  return response.data;
};
