import React, { useEffect, useState } from "react";
import { Box, IconButton, Tooltip, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/userStore";
import useUIStore from "../../store/uiStore";
import DataTable from "../../components/tables/DataTable";
import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import AppButton from "../../components/common/AppButton";
import AppDialog from "../../components/common/AppDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import UserForm from "../../components/forms/UserForm";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDate, capitalize } from "../../utils/helpers";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ROUTES from "../../routes/routePaths";

const UsersContainer = () => {
  const { users, pagination, loading, fetchUsers, updateUser, deleteUser } = useUserStore();
  const { openSnackbar } = useUIStore();
  const navigate = useNavigate();
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPage } = usePagination();

  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    const params = { page, page_size: pageSize, sort_by: "created_at", sort_order: "desc" };
    if (debouncedSearch) params.search = debouncedSearch;
    fetchUsers(params);
  }, [page, pageSize, debouncedSearch]);

  const openEdit = (user) => { setEditItem(user); setEditName(user.name); setEditIsActive(user.is_active); };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await updateUser(editItem.id, { name: editName, is_active: editIsActive });
      openSnackbar("User updated", "success");
      setEditItem(null);
      fetchUsers({ page, page_size: pageSize });
    } catch (err) {
      openSnackbar(err.response?.data?.message || "Update failed", "error");
    }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUser(deleteId);
      openSnackbar("User deactivated", "success");
      setDeleteId(null);
      fetchUsers({ page, page_size: pageSize });
    } catch (err) {
      openSnackbar(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const columns = [
    { field: "name", headerName: "Name" },
    { field: "email", headerName: "Email" },
    { field: "role", headerName: "Role", renderCell: (row) => (
      <Chip label={capitalize(row.role?.name || "—")} size="small" sx={{ backgroundColor: row.role?.name === "admin" ? "#F0FDF4" : "#F3F4F6", color: row.role?.name === "admin" ? "#166534" : "#374151", fontWeight: 600, fontSize: "0.7rem" }} />
    )},
    { field: "is_active", headerName: "Status", renderCell: (row) => (
      <Chip label={row.is_active ? "Active" : "Inactive"} size="small" sx={{ backgroundColor: row.is_active ? "#F0FDF4" : "#FEE2E2", color: row.is_active ? "#166534" : "#991B1B", fontWeight: 600, fontSize: "0.7rem" }} />
    )},
    { field: "created_at", headerName: "Joined", renderCell: (row) => formatDate(row.created_at) },
    { field: "actions", headerName: "Actions", renderCell: (row) => (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Deactivate"><IconButton size="small" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" sx={{ color: "#DC2626" }} /></IconButton></Tooltip>
      </Box>
    )},
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage user accounts"
      />
      <Box sx={{ mb: 3 }}>
        <SearchBar value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Search users..." />
      </Box>
      <DataTable columns={columns} rows={users} loading={loading} pagination={pagination} onPageChange={handlePageChange} onRowsPerPageChange={handlePageSizeChange} />
      <AppDialog open={!!editItem} onClose={() => setEditItem(null)} title="Edit User">
        <UserForm name={editName} setName={setEditName} isActive={editIsActive} setIsActive={setEditIsActive} onSubmit={handleUpdate} loading={formLoading} />
      </AppDialog>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Deactivate User" message="This will deactivate the user account." confirmText="Deactivate" />
    </Box>
  );
};

export default UsersContainer;
