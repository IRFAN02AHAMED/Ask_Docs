import React, { useState } from "react";
import { Box, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import { useNavigate } from "react-router-dom";


const SourceChunkCard = ({ source, onClick }) => {
  const chunk = source.chunk || source.document_chunk || source;
  const version = chunk?.version;
  const document = version?.document;

  const displayName =
    document?.title ||
    document?.original_filename ||
    source?.document_title ||
    source?.file_name ||
    "Unknown Document";

  const chunkText =
    chunk?.chunk_text ||
    source?.chunk_text ||
    source?.text ||
    "";

  const pageLabel =
    chunk?.page_no
      ? `Pg ${chunk.page_no}`
      : chunk?.page_number
      ? `Pg ${chunk.page_number}`
      : chunk?.chunk_no
      ? `Chunk ${chunk.chunk_no}`
      : source?.chunk_no 
      ? `Chunk ${source.chunk_no}` 
      : "";

  return (
    <Paper
      onClick={() => onClick(source)}
      sx={{
        p: 2,
        border: "1px solid #E5E7EB",
        borderRadius: "10px",
        flex: "1 1 45%",
        minWidth: 220,
        maxWidth: "49%",
        boxShadow: "none",
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: "#A7F3D0",
          backgroundColor: "#FAFFFE",
        },
      }}
    >
      {/* Header row: file icon + name + page */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, overflow: "hidden", flex: 1 }}>
          <DescriptionIcon sx={{ fontSize: 16, color: "#6B7280", flexShrink: 0 }} />
          <Typography
            noWrap
            sx={{
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {displayName}
          </Typography>
        </Box>
        {pageLabel && (
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#6B7280",
              flexShrink: 0,
              ml: 1,
            }}
          >
            {pageLabel}
          </Typography>
        )}
      </Box>

      {/* Chunk text snippet */}
      {chunkText && (
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: "#4B5563",
            fontStyle: "italic",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          &quot;...{chunkText.substring(0, 200)}...&quot;
        </Typography>
      )}
    </Paper>
  );
};

/**
 * SourceChunksSection — Renders the "SOURCES USED" section with source chunk cards.
 * Pass an array of source_chunks from the QAMessageOut response.
 */
export const SourceChunksSection = ({ sources, onSourceClick }) => {
  const navigate = useNavigate();
  const [selectedSource, setSelectedSource] = useState(null);

  if (!sources || sources.length === 0) return null;

  const handleCardClick = (source) => {
    if (onSourceClick) {
      onSourceClick(source);
    } else {
      setSelectedSource(source);
    }
  };

  const handleClose = () => {
    setSelectedSource(null);
  };

  const handleGoToDocument = () => {
    if (selectedSource?.document_id) {
      const isAdmin = window.location.pathname.startsWith("/admin");
      if (isAdmin) {
        navigate(`/admin/documents/${selectedSource.document_id}`);
      } else {
        navigate(`/user/ask?document_id=${selectedSource.document_id}`);
      }
      setSelectedSource(null);
    }
  };

  const dialogDisplayName = selectedSource ? (selectedSource.file_name || selectedSource.document_title || "Source Document") : "";
  const dialogChunkText = selectedSource ? (selectedSource.chunk_text || selectedSource.text || "") : "";
  const dialogPageLabel = selectedSource && selectedSource.page_no ? `Page ${selectedSource.page_no}` : (selectedSource && selectedSource.chunk_no ? `Chunk ${selectedSource.chunk_no}` : "");

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#6B7280",
          mb: 1.5,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Sources Used
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        {sources.map((src, i) => (
          <SourceChunkCard key={src.chunk_id || i} source={src} onClick={handleCardClick} />
        ))}
      </Box>

      {/* Premium Detail Dialog */}
      <Dialog
        open={!!selectedSource}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 1,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          }
        }}
      >
        {/* Custom Header with close button */}
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, overflow: "hidden", flex: 1 }}>
            <DescriptionIcon sx={{ color: "#16A34A", fontSize: 24, flexShrink: 0 }} />
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827", lineHeight: 1.3 }} noWrap>
                {dialogDisplayName}
              </Typography>
              {dialogPageLabel && (
                <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 600, display: "block", mt: 0.25 }}>
                  {dialogPageLabel}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: "#9CA3AF", "&:hover": { color: "#4B5563" } }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Content containing full text */}
        <DialogContent dividers sx={{ borderColor: "#F3F4F6", py: 3, px: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              backgroundColor: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              maxHeight: "350px",
              overflowY: "auto",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.925rem",
                color: "#374151",
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-sans, inherit)",
              }}
            >
              {dialogChunkText}
            </Typography>
          </Paper>
        </DialogContent>

        {/* Action buttons */}
        <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
          {selectedSource?.document_id && (
            <Button
              variant="outlined"
              onClick={handleGoToDocument}
              startIcon={<LaunchIcon sx={{ fontSize: 16 }} />}
              sx={{
                borderColor: "#E5E7EB",
                color: "#4B5563",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "8px",
                px: 2.5,
                "&:hover": {
                  backgroundColor: "#F9FAFB",
                  borderColor: "#D1D5DB",
                }
              }}
            >
              Go to Document
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{
              backgroundColor: "#16A34A",
              color: "#FFFFFF",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              px: 3,
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#15803D",
                boxShadow: "none",
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SourceChunkCard;
