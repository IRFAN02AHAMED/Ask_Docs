import { create } from "zustand";
import * as authService from "../services/authService";
import {
  getAccessToken, setAccessToken, removeAccessToken,
  getRefreshToken, setRefreshToken, removeRefreshToken,
  getStoredUser, setStoredUser, clearAllTokens,
} from "../utils/tokenUtils";

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
      });
      return data;
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.detail || "Login failed";
      set({ loading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    clearAllTokens();
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  fetchMe: async () => {
    try {
      const data = await authService.getMe();
      // data is UserOut: { id, name, email, is_active, role: { id, name, ... }, created_at }
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
      // If fetching profile fails, don't logout — token might still be valid
      console.error("Failed to fetch user profile:", err);
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
