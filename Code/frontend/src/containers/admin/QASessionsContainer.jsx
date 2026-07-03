import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import useQAStore from "../../store/qaStore";
import useUIStore from "../../store/uiStore";
import DataTable from "../../components/tables/DataTable";
import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import AppDialog from "../../components/common/AppDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import AppLoader from "../../components/common/AppLoader";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDate, truncateText } from "../../utils/helpers";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";

const QASessionsContainer = () => {
  const { sessions, sessionPagination, messages, loading, fetchSessions, fetchSessionMessages, deleteSession, clearMessages } = useQAStore();
  const { openSnackbar } = useUIStore();
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPage } = usePagination();

  const [search, setSearch] = useState("");
  const [viewSession, setViewSession] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    const params = { page, page_size: pageSize, sort_by: "created_at", sort_order: "desc" };
    if (debouncedSearch) params.search = debouncedSearch;
    fetchSessions(params);
  }, [page, pageSize, debouncedSearch]);

  const handleViewMessages = async (session) => {
    setViewSession(session);
    await fetchSessionMessages(session.id, { page: 1, page_size: 50 });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSession(deleteId);
      openSnackbar("Session deleted", "success");
      setDeleteId(null);
      fetchSessions({ page, page_size: pageSize });
    } catch (err) {
      openSnackbar(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const columns = [
    { field: "title", headerName: "Session Title", minWidth: 200 },
    { field: "created_at", headerName: "Created", renderCell: (row) => formatDate(row.created_at) },
    { field: "actions", headerName: "Actions", renderCell: (row) => (
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <Tooltip title="View Messages"><IconButton size="small" onClick={() => handleViewMessages(row)}><VisibilityIcon fontSize="small" sx={{ color: "#16A34A" }} /></IconButton></Tooltip>
        <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteId(row.id)}><DeleteIcon fontSize="small" sx={{ color: "#DC2626" }} /></IconButton></Tooltip>
      </Box>
    )},
  ];

  return (
    <Box>
      <PageHeader title="Q&A Sessions" subtitle="All user Q&A sessions" />
      <Box sx={{ mb: 3 }}>
        <SearchBar value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Search sessions..." />
      </Box>
      <DataTable columns={columns} rows={sessions} loading={loading} pagination={sessionPagination} onPageChange={handlePageChange} onRowsPerPageChange={handlePageSizeChange} />

      {/* Messages Dialog */}
      <AppDialog open={!!viewSession} onClose={() => { setViewSession(null); clearMessages(); }} title={`Session: ${viewSession?.title || ""}`} maxWidth="md">
        {loading ? <AppLoader /> : (
          <Box sx={{ maxHeight: 400, overflow: "auto" }}>
            {messages.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>No messages in this session</Typography>
            ) : messages.map((msg) => (
              <Box key={msg.id} sx={{ mb: 2, p: 2, borderRadius: "8px", border: "1px solid #E5E7EB" }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827", mb: 0.5 }}>Q: {msg.question}</Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#374151" }}>A: {truncateText(msg.answer, 300)}</Typography>
                <Typography variant="caption" sx={{ color: "#9CA3AF", mt: 1, display: "block" }}>{formatDate(msg.created_at)}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </AppDialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Session" message="This will delete the session and all its messages." confirmText="Delete" />
    </Box>
  );
};

export default QASessionsContainer;
