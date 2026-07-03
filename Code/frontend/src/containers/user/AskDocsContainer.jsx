import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, TextField, IconButton, Paper, Chip, Divider, Tooltip, Button, Avatar, CircularProgress } from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import SendIcon from "@mui/icons-material/Send";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import DescriptionIcon from "@mui/icons-material/Description";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import useQAStore from "../../store/qaStore";
import useUIStore from "../../store/uiStore";
import useDocumentStore from "../../store/documentStore";
import useAuthStore from "../../store/authStore";
import PageHeader from "../../components/common/PageHeader";
import AppLoader from "../../components/common/AppLoader";
import { formatRelativeTime, truncateText, formatDate } from "../../utils/helpers";
import { SourceChunksSection } from "../../components/common/SourceChunkCard";

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
    return { label: 'Low Confidence', color: '#EF4444', bg: '#FEE2E2', border: '#FECACA' };
  }
  
  if (s >= 0.80) {
    return { label: 'High Confidence', color: '#16A34A', bg: '#DCFCE7', border: '#86EFAC' };
  } else if (s >= 0.50) {
    return { label: 'Medium Confidence', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
  } else {
    return { label: 'Low Confidence', color: '#EF4444', bg: '#FEE2E2', border: '#FECACA' };
  }
};

const getUserInitials = (user) => {
  const name = user?.name || user?.full_name || user?.username || user?.email || "User";
  if (name.includes("@")) {
    return name.charAt(0).toUpperCase();
  }
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

const AskDocsContainer = () => {
  const { askQuestion, sendFeedback, askLoading, createSession, clearAnswer } = useQAStore();
  const { fetchDocumentById, selectedDocument, loading: docLoading, clearSelected } = useDocumentStore();
  const { user: currentUser } = useAuthStore();
  const { openSnackbar } = useUIStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const documentId = searchParams.get("document_id");

  const [question, setQuestion] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (documentId) {
      localStorage.setItem("last_selected_document_id", documentId);
      fetchDocumentById(documentId).catch(() => {
        openSnackbar("Failed to load selected document", "error");
      });
    } else {
      const storedId = localStorage.getItem("last_selected_document_id");
      if (storedId) {
        navigate(`/user/ask?document_id=${storedId}`, { replace: true });
      } else {
        clearSelected();
      }
    }
  }, [documentId, fetchDocumentById, clearSelected, openSnackbar, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, askLoading]);

  const handleAsk = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim() || askLoading) return;

    const userMsg = { type: "user", text: question, timestamp: new Date().toISOString() };
    setChatHistory((prev) => [...prev, userMsg]);
    const currentQuestion = question;
    setQuestion("");

    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const session = await createSession({ title: truncateText(currentQuestion, 50) });
        activeSessionId = session.id;
        setSessionId(activeSessionId);
      }

      const payload = { question: currentQuestion, session_id: activeSessionId };
      if (documentId) {
        payload.document_ids = [documentId];
      }

      const answer = await askQuestion(payload);
      console.log("askQuestion answer:", answer);
      const aiMsg = {
        type: "ai",
        id: answer.id,
        question: answer.question || currentQuestion,
        text: answer.answer,
        confidence: answer.confidence_score,
        sources: answer.source_chunks || [],
        helpful: answer.helpful,
        isUnanswered: answer.is_unanswered,
        timestamp: answer.created_at,
      };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = { 
        type: "error", 
        text: err.response?.data?.detail || err.response?.data?.message || "Failed to get answer" 
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    }
  };

  const handleFeedback = async (messageId, helpful) => {
    try {
      await sendFeedback(messageId, { helpful });
      setChatHistory((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, helpful } : msg));
      openSnackbar(`Feedback recorded: ${helpful ? "Helpful" : "Not helpful"}`, "success");
    } catch {
      openSnackbar("Failed to send feedback", "error");
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    openSnackbar("Answer copied to clipboard", "success");
  };

  const handleNewSession = () => {
    setSessionId(null);
    setChatHistory([]);
    clearAnswer();
  };

  const handleChangeDocument = () => {
    navigate("/user/documents");
  };

  // Safe client-side transformation of the message list into paired QA blocks
  const renderedBlocks = [];
  for (let i = 0; i < chatHistory.length; i++) {
    const msg = chatHistory[i];
    if (msg.type === "ai") {
      renderedBlocks.push({
        type: "qa",
        id: msg.id,
        question: msg.question || (chatHistory[i - 1]?.type === "user" ? chatHistory[i - 1].text : ""),
        answer: msg.text,
        confidence: msg.confidence,
        sources: msg.sources || [],
        helpful: msg.helpful,
        isUnanswered: msg.isUnanswered,
        timestamp: msg.timestamp
      });
    } else if (msg.type === "user") {
      const nextMsg = chatHistory[i + 1];
      if (!nextMsg) {
        if (askLoading) {
          renderedBlocks.push({
            type: "loading",
            question: msg.text
          });
        }
      } else if (nextMsg.type === "error") {
        renderedBlocks.push({
          type: "qa_error",
          question: msg.text,
          error: nextMsg.text
        });
      }
    }
  }

  // Redirect to browse documents if none selected
  if (!documentId) {
    return (
      <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 3 }}>
        <DescriptionIcon sx={{ fontSize: 72, color: "#9CA3AF" }} />
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", mb: 1 }}>
            No Document Selected
          </Typography>
          <Typography sx={{ color: "#6B7280", maxWidth: 400, mx: "auto" }}>
            Please select a document from the available list first to start asking questions.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={() => navigate("/user/documents")}
          sx={{ 
            backgroundColor: "#16A34A", 
            color: "white", 
            fontWeight: 600, 
            textTransform: "none",
            borderRadius: 2,
            px: 4,
            py: 1.25,
            boxShadow: "none",
            "&:hover": { backgroundColor: "#15803D", boxShadow: "none" }
          }}
        >
          Select Document
        </Button>
      </Box>
    );
  }

  const currentVersion = selectedDocument?.current_version;
  const versionLabel = currentVersion?.version_label || `Version ${selectedDocument?.current_version_no || "1.0"}`;
  const dateStr = selectedDocument ? formatDate(selectedDocument.created_at, "MMM DD, YYYY") : "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 120px)", px: 3, py: 3, maxWidth: "1200px", mx: "auto", width: "100%" }}>
      <PageHeader
        title="Ask Questions"
        subtitle="Ask anything about the documents"
        action={
          chatHistory.length > 0 ? (
            <Chip label="New Session" onClick={handleNewSession} sx={{ fontWeight: 600, cursor: "pointer", backgroundColor: "#F0FDF4", color: "#16A34A" }} />
          ) : null
        }
      />

      {/* Selected Document Card */}
      {selectedDocument && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: "12px", border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ backgroundColor: "#EFF6FF", p: 1.5, borderRadius: "8px", display: "flex" }}>
              <DescriptionIcon sx={{ color: "#3B82F6" }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, color: "#111827", fontSize: "1.05rem" }}>{selectedDocument.title}</Typography>
              <Typography sx={{ fontSize: "0.85rem", color: "#6B7280", mt: 0.5, fontWeight: 500, display: "flex", alignItems: "center" }}>
                {versionLabel} • {dateStr}
                {currentVersion?.token_count ? (
                  <>
                    &nbsp;•&nbsp;
                    <Tooltip title="Total tokens processed by AI">
                      <span style={{ borderBottom: "1px dotted #9CA3AF", cursor: "help" }}>
                        {formatTokenCount(currentVersion.token_count)} tokens
                      </span>
                    </Tooltip>
                  </>
                ) : null}
              </Typography>
            </Box>
          </Box>
          <Button onClick={handleChangeDocument} sx={{ color: "#16A34A", fontWeight: 600, textTransform: "none" }}>
            Change Document
          </Button>
        </Paper>
      )}

      {docLoading && (
        <Box sx={{ mb: 3 }}><AppLoader message="Loading document..." /></Box>
      )}

      {/* Chat Area */}
      <Box sx={{ flex: 1, mb: 3, display: "flex", flexDirection: "column", gap: 4, pr: 1 }}>
        {renderedBlocks.length === 0 && !askLoading && (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2, color: "#D1D5DB" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#16A34A" }}>
              <AutoStoriesIcon sx={{ fontSize: 32 }} />
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 500 }}>Ask a question from this document...</Typography>
            </Box>
          </Box>
        )}

        {renderedBlocks.map((block, idx) => (
          <Paper key={idx} elevation={0} sx={{ display: "flex", flexDirection: "column", borderRadius: "12px", border: "1px solid #E5E7EB", overflow: "hidden", backgroundColor: "white", flexShrink: 0 }}>
            
            {/* White top section: Question and AI Answer */}
            <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
              {/* User Question Row */}
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Avatar 
                src={currentUser?.avatar_url} 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  fontSize: "0.8rem", 
                  fontWeight: 700, 
                  backgroundColor: "#E5E7EB", 
                  color: "#4B5563" 
                }}
              >
                {getUserInitials(currentUser)}
              </Avatar>
              <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>
                {block.question}
              </Typography>
            </Box>

            {/* AI Response Block */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "stretch" }}>
              {/* Left Column: Sparkle Icon + Vertical Line */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box sx={{ backgroundColor: "#10B981", color: "white", p: 0.5, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <AutoAwesomeIcon sx={{ fontSize: 18 }} />
                </Box>
                <Box sx={{ width: "2px", backgroundColor: "#10B981", flexGrow: 1, my: 1 }} />
              </Box>

              {/* Right Column: AI Analysis details */}
              <Box sx={{ flexGrow: 1, pl: 0.5 }}>
                {block.type === "loading" ? (
                  <Box sx={{ pt: 0.5 }}>
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#10B981", mb: 2 }}>AI Analysis</Typography>
                    <AppLoader message="Thinking..." />
                  </Box>
                ) : block.type === "qa_error" ? (
                  <Box sx={{ pt: 0.5 }}>
                    <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#10B981", mb: 1.5 }}>AI Analysis</Typography>
                    <Paper sx={{ p: 2, borderRadius: "8px", backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}>
                      <Typography sx={{ fontSize: "0.95rem" }}>{block.error}</Typography>
                    </Paper>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, pt: 0.5 }}>
                      <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#10B981" }}>AI Analysis</Typography>
                      {(() => {
                        const badge = getConfidenceBadge(block.confidence, block.answer);
                        return (
                          <Chip 
                            icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: badge.color, ml: 1, mr: -0.5 }} />}
                            label={badge.label} 
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
                      {block.answer}
                    </Typography>

                    {/* Feedback and Copy Buttons */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Button 
                          size="small"
                          variant="outlined" 
                          onClick={() => handleFeedback(block.id, true)}
                          startIcon={<ThumbUpOutlinedIcon sx={{ color: block.helpful === true ? "white" : "#10B981" }} />}
                          sx={{ 
                            borderColor: block.helpful === true ? "#10B981" : "#E5E7EB", 
                            color: block.helpful === true ? "white" : "#374151", 
                            backgroundColor: block.helpful === true ? "#10B981" : "transparent",
                            textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2, py: 0.5, 
                            "&:hover": { backgroundColor: block.helpful === true ? "#10B981" : "#ECFDF5", borderColor: "#A7F3D0" } 
                          }}
                        >
                          Helpful
                        </Button>
                        <Button 
                          size="small"
                          variant="outlined" 
                          onClick={() => handleFeedback(block.id, false)}
                          startIcon={<ThumbDownOutlinedIcon sx={{ color: block.helpful === false ? "white" : "#EF4444" }} />}
                          sx={{ 
                            borderColor: block.helpful === false ? "#EF4444" : "#E5E7EB", 
                            color: block.helpful === false ? "white" : "#374151", 
                            backgroundColor: block.helpful === false ? "#EF4444" : "transparent",
                            textTransform: "none", fontWeight: 600, borderRadius: 2, px: 2, py: 0.5, 
                            "&:hover": { backgroundColor: block.helpful === false ? "#EF4444" : "#FEE2E2", borderColor: "#FECACA" } 
                          }}
                        >
                          Not Helpful
                        </Button>
                      </Box>
                      <Button 
                        size="small"
                        variant="outlined" 
                        onClick={() => handleCopy(block.answer)}
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
                  </>
                )}
              </Box>
            </Box>
          </Box>

          {/* Gray bottom section: Sources Used */}
          {(block.sources && block.sources.length > 0) || block.isUnanswered ? (
            <>
              <Divider />
              <Box sx={{ backgroundColor: "#F9FAFB", p: 3, py: 2.5 }}>
                {block.sources && block.sources.length > 0 && !block.isUnanswered ? (
                  <SourceChunksSection sources={block.sources} />
                ) : (
                  <Box>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#6B7280", mb: 1, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Sources Used
                    </Typography>
                    <Typography sx={{ fontSize: "0.85rem", color: "#6B7280", fontStyle: "italic" }}>
                      No sources found
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          ) : null}
          
          </Paper>
        ))}

        <div ref={chatEndRef} />
      </Box>

      {/* Input */}
      <Box 
        component="form" 
        onSubmit={handleAsk} 
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: 1, 
          p: 2, 
          backgroundColor: "#FFFFFF", 
          borderRadius: "12px", 
          border: "1px solid #E5E7EB", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)" 
        }}
      >
        <TextField
          fullWidth
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAsk(e);
            }
          }}
          placeholder="Ask a question about this document..."
          variant="standard"
          disabled={askLoading}
          InputProps={{ disableUnderline: true, sx: { fontSize: "1rem" } }}
          multiline
          maxRows={4}
          sx={{ mb: 1.5 }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button 
            type="submit" 
            disabled={!question.trim() || askLoading} 
            variant="contained"
            endIcon={!askLoading && <SendIcon />}
            sx={{ 
              backgroundColor: "#16A34A", 
              color: "#FFFFFF", 
              borderRadius: "24px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 0.75,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#15803D", boxShadow: "none" }, 
              "&.Mui-disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" } 
            }}
          >
            {askLoading ? "Thinking..." : "Ask AI"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default AskDocsContainer;
