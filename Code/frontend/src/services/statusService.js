import apiClient from "./apiClient";

/**
 * GET /api/v1/statuses
 * Returns: DocumentStatusOut[] (flat array, NOT paginated)
 */
export const getStatuses = async () => {
  const response = await apiClient.get("/api/v1/statuses");
  return response.data.data;
};
