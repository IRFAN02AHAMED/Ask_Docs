import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, 
  TableBody, CircularProgress, TableContainer, IconButton, Modal, Tooltip, Pagination
} from "@mui/material";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import * as qaService from "../../services/qaService";
import { formatDateTime } from "../../utils/helpers";
import { SharedAdminSidebar, SharedAdminHeader } from "../../components/layout/SharedLayout";

const FilterButton = ({ label, active, onClick }) => (
  <Button 
    variant="outlined" 
    onClick={onClick}
    sx={{ 
      borderColor: active ? '#16A34A' : '#E5E7EB', 
      color: active ? '#15803D' : '#374151', 
      textTransform: 'none', 
      fontWeight: active ? 600 : 500, 
      borderRadius: 1.5, 
      px: 1.5, 
      py: 0.5,
      backgroundColor: active ? '#F0FDF4' : 'white', 
      '&:hover': { backgroundColor: active ? '#DCFCE7' : '#F9FAFB' } 
    }}
  >
    {label}
  </Button>
);

const AILogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, modelFilter]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = { page: page, page_size: pageSize };
        if (statusFilter !== "all") params.status = statusFilter;
        if (modelFilter !== "all") params.provider = modelFilter;
        
        const response = await qaService.getAILogs(params);
        setLogs(response.items || []);
        setTotal(response.pagination?.total || 0);
      } catch (err) {
        console.error("Failed to fetch AI logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [statusFilter, modelFilter, page, pageSize]);

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", fontFamily: "'Inter', sans-serif" }}>
      <SharedAdminSidebar activeMenu="logs" />

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        <SharedAdminHeader title="AI Logs" />

        {/* Content Area */}
        <Box sx={{ px: 6, pb: 4, flexGrow: 1, overflowY: 'auto' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 4, mt: 4 }}>
            Admin AI Logs Monitoring
          </Typography>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', mb: 1 }}>Status</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FilterButton label="All" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                <FilterButton label="Success" active={statusFilter === "success"} onClick={() => setStatusFilter("success")} />
                <FilterButton label="Failed" active={statusFilter === "failed"} onClick={() => setStatusFilter("failed")} />
              </Box>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827', mb: 1 }}>Provider</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FilterButton label="All" active={modelFilter === "all"} onClick={() => setModelFilter("all")} />
                <FilterButton label="Google Gemini" active={modelFilter === "Google"} onClick={() => setModelFilter("Google")} />
                <FilterButton label="Hugging Face / Qwen" active={modelFilter === "Qwen/Qwen3-8B"} onClick={() => setModelFilter("Qwen/Qwen3-8B")} />
              </Box>
            </Box>
          </Box>

          {/* Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, backgroundColor: 'white', overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.8rem', py: 2, borderBottom: '1px solid #E5E7EB', width: '15%' }}>Provider</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.8rem', py: 2, borderBottom: '1px solid #E5E7EB', width: '18%' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.8rem', py: 2, borderBottom: '1px solid #E5E7EB', width: '30%' }}>Question</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.8rem', py: 2, borderBottom: '1px solid #E5E7EB', width: '15%', textAlign: 'left' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.8rem', py: 2, borderBottom: '1px solid #E5E7EB', width: '14%' }}>Created Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.8rem', py: 2, borderBottom: '1px solid #E5E7EB', width: '8%', align: 'center' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} sx={{ my: 4, color: '#16A34A' }} /></TableCell></TableRow>
                ) : logs.length === 0 ? (
                   <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#6B7280' }}>No AI logs found</TableCell></TableRow>
                ) : (
                  logs.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ color: '#374151', fontSize: '0.9rem', py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                        {row.ai_provider === 'Google' ? 'Google Gemini' : (row.ai_provider === 'Qwen/Qwen3-8B' || row.ai_provider === 'Hugging Face' ? 'Hugging Face' : (row.ai_provider || 'Google Gemini'))}
                      </TableCell>
                      <TableCell sx={{ color: '#374151', fontSize: '0.9rem', py: 1.5, borderBottom: '1px solid #F3F4F6' }}>{row.user?.name || "N/A"}</TableCell>
                      <TableCell sx={{ color: '#374151', fontSize: '0.9rem', py: 1.5, borderBottom: '1px solid #F3F4F6', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.question || "N/A"}</TableCell>
                      <TableCell sx={{ py: 1.5, borderBottom: '1px solid #F3F4F6', textAlign: 'left' }}>
                        <Box sx={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 1,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1.5,
                          backgroundColor: String(row.status).toLowerCase() === 'success' ? '#ECFDF5' : '#FEF2F2',
                          color: String(row.status).toLowerCase() === 'success' ? '#10B981' : '#EF4444'
                        }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: String(row.status).toLowerCase() === 'success' ? '#10B981' : '#EF4444' }} />
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{String(row.status).charAt(0).toUpperCase() + String(row.status).slice(1).toLowerCase()}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#374151', fontSize: '0.9rem', py: 1.5, borderBottom: '1px solid #F3F4F6' }}>{formatDateTime(row.created_at)}</TableCell>
                      <TableCell sx={{ py: 1.5, borderBottom: '1px solid #F3F4F6', align: 'center' }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" aria-label="View details" onClick={() => setSelectedLog(row)} sx={{ color: '#6B7280', '&:hover': { color: '#16A34A', backgroundColor: '#F0FDF4' } }}>
                            <RemoveRedEyeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {total > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, pb: 2 }}>
              <Pagination
                count={Math.ceil(total / pageSize)}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}

        </Box>
      </Box>

      {/* Detail Modal */}
      <Modal open={!!selectedLog} onClose={() => setSelectedLog(null)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ width: '600px', maxWidth: '90%', maxHeight: '80vh', p: 4, borderRadius: 3, overflowY: 'auto', position: 'relative' }}>
          <IconButton aria-label="Close" onClick={() => setSelectedLog(null)} sx={{ position: 'absolute', top: 16, right: 16, color: '#6B7280' }}>
            <CloseIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 3 }}>
            AI Log Details
          </Typography>

          {selectedLog && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>Provider</Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>
                  {selectedLog.ai_provider === 'Google' ? 'Google Gemini' : (selectedLog.ai_provider === 'Qwen/Qwen3-8B' || selectedLog.ai_provider === 'Hugging Face' ? 'Hugging Face' : (selectedLog.ai_provider || 'Google Gemini'))}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>Model</Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{selectedLog.model_name || "N/A"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>User</Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{selectedLog.user?.name || "N/A"} ({selectedLog.user?.email || "N/A"})</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>Question</Typography>
                <Paper sx={{ p: 2, backgroundColor: '#F9FAFB', mt: 0.5, border: '1px solid #E5E7EB', borderRadius: 2 }}>
                  <Typography sx={{ fontSize: '0.9rem', color: '#374151', whiteSpace: 'pre-wrap' }}>{selectedLog.question || "N/A"}</Typography>
                </Paper>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>Answer</Typography>
                <Paper sx={{ p: 2, backgroundColor: '#F9FAFB', mt: 0.5, border: '1px solid #E5E7EB', borderRadius: 2 }}>
                  <Typography sx={{ fontSize: '0.9rem', color: '#374151', whiteSpace: 'pre-wrap' }}>{selectedLog.answer || "N/A"}</Typography>
                </Paper>
              </Box>
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>Status</Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: String(selectedLog.status).toLowerCase() === 'success' ? '#10B981' : '#EF4444' }}>
                    {String(selectedLog.status).charAt(0).toUpperCase() + String(selectedLog.status).slice(1).toLowerCase()}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>Confidence</Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>
                    {selectedLog.confidence_score !== null && selectedLog.confidence_score !== undefined ? Number(selectedLog.confidence_score).toFixed(2) : "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>Response Time</Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>
                    {selectedLog.response_time_ms ? `${selectedLog.response_time_ms}ms` : "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>Created Date</Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>
                    {formatDateTime(selectedLog.created_at)}
                  </Typography>
                </Box>
              </Box>
              {selectedLog.error_message && (
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B7280' }}>Error Message</Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#FEF2F2', mt: 0.5, border: '1px solid #FCA5A5', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '0.9rem', color: '#DC2626', whiteSpace: 'pre-wrap' }}>{selectedLog.error_message}</Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Modal>

    </Box>
  );
};

export default AILogsPage;
