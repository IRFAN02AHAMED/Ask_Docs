
// 1. Upload a new document
// 2. Fetch documents list
// 3. Fetch one document by id
// 4. Update document details
// 5. Process/index a document
// 6. Publish a document
// 7. Fetch document versions
// 8. Upload a new document version
// 9. Fetch document chunks
// 10. Fetch document processing logs
// 11. Delete a document
// 12. Update QA status for a document


import apiClient from "./apiClient";

/**
 * POST /api/v1/documents
 * Body: FormData (title, category_id, tags?, text_content?, file?)
 * Returns: DocumentOut
 */
export const uploadDocument = async (formData) => {
  const response = await apiClient.post("/api/v1/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

/**
 * GET /api/v1/documents
 * Query: page, page_size, search, category_id, status_id, sort_by, sort_order
 * Returns: { items: DocumentListOut[], pagination }
 */
export const getDocuments = async (params = {}) => {
  const response = await apiClient.get("/api/v1/documents", { params });
  return {
    items: response.data.data.items,
    pagination: response.data.data.pagination,
  };
};

/**
 * GET /api/v1/documents/{id}
 * Returns: DocumentOut
 */
export const getDocumentById = async (id) => {
  const response = await apiClient.get(`/api/v1/documents/${id}`);
  return response.data.data;
};

/**
 * PATCH /api/v1/documents/{id}
 * Body: { title?, category_id?, tags?, is_active? }
 * Returns: DocumentOut
 */
export const updateDocument = async (id, data) => {
  const response = await apiClient.patch(`/api/v1/documents/${id}`, data);
  return response.data.data;
};

/**
 * POST /api/v1/documents/{id}/process
 * No body
 * Returns: processing result
 */
export const processDocument = async (id) => {
  const response = await apiClient.post(`/api/v1/documents/${id}/process`);
  return response.data.data;
};

/**
 * PATCH /api/v1/documents/{id}/publish
 * No body
 * Returns: DocumentOut
 */
export const publishDocument = async (id) => {
  const response = await apiClient.patch(`/api/v1/documents/${id}/publish`);
  return response.data.data;
};

/**
 * GET /api/v1/documents/{id}/versions
 * Returns: DocumentVersionOut[] (flat array)
 */
export const getDocumentVersions = async (id) => {
  const response = await apiClient.get(`/api/v1/documents/${id}/versions`);
  return response.data.data;
};

/**
 * POST /api/v1/documents/{id}/versions
 * Body: FormData (title?, version_label?, change_note?, text_content?, file?)
 * Returns: DocumentVersionOut
 */
export const uploadDocumentVersion = async (id, formData) => {
  const response = await apiClient.post(`/api/v1/documents/${id}/versions`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data;
};

/**
 * GET /api/v1/documents/{id}/chunks
 * Returns: ChunkOut[]
 */
export const getDocumentChunks = async (id) => {
  const response = await apiClient.get(`/api/v1/documents/${id}/chunks`);
  return response.data.data;
};

/**
 * GET /api/v1/documents/{id}/processing-logs
 * Returns: ProcessingLogOut[]
 */
export const getProcessingLogs = async (id) => {
  const response = await apiClient.get(`/api/v1/documents/${id}/processing-logs`);
  return response.data.data;
};

/**
 * DELETE /api/v1/documents/{id}
 * Returns: success message
 */
export const deleteDocument = async (id) => {
  const response = await apiClient.delete(`/api/v1/documents/${id}`);
  return response.data;
};

/**
 * PATCH /api/v1/documents/{id}/qa-status
 * Body: { status: 'looks_good' | 'needs_fix' }
 * Returns: DocumentOut
 */
export const updateQAStatus = async (id, qaStatus, question = null, answer = null, sources = null) => {
  const response = await apiClient.patch(`/api/v1/documents/${id}/qa-status`, {
    status: qaStatus,
    question,
    answer,
    sources,
  });
  return response.data.data;
};
