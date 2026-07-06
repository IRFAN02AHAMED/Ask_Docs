/**
 * Zustand authentication store for the Ask Docs AI frontend.
 * It manages logged-in user details, access token, refresh token,
 * login state, logout, and fetching current user profile.
 *
*/

// This file manages complete login/logout state for your app.

import { create } from "zustand";
import * as authService from "../services/authService";
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getStoredUser,
  setStoredUser,
  clearAllTokens,
} from "../utils/tokenUtils";

const QA_SESSION_KEY = "active_qa_session_id";
const LAST_SELECTED_DOCUMENT_KEY = "last_selected_document_id";

const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: getAccessToken(),
  refreshToken: getRefreshToken(),
  isAuthenticated: !!getAccessToken(),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });

    try {
      const data = await authService.login(credentials);

      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setStoredUser(data.user);

      set({
        user: data.user,
        token: data.access_token,
        refreshToken: data.refresh_token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Login failed";

      set({
        loading: false,
        error: message,
      });

      throw err;
    }
  },

  logout: () => {
    clearAllTokens();

    // Clear active QA session when user logs out.
    // This makes the next login create a fresh QA session.
    localStorage.removeItem(QA_SESSION_KEY);

    // Optional: clear last selected document also.
    // Keep this line if you want user to select document again after login.
    localStorage.removeItem(LAST_SELECTED_DOCUMENT_KEY);

    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    });
  },

  fetchMe: async () => {
    try {
      const data = await authService.getMe();

      // data is UserOut:
      // { id, name, email, is_active, role: { id, name, ... }, created_at }
      const user = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role?.name || "viewer",
      };

      setStoredUser(user);
      set({ user });

      return data;
    } catch (err) {
      // If fetching profile fails, don't logout automatically.
      // Token may still be valid, or the issue may be temporary.
      console.error("Failed to fetch user profile:", err);
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;