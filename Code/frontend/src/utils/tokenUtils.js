// Token storage utilities using localStorage
// Storing and reading login tokens/user data from localStorage

// Save access token
// Read access token
// Remove access token
// Save refresh token
// Read refresh token
// Remove refresh token
// Save logged-in user data
// Read logged-in user data
// Remove logged-in user data
// Clear all auth data during logout

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "ask_docs_user";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const setAccessToken = (token) => localStorage.setItem(ACCESS_TOKEN_KEY, token);
export const removeAccessToken = () => localStorage.removeItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const removeRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY);

export const getStoredUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeStoredUser = () => localStorage.removeItem(USER_KEY);

export const clearAllTokens = () => {
  removeAccessToken();
  removeRefreshToken();
  removeStoredUser();
};
