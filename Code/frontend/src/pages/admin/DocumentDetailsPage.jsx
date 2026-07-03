import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Paper, Grid, Chip, Divider, Avatar, IconButton, TextField, CircularProgress, Tooltip, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { SharedAdminSidebar } from "../../components/layout/SharedLayout";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FormatListNumberedOutlinedIcon from '@mui/icons-material/FormatListNumberedOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import HistoryIcon from '@mui/icons-material/History';
import PublishIcon from '@mui/icons-material/Publish';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useParams, useNavigate } from 'react-router-dom';
import useDocumentStore from "../../store/documentStore";
import useQAStore from "../../store/qaStore";
import { formatDate, parseTags, truncateText } from "../../utils/helpers";
import { SourceChunksSection } from "../../components/common/SourceChunkCard";
import apiClient from "../../services/apiClient";

const STATUS_ORDER = ['pending', 'processing', 'processed', 'published'];

const StatusStep = ({ label, status, active }) => {
  let icon;
  if (status === 'completed') {
    icon = <CheckCircleIcon sx={{ color: '#10B981', fontSize: 28, zIndex: 1, backgroundColor: 'white' }} />;
  } else if (status === 'current') {
    icon = <RadioButtonCheckedIcon sx={{ color: '#3B82F6', fontSize: 28, zIndex: 1, backgroundColor: 'white' }} />;
  } else {
    icon = <FiberManualRecordIcon sx={{ color: '#D1D5DB', fontSize: 16, zIndex: 1, backgroundColor: 'white', m: '6px' }} />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: 100 }}>
      {icon}
      <Typography sx={{ 
        mt: 1, 
        fontSize: '0.85rem', 
        fontWeight: active ? 700 : 500, 
        color: active ? '#111827' : (status === 'completed' ? '#111827' : '#9CA3AF') 
      }}>
        {label}
      </Typography>
    </Box>
  );
};

const formatTokenCount = (count) => {
  if (!count && count !== 0) return "N/A";
  if (count >= 1000) return `~${(count / 1000).toFixed(1)}k`;
  return `~${count}`;
};

const getConfidenceBadge = (score, answerText) => {
  const s = parseFloat(score || 0);
  const isFallback = answerText?.toLowerCase().includes("could not find enough information") || 
                     answerText?.toLowerCase().includes("no chunks found") ||
                     answerText?.toLowerCase().includes("please process or publish");
  
  if (isFallback) {
    return { label: 'Low', color: '#EF4444', bg: '#FEE2E2', border: '#FECACA' };
  }
  
  if (s >= 0.80) {
    return { label: 'High', color: '#16A34A', bg: '#DCFCE7', border: '#86EFAC' };
  } else if (s >= 0.50) {
    return { label: 'Medium', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
  } else {
    return { label: 'Low', color: '#EF4444', bg: '#FEE2E2', border: '#FECACA' };
  }
};

const DocumentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedDocument: doc, loading: docLoading, fetchDocumentById, processDocument, publishDocument, updateQAStatus } = useDocumentStore();
  const { askQuestion, currentAnswer, askLoading, sendFeedback } = useQAStore();
  
  const [testQuestion, setTestQuestion] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [localAnswer, setLocalAnswer] = useState(null);
  
  const [chunksModalOpen, setChunksModalOpen] = useState(false);
  const [chunksList, setChunksList] = useState([]);
  const [chunksLoading, setChunksLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDocumentById(id);
    }
  }, [id, fetchDocumentById]);

  useEffect(() => {
    if (doc?.current_version?.qa_question) {
      setTestQuestion(doc.current_version.qa_question);
    } else {
      setTestQuestion("");
    }
    if (doc?.current_version?.qa_answer) {
      setLocalAnswer({
        question: doc.current_version.qa_question,
        answer: doc.current_version.qa_answer,
        confidence_score: 1.0,
        source_chunks: doc.current_version.qa_sources || []
      });
    } else {
      setLocalAnswer(null);
    }
    
    const qaStatus = doc?.current_version?.qa_test_status || "not_tested";
    if (qaStatus === 'looks_good') {
      setFeedbackSent('up');
    } else if (qaStatus === 'needs_fix') {
      setFeedbackSent('down');
    } else {
      setFeedbackSent(null);
    }
  }, [doc]);

  const activeAnswer = currentAnswer || localAnswer;

  // Derive status from the document object
  const rawStatus = doc?.status;
  const statusStr = typeof rawStatus === 'object' && rawStatus !== null ? (rawStatus.status_name || rawStatus.name) : rawStatus;
  const status = String(statusStr || "").toLowerCase();
  
  // Get current version info
  const currentVersion = doc?.current_version;
  const fileType = currentVersion?.file_type || doc?.file_type || "TXT";
  const pageCount = currentVersion?.page_count || null;
  const tokenCount = currentVersion?.token_count || null;
  const qaTestStatus = currentVersion?.qa_test_status || "not_tested";

  const statusIdx = STATUS_ORDER.indexOf(status);

  const getStepStatus = (stepName) => {
    const stepIdx = STATUS_ORDER.indexOf(stepName);
    if (status === 'failed') return stepIdx === 0 ? 'completed' : 'pending';
    if (stepIdx < statusIdx) return 'completed';
    if (stepIdx === statusIdx) return 'current';
    return 'pending';
  };

  const getProgressWidth = () => {
    if (status === 'pending') return '0%';
    if (status === 'processing') return '33%';
    if (status === 'processed') return '66%';
    if (status === 'published') return '100%';
    return '0%';
  };

  const handleForceProcess = async () => {
    if (!id) return;
    setProcessing(true);
    setActionError(null);
    try {
      await processDocument(id);
      await fetchDocumentById(id);
    } catch (err) {
      setActionError(err?.response?.data?.detail || err?.response?.data?.message || "Failed to process document.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    setActionError(null);
    try {
      await publishDocument(id);
      await fetchDocumentById(id);
    } catch (err) {
      setActionError(err?.response?.data?.detail || err?.response?.data?.message || "Failed to publish document.");
    } finally {
      setPublishing(false);
    }
  };

  const handleAskTestQuestion = async () => {
    if (!testQuestion.trim() || !id) return;
    setFeedbackSent(null);
    setActionError(null);
    try {
      await askQuestion({ 
        question: testQuestion, 
        document_ids: [id],
        allow_unpublished: true 
      });
    } catch (err) {
      setActionError(err?.response?.data?.detail || err?.response?.data?.message || "Failed to get answer.");
    }
  };

  const handleQAApproval = async (qaStatus) => {
    if (!id) return;
    setActionError(null);
    try {
      await updateQAStatus(id, qaStatus, testQuestion, activeAnswer?.answer || "", activeAnswer?.source_chunks || []);
      setFeedbackSent(qaStatus === 'looks_good' ? 'up' : 'down');
    } catch (err) {
      setActionError(err?.response?.data?.detail || err?.response?.data?.message || "Failed to update QA status.");
    }
  };

  const handleFeedback = async (helpful) => {
    if (currentAnswer && currentAnswer.id) {
      await sendFeedback(currentAnswer.id, { helpful });
    }
  };

  const handleOpenChunks = async () => {
    setChunksModalOpen(true);
    setChunksLoading(true);
    try {
      const response = await apiClient.get(`/api/v1/documents/${id}/chunks`);
      setChunksList(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch chunks", err);
      setChunksList([]);
    } finally {
      setChunksLoading(false);
    }
  };

  if (docLoading) {
    return (
      <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!doc) {
    return (
       <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", fontFamily: "'Inter', sans-serif" }}>
          <SharedAdminSidebar activeMenu="documents" />
          <Box sx={{ flexGrow: 1, p: 4 }}>
            <Typography>Document not found.</Typography>
          </Box>
       </Box>
    );
  }

  const isProcessed = status === 'processed';
  const isPublished = status === 'published';
  const isPending = status === 'pending';
  const isProcessing = status === 'processing';
  const isFailed = status === 'failed';
  const canTest = isProcessed || isPublished;
  const canPublish = isProcessed && qaTestStatus === 'looks_good';

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", fontFamily: "'Inter', sans-serif" }}>
      <SharedAdminSidebar activeMenu="documents" />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Custom Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #E5E7EB', backgroundColor: 'white' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', color: '#6B7280', fontSize: '0.85rem', fontWeight: 500, mb: 0.5 }}>
              <Typography onClick={() => navigate('/admin/documents')} sx={{ fontSize: 'inherit', cursor: 'pointer', '&:hover': { color: '#111827' } }}>Documents</Typography>
              <ChevronRightIcon sx={{ fontSize: 16, mx: 0.5 }} />
              <Typography sx={{ fontSize: 'inherit', color: '#111827' }}>Details</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
              {doc.title || doc.filename || "Untitled Document"}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {(isPending || isFailed) && (
              <Tooltip title="Process Document">
                <Button 
                  variant="contained" 
                  startIcon={processing ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
                  onClick={handleForceProcess}
                  disabled={processing}
                  sx={{ backgroundColor: '#3B82F6', color: 'white', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3, '&:hover': { backgroundColor: '#2563EB' } }}
                >
                  {processing ? "Processing..." : "Process Document"}
                </Button>
              </Tooltip>
            )}
            <Button 
              variant="outlined" 
              startIcon={<HistoryIcon />}
              onClick={() => navigate('/admin/upload', { 
                state: { 
                  newVersionOf: id, 
                  documentTitle: doc.title,
                  categoryId: doc.category?.id,
                  currentVersionNo: doc.current_version_no,
                  tags: doc.tags
                } 
              })}
              sx={{ borderColor: '#E5E7EB', color: '#374151', textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2, backgroundColor: '#F9FAFB' }}
            >
              Upload New Version
            </Button>
            {!isPublished && (
              <Tooltip title={!canPublish ? "Test and approve the document first" : "Publish Document"}>
                <span>
                  <Button 
                    variant="contained" 
                    startIcon={publishing ? <CircularProgress size={16} color="inherit" /> : <PublishIcon />}
                    onClick={handlePublish}
                    disabled={!canPublish || publishing}
                    sx={{ 
                      backgroundColor: canPublish ? '#22C55E' : '#D1D5DB', 
                      color: 'white', 
                      textTransform: 'none', 
                      fontWeight: 600, 
                      borderRadius: 2, 
                      px: 3, 
                      '&:hover': { backgroundColor: canPublish ? '#16A34A' : '#D1D5DB' },
                      '&.Mui-disabled': { backgroundColor: '#E5E7EB', color: '#9CA3AF' }
                    }}
                  >
                    {publishing ? "Publishing..." : "Publish Document"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ p: 4, flexGrow: 1, overflowY: 'auto' }}>

          {/* Error Alert */}
          {actionError && (
            <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 3, borderRadius: 2 }}>
              {actionError}
            </Alert>
          )}
          
          {/* Status Tracker */}
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E5E7EB', backgroundColor: 'white', mb: 4, position: 'relative' }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', letterSpacing: '0.5px', mb: 3 }}>
              DOCUMENT STATUS
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', px: 4 }}>
              {/* Connecting Line */}
              <Box sx={{ position: 'absolute', top: 14, left: 90, right: 90, height: 2, display: 'flex' }}>
                <Box sx={{ width: getProgressWidth(), height: '100%', backgroundColor: '#3B82F6', transition: 'width 0.5s ease' }} />
                <Box sx={{ flexGrow: 1, height: '100%', backgroundColor: '#E5E7EB' }} />
              </Box>

              <StatusStep label="Pending" status={getStepStatus('pending')} active={isPending} />
              <StatusStep label="Processing" status={getStepStatus('processing')} active={isProcessing} />
              <StatusStep label="Processed" status={getStepStatus('processed')} active={isProcessed} />
              <StatusStep label="Published" status={getStepStatus('published')} active={isPublished} />
              {isFailed && (
                <StatusStep label="Failed" status="current" active={true} />
              )}
            </Box>
          </Paper>

          {/* Cards Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Metadata Card */}
            <Grid item xs={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', backgroundColor: 'white', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827' }}>Metadata</Typography>
                  <Chip icon={<CheckCircleIcon sx={{ fontSize: '1rem !important' }} />} label="Active" size="small" sx={{ backgroundColor: '#ECFDF5', color: '#10B981', fontWeight: 600, border: '1px solid #A7F3D0' }} />
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>Document ID</Typography>
                    <Typography sx={{ fontSize: '0.95rem', color: '#111827', fontWeight: 500 }}>{doc.id}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500, mb: 0.5 }}>Category</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderOutlinedIcon sx={{ fontSize: 18, color: '#6B7280' }} />
                      <Typography sx={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>{doc.category?.name || "Uncategorized"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>Version</Typography>
                    <Typography sx={{ fontSize: '0.95rem', color: '#111827', fontWeight: 500 }}>{currentVersion?.version_label || `v${doc.current_version_no}.0`}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500, mb: 0.5 }}>Uploaded By</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', backgroundColor: '#3B82F6', fontWeight: 600 }}>{doc.uploader?.name ? doc.uploader.name[0] : "A"}</Avatar>
                      <Typography sx={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>{doc.uploader?.name || "Admin"}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500 }}>Upload Date</Typography>
                    <Typography sx={{ fontSize: '0.95rem', color: '#111827', fontWeight: 500 }}>{formatDate(doc.created_at)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500, mb: 0.5 }}>Tags</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {parseTags(doc.tags).map((tag, i) => (
                        <Chip key={i} label={String(tag).toUpperCase()} size="small" sx={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontWeight: 600, fontSize: '0.75rem' }} />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Right Column (File Type + Stats + QA Testing) */}
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #E5E7EB', backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ backgroundColor: '#F3F4F6', p: 1.5, borderRadius: 2, color: '#4B5563', display: 'flex' }}>
                    <InsertDriveFileOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>File Type</Typography>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>{fileType}</Typography>
                  </Box>
                </Paper>
                
                <Paper elevation={0} sx={{ flex: 1, p: 2.5, borderRadius: 3, border: '1px solid #E5E7EB', backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ backgroundColor: '#F3F4F6', p: 1.5, borderRadius: 2, color: '#4B5563', display: 'flex' }}>
                    <FormatListNumberedOutlinedIcon />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>Tokens Processed</Typography>
                    <Tooltip title="Total tokens processed by AI">
                      <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', cursor: 'help', display: 'inline-block', borderBottom: '1px dotted #9CA3AF' }}>
                        {formatTokenCount(tokenCount)}
                      </Typography>
                    </Tooltip>
                  </Box>
                </Paper>
              </Box>

              {isProcessed || isPublished ? (
                <Box sx={{ mb: 3 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<FormatListNumberedOutlinedIcon />}
                    onClick={handleOpenChunks}
                    sx={{ borderColor: '#E5E7EB', color: '#374151', textTransform: 'none', fontWeight: 600, borderRadius: 2, backgroundColor: '#F9FAFB' }}
                  >
                    View Indexed Chunks
                  </Button>
                </Box>
              ) : null}

              {/* QA Testing */}
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E5E7EB', backgroundColor: 'white', position: 'relative', opacity: canTest ? 1 : 0.6 }}>
                <Box sx={{ position: 'absolute', top: 0, right: 0, width: 250, height: 250, background: 'radial-gradient(circle at top right, #ECFDF5 0%, transparent 70%)', borderTopRightRadius: 12, opacity: 0.6, pointerEvents: 'none' }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceOutlinedIcon sx={{ color: '#10B981' }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#111827' }}>Quality Assurance Testing</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {qaTestStatus !== 'not_tested' && (
                      <Chip 
                        label={qaTestStatus === 'looks_good' ? 'Approved' : 'Needs Fix'} 
                        size="small" 
                        sx={{ 
                          backgroundColor: qaTestStatus === 'looks_good' ? '#ECFDF5' : '#FEE2E2',
                          color: qaTestStatus === 'looks_good' ? '#10B981' : '#EF4444',
                          fontWeight: 600, 
                          borderRadius: 1 
                        }} 
                      />
                    )}
                    <Chip label="Simulation Mode" size="small" sx={{ backgroundColor: '#F3F4F6', color: '#4B5563', fontWeight: 600, borderRadius: 1 }} />
                  </Box>
                </Box>
                
                {!canTest ? (
                  <Alert severity="info" sx={{ borderRadius: 2, position: 'relative', zIndex: 1 }}>
                    Process the document first before testing. Click "Process Document" above.
                  </Alert>
                ) : (
                  <>
                    <Typography sx={{ color: '#4B5563', fontSize: '0.95rem', mb: 3, position: 'relative', zIndex: 1 }}>
                      Ask a question specifically about this document to test the current embedding and retrieval configuration before publishing.
                    </Typography>

                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <TextField 
                        fullWidth
                        multiline
                        minRows={2}
                        placeholder="e.g., What was the total revenue reported for Q3 in the EMEA region?"
                        value={testQuestion}
                        onChange={(e) => setTestQuestion(e.target.value)}
                        sx={{
                          backgroundColor: 'white',
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            pb: 6,
                            "& fieldset": { borderColor: "#E5E7EB" },
                          }
                        }}
                      />
                      <Button 
                        variant="contained" 
                        onClick={handleAskTestQuestion}
                        disabled={askLoading || !testQuestion.trim()}
                        startIcon={askLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeOutlinedIcon />}
                        sx={{ 
                          position: 'absolute',
                          bottom: 12,
                          right: 12,
                          backgroundColor: '#E5E7EB', 
                          color: '#374151', 
                          textTransform: 'none', 
                          fontWeight: 600, 
                          borderRadius: 1.5, 
                          px: 2,
                          boxShadow: 'none',
                          '&:hover': { backgroundColor: '#D1D5DB', boxShadow: 'none' },
                          '&.Mui-disabled': { backgroundColor: '#F3F4F6', color: '#9CA3AF' }
                        }}
                      >
                        {askLoading ? "Analyzing..." : "Ask Test Question"}
                      </Button>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* User Question */}
          {activeAnswer && (
            <Paper elevation={0} sx={{ display: "flex", flexDirection: "column", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden", backgroundColor: "white", mb: 4, flexShrink: 0 }}>
              
              {/* White top section: Question and AI Answer */}
              <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
                {/* User Question Row */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      fontSize: "0.8rem", 
                      fontWeight: 700, 
                      backgroundColor: "#E5E7EB", 
                      color: "#4B5563" 
                    }}
                  >
                    AD
                  </Avatar>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>
                    {activeAnswer.question || testQuestion}
                  </Typography>
                </Box>

                {/* AI Response Block */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "stretch" }}>
                  {/* Left Column: Sparkle Icon + Vertical Line */}
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Box sx={{ backgroundColor: "#10B981", color: "white", p: 0.5, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                      <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ width: "2px", backgroundColor: "#10B981", flexGrow: 1, my: 1 }} />
                  </Box>

                  {/* Right Column: AI Analysis details */}
                  <Box sx={{ flexGrow: 1, pl: 0.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, pt: 0.5 }}>
                      <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#10B981" }}>AI Analysis</Typography>
                      {(() => {
                        const badge = getConfidenceBadge(activeAnswer.confidence_score, activeAnswer.answer);
                        return (
                          <Chip 
                            icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: badge.color, ml: 1, mr: -0.5 }} />}
                            label={`Confidence: ${badge.label} (${parseFloat(activeAnswer.confidence_score || 0).toFixed(2)})`} 
                            size="small" 
                            sx={{ 
                              backgroundColor: badge.bg, 
                              color: badge.color, 
                              fontWeight: 600, 
                              border: `1px solid ${badge.border}`,
                              "& .MuiChip-icon": { color: "inherit" }
                            }} 
                          />
                        );
                      })()}
                    </Box>

                    <Typography sx={{ fontSize: "0.95rem", color: "#374151", lineHeight: 1.65, mb: 2, whiteSpace: "pre-wrap" }}>
                      {activeAnswer.answer}
                    </Typography>

                    {/* Feedback and Copy Buttons */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Button 
                          size="small"
                          variant="outlined" 
                          onClick={() => handleQAApproval('looks_good')}
                          startIcon={<ThumbUpOutlinedIcon sx={{ color: feedbackSent === 'up' ? "white" : "#10B981" }} />}
                          sx={{ 
                            borderColor: feedbackSent === 'up' ? "#10B981" : "#E5E7EB", 
                            color: feedbackSent === 'up' ? "white" : "#374151", 
                            backgroundColor: feedbackSent === 'up' ? "#10B981" : "transparent",
                            textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2, py: 0.5, 
                            "&:hover": { backgroundColor: feedbackSent === 'up' ? "#10B981" : "#ECFDF5", borderColor: "#A7F3D0" } 
                          }}
                        >
                          Helpful
                        </Button>
                        <Button 
                          size="small"
                          variant="outlined" 
                          onClick={() => handleQAApproval('needs_fix')}
                          startIcon={<ThumbDownOutlinedIcon sx={{ color: feedbackSent === 'down' ? "white" : "#EF4444" }} />}
                          sx={{ 
                            borderColor: feedbackSent === 'down' ? "#EF4444" : "#E5E7EB", 
                            color: feedbackSent === 'down' ? "white" : "#374151", 
                            backgroundColor: feedbackSent === 'down' ? "#EF4444" : "transparent",
                            textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2, py: 0.5, 
                            "&:hover": { backgroundColor: feedbackSent === 'down' ? "#EF4444" : "#FEE2E2", borderColor: "#FECACA" } 
                          }}
                        >
                          Not Helpful
                        </Button>
                      </Box>
                      <Button 
                        size="small"
                        variant="outlined" 
                        onClick={() => { 
                          navigator.clipboard.writeText(activeAnswer.answer);
                          // Optional: could show a snackbar here, but the component does not have it locally
                        }}
                        startIcon={<FileCopyOutlinedIcon sx={{ fontSize: 14, color: "#4B5563" }} />}
                        sx={{ 
                          borderColor: "#E5E7EB", 
                          color: "#374151", 
                          textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2, py: 0.5, 
                          "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" } 
                        }}
                      >
                        Copy
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Gray bottom section: Sources Used */}
              {(activeAnswer.source_chunks && activeAnswer.source_chunks.length > 0) || activeAnswer.is_unanswered || activeAnswer.isUnanswered ? (
                <>
                  <Divider />
                  <Box sx={{ backgroundColor: "#F9FAFB", p: 3, py: 2.5 }}>
                    {activeAnswer.source_chunks && activeAnswer.source_chunks.length > 0 && !activeAnswer.is_unanswered && !activeAnswer.isUnanswered ? (
                      <SourceChunksSection sources={activeAnswer.source_chunks} />
                    ) : (
                      <Box>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#6B7280", mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Sources Used
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6B7280", fontStyle: "italic" }}>
                      No sources found for this answer.
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          ) : null}


            </Paper>
          )}
        </Box>
      </Box>

      {/* Indexed Chunks Modal */}
      <Dialog open={chunksModalOpen} onClose={() => setChunksModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Indexed Chunks</DialogTitle>
        <DialogContent dividers>
          {chunksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : chunksList.length === 0 ? (
            <Typography>No chunks found for this document version.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {chunksList.map((chunk) => (
                <Paper key={chunk.id} elevation={0} sx={{ p: 2, border: '1px solid #E5E7EB', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Chunk #{chunk.chunk_no}</Typography>
                    <Chip 
                      label={chunk.has_embedding ? "Embedded" : "No Embedding"} 
                      size="small"
                      color={chunk.has_embedding ? "success" : "default"}
                    />
                  </Box>
                  <Typography sx={{ fontSize: '0.85rem', color: '#4B5563', whiteSpace: 'pre-wrap' }}>
                    {chunk.chunk_text}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChunksModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentDetailsPage;
