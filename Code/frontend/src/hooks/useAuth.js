// authStore = actual global storage for login data
// useAuth = easy shortcut hook to use authStore data/actions in components

import useAuthStore from "../store/authStore";

/**
 * Convenience hook for auth state
 */
const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const clearError = useAuthStore((state) => state.clearError);

  const isAdmin = user?.role === "admin";
  const isEditor = user?.role === "editor";
  const isViewer = user?.role === "viewer";

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    fetchMe,
    clearError,
    isAdmin,
    isEditor,
    isViewer,
  };
};

export default useAuth;
