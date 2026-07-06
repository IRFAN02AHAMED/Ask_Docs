// This file manages category-related frontend state.

// fetchCategories()  → fetch and store categories
// createCategory()   → create category
// updateCategory()   → update category
// deleteCategory()   → delete category


import { create } from "zustand";
import * as categoryService from "../services/categoryService";

const useCategoryStore = create((set) => ({
  categories: [],
  pagination: null,
  loading: false,
  error: null,

  fetchCategories: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { items, pagination } = await categoryService.getCategories(params);
      set({ categories: items, pagination, loading: false });
    } catch (err) {
      set({ loading: false, error: err.response?.data?.message || "Failed to fetch categories" });
    }
  },

  createCategory: async (data) => {
    const category = await categoryService.createCategory(data);
    return category;
  },

  updateCategory: async (id, data) => {
    const category = await categoryService.updateCategory(id, data);
    return category;
  },

  deleteCategory: async (id) => {
    await categoryService.deleteCategory(id);
  },
}));

export default useCategoryStore;
