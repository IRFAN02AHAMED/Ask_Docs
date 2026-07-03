import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, 
  TableBody, InputBase, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, Chip, TextField, Tabs, Tab, TableContainer, Select, MenuItem, FormControl, TablePagination
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { SharedAdminSidebar, SharedAdminHeader } from "../../components/layout/SharedLayout";
import { useNavigate } from "react-router-dom";
import useQAStore from "../../store/qaStore";
import useDebounce from "../../hooks/useDebounce";
import { formatDate, truncateText } from "../../utils/helpers";
import { getAILogs } from "../../services/qaService";
import useCategoryStore from "../../store/categoryStore";
import { getUsers } from "../../services/userService";

const AIValidationPage = () => {
  const navigate = useNavigate();
  const { messages, messagePagination, loading, fetchUnanswered, fetchHistory, validateMessage } = useQAStore();
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [tab, setTab] = useState(0);
  const [viewMsg, setViewMsg] = useState(null);
  const [validationNote, setValidationNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { categories, fetchCategories } = useCategoryStore();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchCategories();
    getUsers({ page: 1, page_size: 100 }).then(res => setUsers(res.items)).catch(() => {});
  }, [fetchCategories]);

  // Reset page to 1 when filters/tab change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tab, categoryFilter, userFilter]);

  // Fetch history or unanswered queries when filters or page changes
  useEffect(() => {
    const params = { page, page_size: pageSize, sort_by: "created_at", sort_order: "desc" };
    if (debouncedSearch) params.search = debouncedSearch;
    if (categoryFilter !== "all") params.category_id = categoryFilter;
    if (userFilter !== "all") params.user_id = userFilter;

    if (tab === 0) {
      fetchHistory({ ...params, validation_status: "pending" });
    } else {
      fetchUnanswered(params);
    }
  }, [page, pageSize, debouncedSearch, tab, categoryFilter, userFilter, fetchUnanswered, fetchHistory]);

  const handleValidate = async (status) => {
    if (!viewMsg) return;
    setActionLoading(true);
    try {
      await validateMessage(viewMsg.id, { validation_status: status, validation_note: validationNote || undefined });
      setViewMsg(null);
      setValidationNote("");
      
      // Refresh the current list with active filters
      const params = { page, page_size: pageSize, sort_by: "created_at", sort_order: "desc" };
      if (debouncedSearch) params.search = debouncedSearch;
      if (categoryFilter !== "all") params.category_id = categoryFilter;
      if (userFilter !== "all") params.user_id = userFilter;

      if (tab === 0) {
        fetchHistory({ ...params, validation_status: "pending" });
      } else {
        fetchUnanswered(params);
      }
    } catch (err) {
      console.error("Validation failed", err);
    }
    setActionLoading(false);
  };

  const getStatusChip = (status) => {
    const s = String(status).toLowerCase();
    if (s === "approved") return <Chip label="Approved" size="small" sx={{ backgroundColor: '#ECFDF5', color: '#10B981', fontWeight: 600, fontSize: '0.7rem' }} />;
    if (s === "rejected") return <Chip label="Rejected" size="small" sx={{ backgroundColor: '#FEF2F2', color: '#EF4444', fontWeight: 600, fontSize: '0.7rem' }} />;
    return <Chip label="Pending" size="small" sx={{ backgroundColor: '#FFFBEB', color: '#F59E0B', fontWeight: 600, fontSize: '0.7rem' }} />;
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", fontFamily: "'Inter', sans-serif" }}>
      <SharedAdminSidebar activeMenu="ai-validation" />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="Review Responses" />

        <Box sx={{ px: 6, pb: 4, pt: 4, flexGrow: 1, overflowY: 'auto' }}>
          
          <Box sx={{ display: 'flex', justifycontent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                AI Validation
              </Typography>
              <Typography sx={{ color: '#4B5563', fontSize: '0.95rem' }}>
                Review and validate AI responses to ensure high quality and accuracy.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  displayEmpty
                  sx={{ backgroundColor: 'white', borderRadius: 2 }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories?.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  displayEmpty
                  sx={{ backgroundColor: 'white', borderRadius: 2 }}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  {users?.map((u) => (
                    <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                backgroundColor: "white", 
                borderRadius: 2, 
                px: 2, 
                py: 1,
                width: 280,
                border: '1px solid #E5E7EB'
              }}>
                <SearchIcon sx={{ color: "#9CA3AF", fontSize: 20, mr: 1 }} />
                <InputBase 
                  placeholder="Search queries..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ fontSize: "0.95rem", width: '100%' }} 
                />
              </Box>
            </Box>
          </Box>

          <Tabs 
            value={tab} 
            onChange={(e, v) => setTab(v)} 
            sx={{ 
              mb: 3, 
              "& .MuiTab-root": { fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', minWidth: 120 },
              "& .Mui-selected": { color: '#16A34A !important' },
              "& .MuiTabs-indicator": { backgroundColor: '#16A34A' }
            }}
          >
            <Tab label="Pending Validation" />
            <Tab label="Unanswered Queries" />
          </Tabs>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Question</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Document</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && !viewMsg ? (
                   <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={30} sx={{ color: '#22C55E' }} /></TableCell></TableRow>
                ) : messages.length === 0 ? (
                   <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: '#6B7280' }}>No messages to review.</TableCell></TableRow>
                ) : (
                  messages.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ color: '#4B5563', fontSize: '0.9rem', py: 2.5, borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
                        {row.user?.name || "Anonymous"}
                      </TableCell>
                      <TableCell sx={{ color: '#111827', fontSize: '0.9rem', fontWeight: 500, py: 2.5, borderBottom: '1px solid #F3F4F6', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.question}
                      </TableCell>
                      <TableCell sx={{ color: '#4B5563', fontSize: '0.9rem', py: 2.5, borderBottom: '1px solid #F3F4F6', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.document?.title || "No Document"}
                      </TableCell>
                      <TableCell sx={{ color: '#4B5563', fontSize: '0.9rem', py: 2.5, borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
                        {row.category?.name || "General"}
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6' }}>
                        {getStatusChip(row.validation_status)}
                      </TableCell>
                      <TableCell sx={{ color: '#4B5563', fontSize: '0.9rem', py: 2.5, borderBottom: '1px solid #F3F4F6' }}>{formatDate(row.created_at)}</TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6' }}>
                        <IconButton size="small" aria-label="Review AI response" onClick={() => setViewMsg(row)} sx={{ color: "#6B7280", backgroundColor: '#F3F4F6', borderRadius: 1.5, p: 0.5 }}>
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {messagePagination && (
            <TablePagination
              component="div"
              count={messagePagination.total || 0}
              page={(messagePagination.page || 1) - 1}
              rowsPerPage={pageSize}
              onPageChange={(e, newPage) => setPage(newPage + 1)}
              onRowsPerPageChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
              sx={{ mt: 2 }}
            />
          )}

        </Box>

        {/* Review Dialog */}
        <Dialog 
          open={!!viewMsg} 
          onClose={() => { setViewMsg(null); setValidationNote(""); }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, p: 2, border: '1px solid #E5E7EB', boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }
          }}
          sx={{ '& .MuiBackdrop-root': { backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#111827" }}>
              Review AI Response
            </Typography>
            <IconButton aria-label="Close" onClick={() => { setViewMsg(null); setValidationNote(""); }} size="small">
              <CloseIcon sx={{ fontSize: 20, color: "#6B7280" }} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: '#E5E7EB', p: 3, backgroundColor: '#FAFAFA' }}>
            {viewMsg && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>User Question</Typography>
                  <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
                    <Typography sx={{ fontSize: '0.95rem', color: '#111827' }}>{viewMsg.question}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>AI Answer</Typography>
                  <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 2, border: '1px solid #E5E7EB' }}>
                    <Typography sx={{ fontSize: '0.95rem', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{viewMsg.answer || "No answer"}</Typography>
                  </Box>
                </Box>

                {tab === 0 ? (
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>Validation Note (Optional)</Typography>
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={2} 
                      placeholder="Add any feedback for the AI model..."
                      value={validationNote} 
                      onChange={(e) => setValidationNote(e.target.value)} 
                      sx={{ 
                        backgroundColor: 'white',
                        "& .MuiOutlinedInput-root": { 
                          borderRadius: 2,
                          "& fieldset": { borderColor: "#E5E7EB" }
                        } 
                      }} 
                    />
                  </Box>
                ) : (
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>Enter Answer Yourself</Typography>
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={3} 
                      placeholder="Provide the answer for this unanswered question..."
                      value={validationNote} 
                      onChange={(e) => setValidationNote(e.target.value)} 
                      sx={{ 
                        backgroundColor: 'white',
                        mb: 2,
                        "& .MuiOutlinedInput-root": { 
                          borderRadius: 2,
                          "& fieldset": { borderColor: "#E5E7EB" }
                        } 
                      }} 
                    />
                    
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>OR Upload Updated Document</Typography>
                    {viewMsg.document ? (
                      <>
                        <Button 
                          variant="outlined" 
                          startIcon={<UploadFileOutlinedIcon />}
                          onClick={() => navigate('/admin/upload', { 
                            state: { 
                              newVersionOf: viewMsg.document.id, 
                              documentTitle: viewMsg.document.title,
                              categoryId: viewMsg.document.category?.id || viewMsg.document.category_id,
                              currentVersionNo: viewMsg.document.current_version_no,
                              tags: viewMsg.document.tags
                            } 
                          })}
                          sx={{ borderColor: '#E5E7EB', color: '#374151', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, backgroundColor: 'white', '&:hover': { backgroundColor: '#F9FAFB' } }}
                        >
                          Upload New Version
                        </Button>
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: '#6B7280' }}>
                          Uploading a new version for document "{viewMsg.document.title}" will allow re-indexing to improve answering this query.
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: '#EF4444', fontWeight: 600 }}>
                        No source document linked to this query.
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 3 }}>
            {tab === 0 ? (
              <>
                <Button 
                  variant="outlined" 
                  onClick={() => handleValidate("rejected")}
                  disabled={actionLoading}
                  startIcon={<HighlightOffOutlinedIcon />}
                  sx={{ borderColor: '#FCA5A5', color: '#DC2626', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, '&:hover': { borderColor: '#EF4444', backgroundColor: '#FEF2F2' } }}
                >
                  Reject Answer
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => handleValidate("approved")}
                  disabled={actionLoading}
                  startIcon={<CheckCircleOutlineIcon />}
                  sx={{ backgroundColor: '#16A34A', color: 'white', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, boxShadow: 'none', '&:hover': { backgroundColor: '#15803D', boxShadow: 'none' } }}
                >
                  Approve Answer
                </Button>
              </>
            ) : (
              <Button 
                variant="contained" 
                onClick={() => handleValidate("approved")}
                disabled={actionLoading || !validationNote.trim()}
                startIcon={<SendOutlinedIcon />}
                sx={{ backgroundColor: '#16A34A', color: 'white', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, boxShadow: 'none', '&:hover': { backgroundColor: '#15803D', boxShadow: 'none' } }}
              >
                Submit Answer
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AIValidationPage;
