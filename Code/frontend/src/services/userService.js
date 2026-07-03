import apiClient from "./apiClient";

/**
 * GET /api/v1/users
 * Query: page, page_size, search, sort_by, sort_order
 * Returns: { items: UserListOut[], pagination }
 */
export const getUsers = async (params = {}) => {
  const response = await apiClient.get("/api/v1/users", { params });
  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
};

/**
 * GET /api/v1/users/{id}
 * Returns: UserOut
 */
export const getUserById = async (id) => {
  const response = await apiClient.get(`/api/v1/users/${id}`);
  return response.data.data;
};

/**
 * PATCH /api/v1/users/{id}
 * Body: { name?, is_active? }
 * Returns: UserOut
 */
export const updateUser = async (id, data) => {
  const response = await apiClient.patch(`/api/v1/users/${id}`, data);
  return response.data.data;
};

/**
 * DELETE /api/v1/users/{id}
 * Returns: success message
 */
export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/api/v1/users/${id}`);
  return response.data;
};

/**
 * GET /api/v1/users/roles
 * Returns: [{ id, name }]
 */
export const getRoles = async () => {
  const response = await apiClient.get("/api/v1/users/roles");
  return response.data.data;
};
