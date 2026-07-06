// qaStore.js stores Q&A-related frontend state temporarily.

// createSession()        → create Q&A session
// fetchSessions()        → fetch Q&A sessions
// askQuestion()          → ask AI question
// fetchSessionMessages() → fetch messages in one session
// sendFeedback()         → save helpful/not helpful
// validateMessage()      → admin approve/reject answer
// fetchHistory()         → fetch Q&A history
// fetchUnanswered()      → fetch unanswered questions
// deleteSession()        → delete session
// clearMessages()        → clear messages from frontend memory
// clearAnswer()          → clear latest answer from frontend memory

import { create } from "zustand";
import * as qaService from "../services/qaService";

const useQAStore = create((set) => ({
  sessions: [],
  sessionPagination: null,
  messages: [],
  messagePagination: null,
  currentAnswer: null,
  loading: false,
  askLoading: false,
  error: null,

  createSession: async (data = {}) => {
    const session = await qaService.createSession(data);
    return session;
  },

  fetchSessions: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { items, pagination } = await qaService.getSessions(params);
      set({ sessions: items, sessionPagination: pagination, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to fetch sessions" });
    }
  },

  askQuestion: async (data) => {
    set({ askLoading: true, error: null });
    try {
      const message = await qaService.askQuestion(data);
      set({ currentAnswer: message, askLoading: false });
      return message;
    } catch (err) {
      set({ askLoading: false, error: err.response?.data?.message || "Failed to get answer" });
      throw err;
    }
  },

  fetchSessionMessages: async (sessionId, params = {}) => {
    set({ loading: true, error: null });
    try {
      const { items, pagination } = await qaService.getSessionMessages(sessionId, params);
      set({ messages: items, messagePagination: pagination, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to fetch messages" });
    }
  },

  sendFeedback: async (messageId, data) => {
    const message = await qaService.sendFeedback(messageId, data);
    return message;
  },

  validateMessage: async (messageId, data) => {
    const message = await qaService.validateMessage(messageId, data);
    return message;
  },

  fetchHistory: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { items, pagination } = await qaService.getHistory(params);
      set({ messages: items, messagePagination: pagination, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to fetch history" });
    }
  },

  fetchUnanswered: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { items, pagination } = await qaService.getUnanswered(params);
      set({ messages: items, messagePagination: pagination, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to fetch unanswered" });
    }
  },

  deleteSession: async (sessionId) => {
    await qaService.deleteSession(sessionId);
  },

  clearMessages: () => set({ messages: [], messagePagination: null }),
  clearAnswer: () => set({ currentAnswer: null }),
}));

export default useQAStore;
