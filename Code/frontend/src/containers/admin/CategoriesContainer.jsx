import React, { useEffect, useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import useCategoryStore from "../../store/categoryStore";
import useUIStore from "../../store/uiStore";
import DataTable from "../../components/tables/DataTable";
import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import AppButton from "../../components/common/AppButton";
import AppDialog from "../../components/common/AppDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import CategoryForm from "../../components/forms/CategoryForm";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDate } from "../../utils/helpers";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const CategoriesContainer = () => {
  const { categories, pagination, loading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoryStore();
  const { openSnackbar } = useUIStore();
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPage } = usePagination();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    const params = { page, page_size: pageSize, sort_by: "name", sort_order: "asc" };
    if (debouncedSearch) params.search = debouncedSearch;
    fetchCategories(params);
  }, [page, pageSize, debouncedSearch]);

  const openCreate = () => { setEditItem(null); setName(""); setDescription(""); setDialogOpen(true); };
  const openEdit = (cat) => { setEditItem(cat); setName(cat.name); setDescription(cat.description || ""); setDialogOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editItem) {
        await updateCategory(editItem.id, { name, description });
        openSnackbar("Category updated", "success");
      } else {
        await createCategory({ name, description });
        openSnackbar("Category created", "success");
      }
      setDialogOpen(false);
      fetchCategories({ page, page_size: pageSize });
    } catch (err) {
      openSnackbar(err.response?.data?.message || "Operation failed", "error");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
      openSnackbar("Category deleted", "success");
      setDeleteId(null);
      fetchCategories({ page, page_size: pageSize });
    } catch (err) {
      openSnackbar(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const columns = [
    { field: "name", headerName: "Name" },
    { field: "description", headerName: "Description", renderCell: (row) => row.description || "—" },
    { field: "created_at", headerName: "Created", renderCell: (row) => formatDate(row.created_at) },
    { field: "actions", headerName: "Actions", renderCell: (row) => (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" sx={{ color: "#DC2626" }} /></IconButton></Tooltip>
      </Box>
    )},
  ];

  return (
    <Box>
      <PageHeader title="Categories" subtitle="Manage document categories" action={<AppButton startIcon={<AddIcon />} onClick={openCreate}>Add Category</AppButton>} />
      <Box sx={{ mb: 3 }}>
        <SearchBar value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Search categories..." />
      </Box>
      <DataTable columns={columns} rows={categories} loading={loading} pagination={pagination} onPageChange={handlePageChange} onRowsPerPageChange={handlePageSizeChange} />
      <AppDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editItem ? "Edit Category" : "Create Category"}>
        <CategoryForm name={name} setName={setName} description={description} setDescription={setDescription} onSubmit={handleSubmit} loading={formLoading} isEdit={!!editItem} />
      </AppDialog>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Category" message="Are you sure?" confirmText="Delete" />
    </Box>
  );
};

export default CategoriesContainer;
