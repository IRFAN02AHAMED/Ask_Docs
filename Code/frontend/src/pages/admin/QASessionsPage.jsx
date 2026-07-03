import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, 
  TableBody, InputBase, IconButton, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TableContainer
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { SharedAdminSidebar, SharedAdminHeader } from "../../components/layout/SharedLayout";
import useQAStore from "../../store/qaStore";
import useDocumentStore from "../../store/documentStore";
import useDebounce from "../../hooks/useDebounce";
import { formatDate, truncateText } from "../../utils/helpers";

const QASessionsPage = () => {
  const { messages, loading: qaLoading, fetchHistory, clearMessages } = useQAStore();
  const { documents, loading: docLoading, fetchDocuments } = useDocumentStore();
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [viewSession, setViewSession] = useState(null); // Actually viewDocument now

  useEffect(() => {
    fetchDocuments({ page: 1, page_size: 50, search: debouncedSearch, sort_by: "created_at", sort_order: "desc" });
  }, [debouncedSearch, fetchDocuments]);

  const handleViewMessages = async (doc) => {
    setViewSession(doc);
    await fetchHistory({ page: 1, page_size: 100, document_id: doc.id });
  };

  const handleDelete = async (id) => {
    // Optional: maybe we just remove the delete button from History since it's document-based now
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", fontFamily: "'Inter', sans-serif" }}>
      <SharedAdminSidebar activeMenu="history" />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="History" />

        <Box sx={{ px: 6, pb: 4, pt: 4, flexGrow: 1, overflowY: 'auto' }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                User Q&A History
              </Typography>
              <Typography sx={{ color: '#4B5563', fontSize: '0.95rem' }}>
                Review and monitor interactions between users and the document AI.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
                  placeholder="Search History" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ fontSize: "0.95rem", width: '100%' }} 
                />
              </Box>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Document Title</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Questions</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Created Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB', py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docLoading && !viewSession ? (
                   <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><CircularProgress size={30} sx={{ color: '#22C55E' }} /></TableCell></TableRow>
                ) : documents.length === 0 ? (
                   <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#6B7280' }}>No documents found</TableCell></TableRow>
                ) : (
                  documents.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ color: '#111827', fontSize: '0.95rem', fontWeight: 500, py: 2.5, borderBottom: '1px solid #F3F4F6' }}>
                        {row.title || "Untitled Document"}
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6' }}>
                        <Box sx={{ backgroundColor: '#EFF6FF', display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 600, color: '#2563EB' }}>
                          {row.question_count || 0}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6' }}>
                        <Box sx={{ 
                          backgroundColor: String(row.status?.status_name).toLowerCase() === 'published' ? '#ECFDF5' : '#F3F4F6', 
                          display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 600, 
                          color: String(row.status?.status_name).toLowerCase() === 'published' ? '#10B981' : '#4B5563' 
                        }}>
                          {String(row.status?.status_name).toLowerCase() === 'published' ? 'Published' : (row.status?.status_name || "Unknown")}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#4B5563', fontSize: '0.95rem', py: 2.5, borderBottom: '1px solid #F3F4F6' }}>{formatDate(row.created_at)}</TableCell>
                      <TableCell sx={{ py: 2.5, borderBottom: '1px solid #F3F4F6' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<VisibilityOutlinedIcon />} 
                            onClick={() => handleViewMessages(row)} 
                            sx={{ borderColor: '#E5E7EB', color: '#4B5563', textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                          >
                            View Questions
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

        </Box>

        {/* View Messages Modal */}
        <Dialog 
          open={!!viewSession} 
          onClose={() => { setViewSession(null); clearMessages(); }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, p: 2, border: '1px solid #E5E7EB', boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }
          }}
          sx={{ '& .MuiBackdrop-root': { backgroundColor: 'rgba(255, 255, 255, 0.6)' } }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#111827" }}>
                Document Questions
              </Typography>
              <Typography sx={{ fontSize: "0.9rem", color: "#6B7280" }}>
                {viewSession?.title || "Untitled Session"}
              </Typography>
            </Box>
            <IconButton aria-label="Close" onClick={() => { setViewSession(null); clearMessages(); }} size="small">
              <CloseIcon sx={{ fontSize: 20, color: "#6B7280" }} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: '#E5E7EB', p: 3, backgroundColor: '#FAFAFA' }}>
            {qaLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={30} sx={{ color: '#22C55E' }} /></Box>
            ) : messages.length === 0 ? (
              <Typography sx={{ textAlign: "center", color: "#6B7280", py: 4 }}>No questions have been asked about this document.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>Total Questions Asked: {messages.length}</Typography>
                {messages.map((msg) => (
                  <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* User Question */}
                    <Box sx={{ alignSelf: 'flex-start', backgroundColor: '#F3F4F6', p: 2, borderRadius: 2, borderBottomLeftRadius: 0, maxWidth: '80%', border: '1px solid #E5E7EB' }}>
                      <Typography sx={{ fontSize: '0.95rem', color: '#111827', fontWeight: 500, mb: 1 }}>{msg.question}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Asked by {msg.user?.name || msg.user?.email || "Unknown User"} on {formatDate(msg.created_at)}
                      </Typography>
                    </Box>
                    {/* AI Answer */}
                    <Box sx={{ alignSelf: 'flex-start', backgroundColor: 'white', p: 2, borderRadius: 2, borderBottomLeftRadius: 0, maxWidth: '90%', border: '1px solid #E5E7EB', ml: 4 }}>
                      <Typography sx={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.6 }}>{msg.answer || "No answer provided"}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
};

export default QASessionsPage;
