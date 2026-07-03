import React, { useEffect, useState } from "react";
import { Box, MenuItem, TextField, IconButton, Tooltip } from "@mui/material";
import useDocumentStore from "../../store/documentStore";
import useCategoryStore from "../../store/categoryStore";
import useUIStore from "../../store/uiStore";
import DataTable from "../../components/tables/DataTable";
import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import StatusChip from "../../components/common/StatusChip";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDate } from "../../utils/helpers";
import { getStatuses } from "../../services/statusService";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PublishIcon from "@mui/icons-material/Publish";
import DeleteIcon from "@mui/icons-material/Delete";

const DocumentsContainer = () => {
  const { documents, pagination, loading, fetchDocuments, processDocument, publishDocument, deleteDocument } = useDocumentStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { openSnackbar } = useUIStore();
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPage } = usePagination();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    fetchCategories({ page_size: 100 });
    getStatuses().then(setStatuses).catch(() => {});
  }, []);

  useEffect(() => {
    const params = { page, page_size: pageSize, sort_by: "created_at", sort_order: "desc" };
    if (debouncedSearch) params.search = debouncedSearch;
    if (categoryFilter) params.category_id = categoryFilter;
    if (statusFilter) params.status_id = statusFilter;
    fetchDocuments(params);
  }, [page, pageSize, debouncedSearch, categoryFilter, statusFilter]);

  const handleProcess = async (id) => {
    setActionLoading(true);
    try {
      await processDocument(id);
      openSnackbar("Document processing started", "success");
      fetchDocuments({ page, page_size: pageSize });
    } catch (err) {
      openSnackbar(err.response?.data?.message || "Process failed", "error");
    }
    setActionLoading(false);
  };

  const handlePublish = async (id) => {
    setActionLoading(true);
    try {
      await publishDocument(id);
      openSnackbar("Document published", "success");
      fetchDocuments({ page, page_size: pageSize });
    } catch (err) {
      openSnackbar(err.response?.data?.message || "Publish failed", "error");
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await deleteDocument(deleteId);
      openSnackbar("Document deleted", "success");
      setDeleteId(null);
      fetchDocuments({ page, page_size: pageSize });
    } catch (err) {
      openSnackbar(err.response?.data?.message || "Delete failed", "error");
    }
    setActionLoading(false);
  };

  const columns = [
    { field: "title", headerName: "Title", minWidth: 200 },
    { field: "category", headerName: "Category", renderCell: (row) => row.category?.name || "—" },
    { field: "status", headerName: "Status", renderCell: (row) => <StatusChip status={row.status?.status_name} /> },
    { field: "created_at", headerName: "Created", renderCell: (row) => formatDate(row.created_at) },
    {
      field: "actions", headerName: "Actions", renderCell: (row) => (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="Process"><IconButton size="small" onClick={() => handleProcess(row.id)} disabled={actionLoading}><PlayArrowIcon fontSize="small" sx={{ color: "#0058BE" }} /></IconButton></Tooltip>
          <Tooltip title="Publish"><IconButton size="small" onClick={() => handlePublish(row.id)} disabled={actionLoading}><PublishIcon fontSize="small" sx={{ color: "#16A34A" }} /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" sx={{ color: "#DC2626" }} /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader title="Documents" subtitle="Manage all documents in the knowledge base" />
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Search documents..." />
        <TextField select size="small" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); resetPage(); }} sx={{ minWidth: 160 }} label="Category">
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField select size="small" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }} sx={{ minWidth: 140 }} label="Status">
          <MenuItem value="">All Statuses</MenuItem>
          {statuses.map((s) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
        </TextField>
      </Box>
      <DataTable columns={columns} rows={documents} loading={loading} pagination={pagination} onPageChange={handlePageChange} onRowsPerPageChange={handlePageSizeChange} />
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Document" message="Are you sure you want to delete this document?" confirmText="Delete" loading={actionLoading} />
    </Box>
  );
};

export default DocumentsContainer;
