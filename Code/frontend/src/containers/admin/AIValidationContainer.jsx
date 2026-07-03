import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Tooltip, Chip, TextField, Tabs, Tab } from "@mui/material";
import useQAStore from "../../store/qaStore";
import useUIStore from "../../store/uiStore";
import DataTable from "../../components/tables/DataTable";
import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import AppDialog from "../../components/common/AppDialog";
import AppButton from "../../components/common/AppButton";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDate, truncateText } from "../../utils/helpers";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { getAILogs } from "../../services/qaService";

const AIValidationContainer = () => {
  const { messages, messagePagination, loading, fetchUnanswered, fetchHistory, validateMessage } = useQAStore();
  const { openSnackbar } = useUIStore();
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPage } = usePagination();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [viewMsg, setViewMsg] = useState(null);
  const [validationNote, setValidationNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [aiLogs, setAILogs] = useState([]);
  const [aiLogsPagination, setAILogsPagination] = useState(null);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    const params = { page, page_size: pageSize, sort_by: "created_at", sort_order: "desc" };
    if (debouncedSearch) params.search = debouncedSearch;

    if (tab === 0) {
      fetchUnanswered(params);
    } else if (tab === 1) {
      fetchHistory({ ...params, validation_status: "pending" });
    } else {
      getAILogs(params).then(({ items, pagination }) => {
        setAILogs(items);
        setAILogsPagination(pagination);
      }).catch(() => {});
    }
  }, [page, pageSize, debouncedSearch, tab]);

  const handleValidate = async (status) => {
    if (!viewMsg) return;
    setActionLoading(true);
    try {
      await validateMessage(viewMsg.id, { validation_status: status, validation_note: validationNote || undefined });
      openSnackbar(`Answer ${status}`, "success");
      setViewMsg(null);
      setValidationNote("");
      // Refresh current tab
      if (tab === 0) fetchUnanswered({ page, page_size: pageSize });
      else fetchHistory({ page, page_size: pageSize, validation_status: "pending" });
    } catch (err) {
      openSnackbar(err.response?.data?.message || "Validation failed", "error");
    }
    setActionLoading(false);
  };

  const messageColumns = [
    { field: "question", headerName: "Question", minWidth: 250, renderCell: (row) => <Typography noWrap sx={{ maxWidth: 250, fontSize: "0.85rem" }}>{row.question}</Typography> },
    { field: "answer", headerName: "Answer", minWidth: 200, renderCell: (row) => <Typography noWrap sx={{ maxWidth: 200, fontSize: "0.85rem", color: "#6B7280" }}>{truncateText(row.answer, 60)}</Typography> },
    { field: "validation_status", headerName: "Status", renderCell: (row) => (
      <Chip label={row.validation_status} size="small" sx={{ fontWeight: 600, fontSize: "0.65rem", backgroundColor: row.validation_status === "approved" ? "#F0FDF4" : row.validation_status === "rejected" ? "#FEE2E2" : "#FEF3C7", color: row.validation_status === "approved" ? "#166534" : row.validation_status === "rejected" ? "#991B1B" : "#92400E" }} />
    )},
    { field: "created_at", headerName: "Date", renderCell: (row) => formatDate(row.created_at) },
    { field: "actions", headerName: "Actions", renderCell: (row) => (
      <Tooltip title="Review"><IconButton size="small" onClick={() => setViewMsg(row)}><VisibilityIcon fontSize="small" sx={{ color: "#16A34A" }} /></IconButton></Tooltip>
    )},
  ];

  const logColumns = [
    { field: "model_name", headerName: "Model" },
    { field: "status", headerName: "Status", renderCell: (row) => <Chip label={row.status} size="small" sx={{ backgroundColor: row.status === "success" ? "#F0FDF4" : "#FEE2E2", color: row.status === "success" ? "#166534" : "#991B1B", fontWeight: 600, fontSize: "0.65rem" }} /> },
    { field: "response_time_ms", headerName: "Response Time", renderCell: (row) => row.response_time_ms ? `${row.response_time_ms}ms` : "—" },
    { field: "total_tokens", headerName: "Tokens", renderCell: (row) => row.total_tokens || "—" },
    { field: "created_at", headerName: "Date", renderCell: (row) => formatDate(row.created_at) },
  ];

  return (
    <Box>
      <PageHeader title="AI Validation" subtitle="Review and validate AI responses" />
      <Tabs value={tab} onChange={(e, v) => { setTab(v); resetPage(); }} sx={{ mb: 3, "& .MuiTab-root": { fontWeight: 600 } }}>
        <Tab label="Unanswered" />
        <Tab label="Pending Validation" />
        <Tab label="AI Logs" />
      </Tabs>
      <Box sx={{ mb: 3 }}>
        <SearchBar value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Search..." />
      </Box>

      {tab < 2 ? (
        <DataTable columns={messageColumns} rows={messages} loading={loading} pagination={messagePagination} onPageChange={handlePageChange} onRowsPerPageChange={handlePageSizeChange} />
      ) : (
        <DataTable columns={logColumns} rows={aiLogs} loading={loading} pagination={aiLogsPagination} onPageChange={handlePageChange} onRowsPerPageChange={handlePageSizeChange} />
      )}

      {/* Validation Dialog */}
      <AppDialog open={!!viewMsg} onClose={() => setViewMsg(null)} title="Review AI Answer" maxWidth="md"
        actions={
          <>
            <AppButton variant="outlined" color="error" onClick={() => handleValidate("rejected")} disabled={actionLoading} startIcon={<CancelIcon />}>Reject</AppButton>
            <AppButton onClick={() => handleValidate("approved")} disabled={actionLoading} startIcon={<CheckCircleIcon />}>Approve</AppButton>
          </>
        }
      >
        {viewMsg && (
          <Box>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Question:</Typography>
            <Typography sx={{ mb: 2, color: "#374151" }}>{viewMsg.question}</Typography>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>AI Answer:</Typography>
            <Typography sx={{ mb: 2, color: "#374151", whiteSpace: "pre-wrap" }}>{viewMsg.answer}</Typography>
            <TextField label="Validation Note (optional)" fullWidth multiline rows={2} value={validationNote} onChange={(e) => setValidationNote(e.target.value)} sx={{ mt: 1 }} />
          </Box>
        )}
      </AppDialog>
    </Box>
  );
};

export default AIValidationContainer;
