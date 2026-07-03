import { create } from "zustand";
import * as dashboardService from "../services/dashboardService";

const useDashboardStore = create((set) => ({
  stats: null,
  loading: false,
  error: null,

  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const data = await dashboardService.getDashboard();
      set({ stats: data, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to fetch dashboard" });
    }
  },
}));

export default useDashboardStore;
