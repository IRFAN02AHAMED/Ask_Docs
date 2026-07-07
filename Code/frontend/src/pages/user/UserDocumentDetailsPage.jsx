import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, Button, Grid, Chip, Divider, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import useDocumentStore from "../../store/documentStore";
import { formatDate, parseTags } from "../../utils/helpers";
import AppCard from "../../components/common/AppCard";
import PageHeader from "../../components/common/PageHeader";

const UserDocumentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedDocument, loading, fetchDocumentById, error, generateSummary } = useDocumentStore();

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const fetchingRef = React.useRef(false);

  useEffect(() => {
    if (id) {
      fetchDocumentById(id);
    }
  }, [id, fetchDocumentById]);

  useEffect(() => {
    if (loading || !selectedDocument) return;
    
    const doc = selectedDocument;
    const currentVersion = doc.current_version || {};
    const dbSummary = doc.summary || currentVersion.summary || currentVersion.extracted_summary;
    const fallbackSummary = doc.description || "No summary available for this document.";

    if (dbSummary && dbSummary !== "No summary available for this document.") {
      setSummary(dbSummary);
      localStorage.setItem(`doc_summary_${id}`, dbSummary);
      return;
    }

    const cached = localStorage.getItem(`doc_summary_${id}`);
    if (cached && cached !== "No summary available for this document.") {
      setSummary(cached);
      return;
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError("");
      try {
        const newSummary = await generateSummary(id);
        if (newSummary) {
          setSummary(newSummary);
          localStorage.setItem(`doc_summary_${id}`, newSummary);
        } else {
          setSummary(fallbackSummary);
        }
      } catch (err) {
        console.error("Failed to generate summary:", err);
        setSummaryError("Unable to generate summary. Please try again.");
        setSummary(fallbackSummary);
      } finally {
        setSummaryLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchSummary();
  }, [selectedDocument, loading, id, generateSummary]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !selectedDocument) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error || "Document not found"}</Typography>
        <Button onClick={() => navigate("/user/documents")} sx={{ mt: 2 }}>
          Back to Documents
        </Button>
      </Box>
    );
  }

  const doc = selectedDocument;
  const currentVersion = doc.current_version || {};
  const tags = parseTags(doc.tags);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/user/documents")}
          sx={{ color: "#4B5563", textTransform: "none", fontWeight: 600 }}
        >
          Back to Documents
        </Button>
      </Box>

      <PageHeader 
        title={doc.title} 
        subtitle="View document details and query its contents."
      />

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <AppCard sx={{ p: { xs: 3, md: 4 }, borderRadius: "12px", border: "1px solid #E5E7EB" }}>
            <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
              {doc.category && (
                <Chip 
                  label={doc.category.name} 
                  size="small"
                  sx={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700, borderRadius: "4px", letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.7rem" }}
                />
              )}
              {tags.map((tag, idx) => (
                <Chip 
                  key={idx}
                  label={tag} 
                  size="small"
                  sx={{ backgroundColor: "#F3F4F6", color: "#374151", fontWeight: 700, borderRadius: "4px", letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.7rem" }}
                />
              ))}
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: "#111827" }}>
              Document Summary
            </Typography>
            {summaryLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: "#4B5563" }}>
                <CircularProgress size={20} />
                <Typography>Generating summary via AI...</Typography>
              </Box>
            ) : summaryError ? (
              <Box>
                <Typography color="error" sx={{ mb: 1 }}>{summaryError}</Typography>
                <Typography sx={{ color: "#374151", lineHeight: 1.7, fontSize: "1.05rem", whiteSpace: "pre-wrap" }}>
                  {summary}
                </Typography>
              </Box>
            ) : (
              <Typography sx={{ color: "#374151", lineHeight: 1.7, fontSize: "1.05rem", whiteSpace: "pre-wrap" }}>
                {summary}
              </Typography>
            )}

            {doc.description && doc.description !== summary && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "#111827" }}>
                  Description
                </Typography>
                <Typography sx={{ color: "#4B5563", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {doc.description}
                </Typography>
              </>
            )}
          </AppCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <AppCard sx={{ p: 3, borderRadius: "12px", border: "1px solid #E5E7EB", mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: "#111827" }}>
              Metadata
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, textTransform: "uppercase", display: 'block', mb: 0.5 }}>
                  Status
                </Typography>
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, backgroundColor: "#DCFCE7", color: "#166534", px: 1, py: 0.5, borderRadius: "12px" }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16A34A" }} />
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>Published</Typography>
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, textTransform: "uppercase", display: 'block', mb: 0.5 }}>
                  Version
                </Typography>
                <Typography sx={{ fontWeight: 500, color: "#111827" }}>
                  {currentVersion.version_label || `v${currentVersion.version_no || doc.current_version_no || "1"}.0`}
                </Typography>
              </Box>

              {currentVersion.file_type && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, textTransform: "uppercase", display: 'block', mb: 0.5 }}>
                    File Type
                  </Typography>
                  <Typography sx={{ fontWeight: 500, color: "#111827", textTransform: "uppercase" }}>
                    {currentVersion.file_type.replace(".", "")}
                  </Typography>
                </Box>
              )}

              {currentVersion.token_count && (
                <Box>
                  <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, textTransform: "uppercase", display: 'block', mb: 0.5 }}>
                    Token Count
                  </Typography>
                  <Typography sx={{ fontWeight: 500, color: "#111827" }}>
                    {currentVersion.token_count.toLocaleString()} tokens
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, textTransform: "uppercase", display: 'block', mb: 0.5 }}>
                  Uploaded Date
                </Typography>
                <Typography sx={{ fontWeight: 500, color: "#111827" }}>
                  {formatDate(doc.created_at, "MMM DD, YYYY")}
                </Typography>
              </Box>
            </Box>
          </AppCard>

          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate(`/user/ask?document_id=${doc.id}`)}
            startIcon={<ChatBubbleOutlineIcon />}
            sx={{
              backgroundColor: "#16A34A",
              color: "#FFFFFF",
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
              py: 1.5,
              "&:hover": { backgroundColor: "#15803D" },
              boxShadow: "none"
            }}
          >
            Ask Questions
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDocumentDetailsPage;
