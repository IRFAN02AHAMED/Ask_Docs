import apiClient from "./apiClient";

/**
 * GET /api/v1/dashboard
 * Returns: { total_documents, total_questions, helpful_answers, unanswered_sessions, total_chunks, total_users }
 */
export const getDashboard = async () => {
  const response = await apiClient.get("/api/v1/dashboard");
  return response.data.data;
};
