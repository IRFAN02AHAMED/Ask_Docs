import { create } from "zustand";
import * as userService from "../services/userService";

const useUserStore = create((set) => ({
  users: [],
  pagination: null,
  loading: false,
  error: null,

  fetchUsers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { items, pagination } = await userService.getUsers(params);
      set({ users: items, pagination, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to fetch users" });
    }
  },

  updateUser: async (id, data) => {
    const user = await userService.updateUser(id, data);
    return user;
  },

  deleteUser: async (id) => {
    await userService.deleteUser(id);
  },
}));

export default useUserStore;
