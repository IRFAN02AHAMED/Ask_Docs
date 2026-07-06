// 1. Send login request
// 2. Send refresh token request
// 3. Send register request
// 4. Fetch current logged-in user details


import apiClient from "./apiClient";

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Returns: { access_token, refresh_token, token_type, user: { id, name, email, role } }
 */
export const login = async (data) => {
  const response = await apiClient.post("/api/v1/auth/login", data);
  return response.data.data;
};

/**
 * POST /api/v1/auth/refresh
 * Body: { refresh_token }
 * Returns: { access_token, token_type }
 */
export const refresh = async (data) => {
  const response = await apiClient.post("/api/v1/auth/refresh", data);
  return response.data.data;
};

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password, role_id }
 * Returns: UserOut
 */
export const register = async (data) => {
  const response = await apiClient.post("/api/v1/auth/register", data);
  return response.data.data;
};

/**
 * GET /api/v1/auth/me
 * Returns: UserOut { id, name, email, is_active, role: RoleOut, created_at }
 */
export const getMe = async () => {
  const response = await apiClient.get("/api/v1/auth/me");
  return response.data.data;
};
