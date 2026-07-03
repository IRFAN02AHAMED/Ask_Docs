import { create } from "zustand";
import * as documentService from "../services/documentService";

const useDocumentStore = create((set) => ({
  documents: [],
  pagination: null,
  selectedDocument: null,
  loading: false,
  error: null,

  fetchDocuments: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { items, pagination } = await documentService.getDocuments(params);
      set({ documents: items, pagination, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to fetch documents" });
    }
  },

  fetchDocumentById: async (id) => {
    set({ loading: true, error: null });
    try {
      const doc = await documentService.getDocumentById(id);
      set({ selectedDocument: doc, loading: false });
      return doc;
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to fetch document" });
      throw err;
    }
  },

  uploadDocument: async (formData) => {
    const doc = await documentService.uploadDocument(formData);
    return doc;
  },

  processDocument: async (id) => {
    const result = await documentService.processDocument(id);
    return result;
  },

  publishDocument: async (id) => {
    const doc = await documentService.publishDocument(id);
    return doc;
  },

  deleteDocument: async (id) => {
    await documentService.deleteDocument(id);
  },

  uploadNewVersion: async (documentId, formData) => {
    const version = await documentService.uploadDocumentVersion(documentId, formData);
    return version;
  },

  updateQAStatus: async (id, qaStatus, question = null, answer = null, sources = null) => {
    const doc = await documentService.updateQAStatus(id, qaStatus, question, answer, sources);
    set({ selectedDocument: doc });
    return doc;
  },

  clearSelected: () => set({ selectedDocument: null }),
}));

export default useDocumentStore;
