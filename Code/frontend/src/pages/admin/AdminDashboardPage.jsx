import React, { useEffect } from "react";
import { Box, Typography, Button, Paper, Grid, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip, CircularProgress } from "@mui/material";
import { SharedAdminSidebar, SharedAdminHeader } from "../../components/layout/SharedLayout";
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import ChecklistRtlOutlinedIcon from '@mui/icons-material/ChecklistRtlOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SyncIcon from '@mui/icons-material/Sync';
import PendingOutlinedIcon from '@mui/icons-material/PendingOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import { useNavigate } from "react-router-dom";
import useDashboardStore from "../../store/dashboardStore";
import useDocumentStore from "../../store/documentStore";
import useQAStore from "../../store/qaStore";
import { formatDate, formatNumber, formatRelativeTime, truncateText } from "../../utils/helpers";

const StatCard = ({ icon, title, value, color, bgColor, loading, onClick }) => (
  <Paper 
    elevation={0} 
    onClick={onClick}
    sx={{ 
      p: 2.5, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2, 
      borderRadius: 3, 
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s',
      '&:hover': onClick ? { borderColor: color, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' } : {}
    }}>
    <Box sx={{ 
      backgroundColor: bgColor, 
      color: color, 
      p: 1.5, 
      borderRadius: 2, 
      display: 'flex' 
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {title}
      </Typography>
      {loading ? (
         <CircularProgress size={20} sx={{ mt: 1, color: color }} />
      ) : (
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', lineHeight: 1.2, mt: 0.5 }}>
          {value !== undefined ? formatNumber(value) : "0"}
        </Typography>
      )}
    </Box>
  </Paper>
);

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { stats, loading: statsLoading, fetchDashboardStats } = useDashboardStore();
  const { documents, loading: docsLoading, fetchDocuments } = useDocumentStore();
  const { messages: recentQuestions, loading: qaLoading, fetchHistory } = useQAStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchDocuments({ page: 1, page_size: 5 });
    fetchHistory({ page: 1, page_size: 5 });
  }, [fetchDashboardStats, fetchDocuments, fetchHistory]);

  const getStatusChip = (status) => {
    let statusStr = status;
    if (typeof status === 'object' && status !== null) {
      statusStr = status.status_name || status.name || "PENDING";
    }
    const s = String(statusStr || "").toUpperCase();
    const displayLabel = statusStr ? (String(statusStr).charAt(0).toUpperCase() + String(statusStr).slice(1).toLowerCase()) : "Pending";
    if (s === "PUBLISHED" || s === "COMPLETED" || s === "SUCCESS") {
      return <Chip label={displayLabel} size="small" sx={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontWeight: 700, fontSize: '0.7rem', borderRadius: 1.5 }} />;
    }
    if (s === "PROCESSING" || s === "INDEXING") {
      return <Chip label={displayLabel} size="small" sx={{ backgroundColor: '#DBEAFE', color: '#2563EB', fontWeight: 700, fontSize: '0.7rem', borderRadius: 1.5 }} />;
    }
    if (s === "FAILED" || s === "ERROR") {
      return <Chip label={displayLabel} size="small" sx={{ backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.7rem', borderRadius: 1.5 }} />;
    }
    return <Chip label={displayLabel} size="small" sx={{ backgroundColor: '#FFFBEB', color: '#F59E0B', fontWeight: 700, fontSize: '0.7rem', borderRadius: 1.5 }} />;
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", fontFamily: "'Inter', sans-serif" }}>
      <SharedAdminSidebar activeMenu="dashboard" />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <SharedAdminHeader title="Admin Dashboard" />

        <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>
          {/* Top Actions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button 
              variant="contained" 
              startIcon={<InsertDriveFileOutlinedIcon />}
              onClick={() => navigate('/admin/upload')}
              sx={{ backgroundColor: '#22C55E', color: 'white', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, '&:hover': { backgroundColor: '#16A34A' } }}
            >
              Upload Document
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FolderOpenOutlinedIcon />}
              onClick={() => navigate('/admin/documents')}
              sx={{ borderColor: '#E5E7EB', color: '#374151', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, backgroundColor: 'white', '&:hover': { backgroundColor: '#F9FAFB' } }}
            >
              View Documents
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<ChecklistRtlOutlinedIcon />}
              onClick={() => navigate('/admin/ai-validation')}
              sx={{ borderColor: '#E5E7EB', color: '#374151', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, backgroundColor: 'white', '&:hover': { backgroundColor: '#F9FAFB' } }}
            >
              Validation Review
            </Button>
          </Box>

          {/* Stats Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={3}>
              <StatCard loading={statsLoading} icon={<InsertDriveFileOutlinedIcon />} title="TOTAL DOCUMENTS" value={stats?.total_documents} color="#3B82F6" bgColor="#EFF6FF" onClick={() => navigate('/admin/documents?status=all')} />
            </Grid>
            <Grid item xs={3}>
              <StatCard loading={statsLoading} icon={<CheckCircleOutlineIcon />} title="PUBLISHED" value={stats?.published_documents || stats?.total_documents} color="#10B981" bgColor="#ECFDF5" onClick={() => navigate('/admin/documents?status=published')} />
            </Grid>
            <Grid item xs={3}>
              <StatCard loading={statsLoading} icon={<SyncIcon />} title="PROCESSED" value={stats?.processed_documents || 0} color="#3B82F6" bgColor="#EFF6FF" onClick={() => navigate('/admin/documents?status=processing')} />
            </Grid>
            <Grid item xs={3}>
              <StatCard loading={statsLoading} icon={<PendingOutlinedIcon />} title="PENDING" value={stats?.pending_documents || 0} color="#F59E0B" bgColor="#FFFBEB" onClick={() => navigate('/admin/documents?status=pending')} />
            </Grid>
            <Grid item xs={3}>
              <StatCard loading={statsLoading} icon={<ErrorOutlineIcon />} title="FAILED" value={stats?.failed_documents || 0} color="#EF4444" bgColor="#FEF2F2" onClick={() => navigate('/admin/documents?status=failed')} />
            </Grid>
            <Grid item xs={3}>
              <StatCard loading={statsLoading} icon={<PeopleAltOutlinedIcon />} title="TOTAL USERS" value={stats?.total_users} color="#6B7280" bgColor="#F3F4F6" onClick={() => navigate('/admin/users')} />
            </Grid>
            <Grid item xs={3}>
              <StatCard loading={statsLoading} icon={<ForumOutlinedIcon />} title="TOTAL QUESTIONS" value={stats?.total_questions} color="#3B82F6" bgColor="#EFF6FF" />
            </Grid>
            <Grid item xs={3}>
              <StatCard loading={statsLoading} icon={<ThumbUpOutlinedIcon />} title="HELPFUL ANSWERS" value={stats?.helpful_answers} color="#10B981" bgColor="#ECFDF5" />
            </Grid>
          </Grid>

          {/* Tables Row */}
          <Grid container spacing={3}>
            {/* Recent Documents */}
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>Recent Documents</Typography>
                  <Typography onClick={() => navigate('/admin/documents')} sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#22C55E', cursor: 'pointer' }}>View All</Typography>
                </Box>
                <TableContainer sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6B7280', py: 1.5 }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6B7280', py: 1.5 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6B7280', py: 1.5 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {docsLoading ? (
                      <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                    ) : documents && documents.length > 0 ? (
                      documents.slice(0, 5).map((doc) => (
                        <TableRow key={doc.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/documents/${doc.id}`)}>
                          <TableCell sx={{ py: 2, color: '#374151', fontSize: '0.9rem' }}>{truncateText(doc.title || doc.filename, 40)}</TableCell>
                          <TableCell sx={{ py: 2 }}>{getStatusChip(doc.processing_status || doc.status)}</TableCell>
                          <TableCell sx={{ py: 2, color: '#4B5563', fontSize: '0.9rem' }}>{formatDate(doc.created_at)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                       <TableRow><TableCell colSpan={3} align="center">No documents found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Recent Questions */}
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>Recent Questions</Typography>
                  <Typography onClick={() => navigate('/admin/history')} sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#22C55E', cursor: 'pointer' }}>View All</Typography>
                </Box>
                <TableContainer sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6B7280', py: 1.5 }}>Question</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6B7280', py: 1.5 }}>Helpful</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#6B7280', py: 1.5 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {qaLoading ? (
                      <TableRow><TableCell colSpan={3} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                    ) : recentQuestions && recentQuestions.length > 0 ? (
                      recentQuestions.slice(0, 5).map((q) => (
                        <TableRow key={q.id}>
                          <TableCell sx={{ py: 2, color: '#374151', fontSize: '0.9rem' }}>{truncateText(q.question, 40)}</TableCell>
                          <TableCell sx={{ py: 2 }}>
                            {q.helpful === true && <ThumbUpOutlinedIcon sx={{ color: '#10B981', fontSize: 18 }} />}
                            {q.helpful === false && <ThumbDownOutlinedIcon sx={{ color: '#EF4444', fontSize: 18 }} />}
                            {q.helpful === null && <Typography sx={{ color: '#9CA3AF' }}>-</Typography>}
                          </TableCell>
                          <TableCell sx={{ py: 2, color: '#4B5563', fontSize: '0.9rem' }}>{formatRelativeTime(q.created_at)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} align="center">No questions found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
