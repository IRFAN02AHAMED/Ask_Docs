import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Tooltip,
  Alert,
} from "@mui/material";
import useUIStore from "../../store/uiStore";
import { SharedAdminSidebar } from "../../components/layout/SharedLayout";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FormatListNumberedOutlinedIcon from "@mui/icons-material/FormatListNumberedOutlined";
import HistoryIcon from "@mui/icons-material/History";
import PublishIcon from "@mui/icons-material/Publish";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { useParams, useNavigate } from "react-router-dom";
import useDocumentStore from "../../store/documentStore";
import useQAStore from "../../store/qaStore";
import apiClient from "../../services/apiClient";

// Extracted Components & Helpers
import DocumentStatusTracker from "../../components/documents/DocumentStatusTracker";
import DocumentMetadataCard from "../../components/documents/DocumentMetadataCard";
import DocumentInfoStatCard from "../../components/documents/DocumentInfoStatCard";
import DocumentQATestingCard from "../../components/documents/DocumentQATestingCard";
import DocumentAIAnswerCard from "../../components/documents/DocumentAIAnswerCard";
import IndexedChunksDialog from "../../components/documents/IndexedChunksDialog";
import VersionHistoryDialog from "../../components/documents/VersionHistoryDialog";

import {
  formatTokenCount,
  parseDocumentStatus,
  getVersionLabel,
} from "../../utils/documentHelpers";

const DocumentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useUIStore();

  const {
    selectedDocument: doc,
    loading: docLoading,
    fetchDocumentById,
    processDocument,
    publishDocument,
    updateQAStatus,
  } = useDocumentStore();

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

  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  const [versionsList, setVersionsList] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

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
        source_chunks: doc.current_version.qa_sources || [],
      });
    } else {
      setLocalAnswer(null);
    }

    const qaStatus = doc?.current_version?.qa_test_status || "not_tested";

    if (qaStatus === "looks_good") {
      setFeedbackSent("up");
    } else if (qaStatus === "needs_fix") {
      setFeedbackSent("down");
    } else {
      setFeedbackSent(null);
    }
  }, [doc]);

  const activeAnswer = currentAnswer || localAnswer;

  const status = parseDocumentStatus(doc?.status);

  const currentVersion = doc?.current_version;
  const fileType = currentVersion?.file_type || doc?.file_type || "TXT";
  const tokenCount = currentVersion?.token_count || null;
  const qaTestStatus = currentVersion?.qa_test_status || "not_tested";

  const versionLabel = getVersionLabel(currentVersion, doc);

  const handleForceProcess = async () => {
    if (!id) return;

    setProcessing(true);
    setActionError(null);

    try {
      await processDocument(id);
      await fetchDocumentById(id);
    } catch (err) {
      setActionError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to process document."
      );
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
      setActionError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to publish document."
      );
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
        allow_unpublished: true,
      });
    } catch (err) {
      setActionError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to get answer."
      );
    }
  };

  const handleQAApproval = async (qaStatus) => {
    if (!id) return;

    setActionError(null);

    try {
      await updateQAStatus(
        id,
        qaStatus,
        testQuestion,
        activeAnswer?.answer || "",
        activeAnswer?.source_chunks || []
      );

      setFeedbackSent(qaStatus === "looks_good" ? "up" : "down");

      await fetchDocumentById(id);
    } catch (err) {
      setActionError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to update QA status."
      );
    }
  };

  const handleFeedback = async (helpful) => {
    if (currentAnswer && currentAnswer.id) {
      await sendFeedback(currentAnswer.id, { helpful });
    }
  };

  const handleCopy = async (text) => {
    try {
      if (!text) {
        openSnackbar("No answer text to copy", "warning");
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      openSnackbar("Answer copied to clipboard", "success");
    } catch (err) {
      console.error("Copy failed:", err);
      openSnackbar("Failed to copy answer", "error");
    }
  };

  const handleOpenChunks = async () => {
    setChunksModalOpen(true);
    setChunksLoading(true);

    try {
      const response = await apiClient.get(`/api/v1/documents/${id}/chunks`);

      const chunks = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.data?.items)
        ? response.data.data.items
        : [];

      setChunksList(chunks);
    } catch (err) {
      console.error("Failed to fetch chunks", err);
      setChunksList([]);
      setActionError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to fetch indexed chunks."
      );
    } finally {
      setChunksLoading(false);
    }
  };

  const handleOpenVersions = async () => {
    setVersionsModalOpen(true);
    setVersionsLoading(true);

    try {
      const response = await apiClient.get(`/api/v1/documents/${id}/versions`);

      const versions = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.data?.items)
        ? response.data.data.items
        : [];

      console.log("Versions API response:", response.data);
      console.log("Versions final list:", versions);

      setVersionsList(versions);
    } catch (err) {
      console.error("Failed to fetch document versions", err);
      setVersionsList([]);
      setActionError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to fetch document versions."
      );
    } finally {
      setVersionsLoading(false);
    }
  };

  if (docLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          backgroundColor: "#FAFAFA",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!doc) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          backgroundColor: "#FAFAFA",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <SharedAdminSidebar activeMenu="documents" />

        <Box sx={{ flexGrow: 1, p: 4 }}>
          <Typography>Document not found.</Typography>
        </Box>
      </Box>
    );
  }

  const isProcessed = status === "processed";
  const isPublished = status === "published";
  const isPending = status === "pending";
  const isFailed = status === "failed";

  const canTest = isProcessed || isPublished;
  const canPublish = isProcessed && qaTestStatus === "looks_good";

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#FAFAFA",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <SharedAdminSidebar activeMenu="documents" />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 3,
            borderBottom: "1px solid #E5E7EB",
            backgroundColor: "white",
          }}
        >
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                color: "#6B7280",
                fontSize: "0.85rem",
                fontWeight: 500,
                mb: 0.5,
              }}
            >
              <Typography
                onClick={() => navigate("/admin/documents")}
                sx={{
                  fontSize: "inherit",
                  cursor: "pointer",
                  "&:hover": { color: "#111827" },
                }}
              >
                Documents
              </Typography>

              <ChevronRightIcon sx={{ fontSize: 16, mx: 0.5 }} />

              <Typography sx={{ fontSize: "inherit", color: "#111827" }}>
                Details
              </Typography>
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
              {doc.title || doc.filename || "Untitled Document"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {(isPending || isFailed) && (
              <Tooltip title="Process Document">
                <Button
                  variant="contained"
                  startIcon={
                    processing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PlayArrowIcon />
                    )
                  }
                  onClick={handleForceProcess}
                  disabled={processing}
                  sx={{
                    backgroundColor: "#3B82F6",
                    color: "white",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    "&:hover": { backgroundColor: "#2563EB" },
                  }}
                >
                  {processing ? "Processing..." : "Process Document"}
                </Button>
              </Tooltip>
            )}

            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={handleOpenVersions}
              sx={{
                borderColor: "#E5E7EB",
                color: "#374151",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
                backgroundColor: "#F9FAFB",
              }}
            >
              View Versions
            </Button>

            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() =>
                navigate("/admin/upload", {
                  state: {
                    newVersionOf: id,
                    documentTitle: doc.title,
                    categoryId: doc.category?.id,
                    currentVersionNo: doc.current_version_no,
                    tags: doc.tags,
                  },
                })
              }
              sx={{
                borderColor: "#E5E7EB",
                color: "#374151",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
                backgroundColor: "#F9FAFB",
              }}
            >
              Upload New Version
            </Button>

            {!isPublished && (
              <Tooltip
                title={
                  !canPublish
                    ? "Test and approve the document first"
                    : "Publish Document"
                }
              >
                <span>
                  <Button
                    variant="contained"
                    startIcon={
                      publishing ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <PublishIcon />
                      )
                    }
                    onClick={handlePublish}
                    disabled={!canPublish || publishing}
                    sx={{
                      backgroundColor: canPublish ? "#22C55E" : "#D1D5DB",
                      color: "white",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      "&:hover": {
                        backgroundColor: canPublish ? "#16A34A" : "#D1D5DB",
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "#E5E7EB",
                        color: "#9CA3AF",
                      },
                    }}
                  >
                    {publishing ? "Publishing..." : "Publish Document"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ p: 4, flexGrow: 1, overflowY: "auto" }}>
          {actionError && (
            <Alert
              severity="error"
              onClose={() => setActionError(null)}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {actionError}
            </Alert>
          )}

          {/* Status Tracker */}
          <DocumentStatusTracker status={status} />

          {/* Cards Row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Metadata Card */}
            <Grid item xs={6}>
              <DocumentMetadataCard doc={doc} versionLabel={versionLabel} />
            </Grid>

            {/* Right Column */}
            <Grid item xs={6}>
              <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
                <DocumentInfoStatCard
                  icon={<InsertDriveFileOutlinedIcon />}
                  label="File Type"
                  value={fileType}
                  uppercase={true}
                />

                <DocumentInfoStatCard
                  icon={<FormatListNumberedOutlinedIcon />}
                  label="Tokens Processed"
                  value={formatTokenCount(tokenCount)}
                  tooltip="Total tokens processed by AI"
                />
              </Box>

              {(isProcessed || isPublished) && (
                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<FormatListNumberedOutlinedIcon />}
                    onClick={handleOpenChunks}
                    sx={{
                      borderColor: "#E5E7EB",
                      color: "#374151",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      backgroundColor: "#F9FAFB",
                    }}
                  >
                    View Indexed Chunks
                  </Button>
                </Box>
              )}

              {/* QA Testing */}
              <DocumentQATestingCard
                canTest={canTest}
                qaTestStatus={qaTestStatus}
                testQuestion={testQuestion}
                setTestQuestion={setTestQuestion}
                askLoading={askLoading}
                handleAskTestQuestion={handleAskTestQuestion}
              />
            </Grid>
          </Grid>

          {/* AI Answer */}
          <DocumentAIAnswerCard
            activeAnswer={activeAnswer}
            testQuestion={testQuestion}
            feedbackSent={feedbackSent}
            handleQAApproval={handleQAApproval}
            handleCopy={handleCopy}
          />
        </Box>
      </Box>

      {/* Modals */}
      <IndexedChunksDialog
        open={chunksModalOpen}
        onClose={() => setChunksModalOpen(false)}
        chunksLoading={chunksLoading}
        chunksList={chunksList}
      />

      <VersionHistoryDialog
        open={versionsModalOpen}
        onClose={() => setVersionsModalOpen(false)}
        versionsLoading={versionsLoading}
        versionsList={versionsList}
      />
    </Box>
  );
};

export default DocumentDetailsPage;