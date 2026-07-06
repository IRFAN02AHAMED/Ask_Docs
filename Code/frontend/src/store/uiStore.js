// uiStore.js stores global UI notification state.

// 1. Store snackbar state
// 2. Open snackbar with message
// 3. Close snackbar

import { create } from "zustand";

const useUIStore = create((set) => ({
  snackbar: { open: false, message: "", severity: "success" },

  openSnackbar: (message, severity = "success") => {
    set({ snackbar: { open: true, message, severity } });
  },

  closeSnackbar: () => {
    set((state) => ({
      snackbar: { ...state.snackbar, open: false },
    }));
  },
}));

export default useUIStore;
