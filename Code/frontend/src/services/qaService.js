// createSession()      → create new Q&A chat/session
// getSessions()        → fetch Q&A sessions
// askQuestion()        → send user question to AI backend
// getSessionMessages() → fetch messages in one session
// getMessageById()     → fetch one Q&A message
// sendFeedback()       → save helpful/not helpful feedback
// validateMessage()    → admin approve/reject AI answer
// getHistory()         → fetch Q&A history
// getUnanswered()      → fetch unanswered queries
// getAILogs()          → fetch AI logs for admin
// deleteSession()      → delete a Q&A session

import apiClient from "./apiClient";

/**
 * POST /api/v1/qa/sessions
 * Body: { title? }
 * Returns: SessionOut
 */
export const createSession = async (data = {}) => {
  const response = await apiClient.post("/api/v1/qa/sessions", data);
  return response.data.data;
};

/**
 * GET /api/v1/qa/sessions
 * Query: page, page_size, search, sort_by, sort_order
 * Returns: { items: SessionListOut[], pagination }
 */
export const getSessions = async (params = {}) => {
  const response = await apiClient.get("/api/v1/qa/sessions", { params });
  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
};

/**
 * POST /api/v1/qa/ask
 * Body: { question, session_id?, category_id?, document_ids? }
 * Returns: QAMessageOut
 */
export const askQuestion = async (data) => {
  const response = await apiClient.post("/api/v1/qa/ask", data);
  return response.data.data;
};

/**
 * GET /api/v1/qa/sessions/{id}/messages
 * Query: page, page_size
 * Returns: { items: QAMessageOut[], pagination }
 */
export const getSessionMessages = async (sessionId, params = {}) => {
  const response = await apiClient.get(`/api/v1/qa/sessions/${sessionId}/messages`, { params });
  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
};

/**
 * GET /api/v1/qa/messages/{id}
 * Returns: QAMessageOut
 */
export const getMessageById = async (messageId) => {
  const response = await apiClient.get(`/api/v1/qa/messages/${messageId}`);
  return response.data.data;
};

/**
 * PATCH /api/v1/qa/messages/{id}/feedback
 * Body: { helpful: bool }
 * Returns: QAMessageOut
 */
export const sendFeedback = async (messageId, data) => {
  const response = await apiClient.patch(`/api/v1/qa/messages/${messageId}/feedback`, data);
  return response.data.data;
};

/**
 * PATCH /api/v1/qa/messages/{id}/validate
 * Body: { validation_status: "approved"|"rejected", validation_note? }
 * Returns: QAMessageOut
 */
export const validateMessage = async (messageId, data) => {
  const response = await apiClient.patch(`/api/v1/qa/messages/${messageId}/validate`, data);
  return response.data.data;
};

/**
 * GET /api/v1/qa/history
 * Query: page, page_size, search, helpful?, validation_status?, sort_by, sort_order
 * Returns: { items: QAMessageListOut[], pagination }
 */
export const getHistory = async (params = {}) => {
  const response = await apiClient.get("/api/v1/qa/history", { params });
  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
};

/**
 * GET /api/v1/qa/unanswered
 * Query: page, page_size, search, sort_by, sort_order
 * Returns: { items: QAMessageListOut[], pagination }
 */
export const getUnanswered = async (params = {}) => {
  const response = await apiClient.get("/api/v1/qa/unanswered", { params });
  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
};

/**
 * GET /api/v1/qa/ai-logs
 * Query: page, page_size, status?, sort_by, sort_order
 * Returns: { items: AILogOut[], pagination }
 */
export const getAILogs = async (params = {}) => {
  const response = await apiClient.get("/api/v1/qa/ai-logs", { params });
  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
};

/**
 * DELETE /api/v1/qa/sessions/{id}
 * Returns: success message
 */
export const deleteSession = async (sessionId) => {
  const response = await apiClient.delete(`/api/v1/qa/sessions/${sessionId}`);
  return response.data;
};
