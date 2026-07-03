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
