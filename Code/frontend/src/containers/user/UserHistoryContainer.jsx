// http://localhost:5173/user/history

// User Q&A history list
// Search history
// Filter by document
// Question cards
// Answer preview
// Document name display
// Confidence score badge
// Validation status badge
// Sources used preview
// Helpful / Not Helpful status
// View Details button
// Question Details popup/dialog
// Full question display
// Full answer display
// Full source chunks display
// Click source chunk to view full chunk
// Loading state
// Empty state
// Pagination

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import useQAStore from "../../store/qaStore";
import useDocumentStore from "../../store/documentStore";

import SearchBar from "../../components/common/SearchBar";
import AppDialog from "../../components/common/AppDialog";
import AppCard from "../../components/common/AppCard";
import AppLoader from "../../components/common/AppLoader";
import EmptyState from "../../components/common/EmptyState";

import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDate, truncateText } from "../../utils/helpers";

import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import DescriptionIcon from "@mui/icons-material/Description";
import EventIcon from "@mui/icons-material/Event";
import HistoryIcon from "@mui/icons-material/History";

import { TablePagination } from "@mui/material";

const UserHistoryContainer = () => {
  const { messages, messagePagination, loading, fetchHistory } = useQAStore();
  const { documents, fetchDocuments } = useDocumentStore();

  const {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
  } = usePagination();

  const [search, setSearch] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [viewMsg, setViewMsg] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);

  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    fetchDocuments({
      page: 1,
      page_size: 100,
      sort_by: "title",
      sort_order: "asc",
    });
  }, [fetchDocuments]);

  useEffect(() => {
    const params = {
      page,
      page_size: pageSize,
      sort_by: "created_at",
      sort_order: "desc",
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (selectedDocumentId) {
      params.document_id = selectedDocumentId;
    }

    fetchHistory(params);
  }, [page, pageSize, debouncedSearch, selectedDocumentId, fetchHistory]);

  const getMessageDocumentName = (msg) => {
    if (msg.document?.title) return msg.document.title;
    if (msg.document_title) return msg.document_title;
    if (msg.source_document_title) return msg.source_document_title;

    if (msg.source_chunks?.[0]?.document_title) {
      return msg.source_chunks[0].document_title;
    }

    return "No document linked";
  };

  const getSourceText = (src) => {
    return src.chunk_text || src.text || src.chunk || "";
  };

  const getSourceDocumentName = (src, msg) => {
    return src.document_title || getMessageDocumentName(msg);
  };

  const openSourceChunk = (src, msg, index) => {
    setSelectedSource({
      ...src,
      display_document_title: getSourceDocumentName(src, msg),
      display_chunk_no: src.chunk_no || index + 1,
      display_text: getSourceText(src),
    });
  };

  const closeQuestionDetails = () => {
    setViewMsg(null);
    setSelectedSource(null);
  };

  return (
    <Box>
      {/* Header + Search + Filter */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 3,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#111827",
              mb: 0.5,
              letterSpacing: "-0.03em",
            }}
          >
            My History
          </Typography>

          <Typography
            sx={{
              color: "#6B7280",
              fontSize: "0.95rem",
              fontWeight: 500,
            }}
          >
            Review your past questions and answers
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            ml: "auto",
          }}
        >
          <Box sx={{ width: { xs: "100%", sm: 320 } }}>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                resetPage();
              }}
              placeholder="Search your history..."
            />
          </Box>

          <FormControl
            size="small"
            sx={{
              minWidth: 240,
              backgroundColor: "white",
              borderRadius: 2,
            }}
          >
            <InputLabel id="document-filter-label">
              Filter by Document
            </InputLabel>

            <Select
              labelId="document-filter-label"
              value={selectedDocumentId}
              label="Filter by Document"
              onChange={(e) => {
                setSelectedDocumentId(e.target.value);
                resetPage();
              }}
              sx={{
                borderRadius: 2,
                fontSize: "0.9rem",
              }}
            >
              <MenuItem value="">
                <em>All Documents</em>
              </MenuItem>

              {documents.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>
                  {doc.title || "Untitled Document"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loading ? (
        <AppLoader />
      ) : messages.length === 0 ? (
        <EmptyState message="No history available" icon={HistoryIcon} />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {messages.map((msg) => (
            <AppCard
              key={msg.id}
              sx={{
                p: 3,
                "&:hover": {
                  borderColor: "#16A34A",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: "#111827",
                    flex: 1,
                  }}
                >
                  {msg.question}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  {msg.confidence_score !== undefined && (
                    <Chip
                      label={`${(msg.confidence_score * 100).toFixed(
                        0
                      )}% Confidence`}
                      size="small"
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        backgroundColor:
                          msg.confidence_score >= 0.8
                            ? "#F0FDF4"
                            : "#FFFBEB",
                        color:
                          msg.confidence_score >= 0.8
                            ? "#16A34A"
                            : "#D97706",
                      }}
                    />
                  )}

                  {msg.validation_status && (
                    <Chip
                      label={msg.validation_status}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.65rem",
                        backgroundColor:
                          msg.validation_status === "approved"
                            ? "#F0FDF4"
                            : "#FEF2F2",
                        color:
                          msg.validation_status === "approved"
                            ? "#16A34A"
                            : "#DC2626",
                      }}
                    />
                  )}

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setViewMsg(msg)}
                    sx={{
                      color: "#374151",
                      borderColor: "#E5E7EB",
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        backgroundColor: "#F9FAFB",
                        borderColor: "#D1D5DB",
                      },
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <DescriptionIcon sx={{ fontSize: 16, color: "#6B7280" }} />

                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#4B5563",
                  }}
                >
                  {getMessageDocumentName(msg)}
                </Typography>
              </Box>

              <Typography
                sx={{
                  color: "#4B5563",
                  fontSize: "0.9rem",
                  mb: 2,
                  lineHeight: 1.5,
                }}
              >
                {truncateText(msg.answer, 200)}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  mt: "auto",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "#6B7280",
                  }}
                >
                  <EventIcon sx={{ fontSize: 16 }} />

                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                    {formatDate(msg.created_at, "MMM DD, YYYY")}
                  </Typography>
                </Box>

                {msg.source_chunks?.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.75rem", color: "#D1D5DB" }}>
                      |
                    </Typography>

                    <DescriptionIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />

                    <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>
                      Sources:
                    </Typography>

                    {Array.from(
                      new Set(
                        msg.source_chunks
                          .map((s) => s.document_title)
                          .filter(Boolean)
                      )
                    )
                      .slice(0, 2)
                      .map((title, i) => (
                        <Chip
                          key={i}
                          label={truncateText(title, 20)}
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            backgroundColor: "#F3F4F6",
                            color: "#4B5563",
                          }}
                        />
                      ))}

                    {msg.source_chunks.length > 2 && (
                      <Chip
                        label={`+${msg.source_chunks.length - 2}`}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          backgroundColor: "#F3F4F6",
                        }}
                      />
                    )}
                  </Box>
                )}

                <Box
                  sx={{
                    ml: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  {msg.helpful === true && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "#16A34A",
                      }}
                    >
                      <ThumbUpIcon sx={{ fontSize: 14 }} />

                      <Typography sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
                        Helpful
                      </Typography>
                    </Box>
                  )}

                  {msg.helpful === false && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "#DC2626",
                      }}
                    >
                      <ThumbDownIcon sx={{ fontSize: 14 }} />

                      <Typography sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
                        Not Helpful
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </AppCard>
          ))}

          {messagePagination && (
            <TablePagination
              component="div"
              count={messagePagination.total || 0}
              page={(messagePagination.page || 1) - 1}
              rowsPerPage={messagePagination.page_size || 10}
              onPageChange={(e, newPage) => handlePageChange(newPage + 1)}
              onRowsPerPageChange={(e) =>
                handlePageSizeChange(parseInt(e.target.value, 10))
              }
              rowsPerPageOptions={[5, 10, 20]}
              sx={{ mt: 2 }}
            />
          )}
        </Box>
      )}

      {/* Question Details Dialog */}
      <AppDialog
        open={!!viewMsg}
        onClose={closeQuestionDetails}
        title="Question Details"
        maxWidth="md"
      >
        {viewMsg && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
              {viewMsg.confidence_score !== undefined && (
                <Chip
                  label={`Confidence: ${(
                    viewMsg.confidence_score * 100
                  ).toFixed(0)}%`}
                  size="small"
                  sx={{
                    backgroundColor: "#F0FDF4",
                    color: "#16A34A",
                    fontWeight: 600,
                  }}
                />
              )}

              {viewMsg.validation_status && (
                <Chip
                  label={`Validation: ${viewMsg.validation_status}`}
                  size="small"
                  sx={{
                    backgroundColor:
                      viewMsg.validation_status === "approved"
                        ? "#F0FDF4"
                        : "#FEF2F2",
                    color:
                      viewMsg.validation_status === "approved"
                        ? "#16A34A"
                        : "#DC2626",
                    fontWeight: 600,
                  }}
                />
              )}

              {viewMsg.helpful !== null && viewMsg.helpful !== undefined && (
                <Chip
                  icon={
                    viewMsg.helpful ? (
                      <ThumbUpIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <ThumbDownIcon sx={{ fontSize: 14 }} />
                    )
                  }
                  label={viewMsg.helpful ? "Helpful" : "Not Helpful"}
                  size="small"
                  sx={{
                    backgroundColor: viewMsg.helpful ? "#F0FDF4" : "#FEF2F2",
                    color: viewMsg.helpful ? "#16A34A" : "#DC2626",
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                mb: 3,
                p: 1.5,
                backgroundColor: "#F9FAFB",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
              }}
            >
              <DescriptionIcon sx={{ color: "#6B7280" }} />

              <Typography sx={{ fontWeight: 600, color: "#374151" }}>
                Document: {getMessageDocumentName(viewMsg)}
              </Typography>
            </Box>

            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
                color: "#111827",
                fontSize: "1.1rem",
              }}
            >
              Question:
            </Typography>

            <Typography
              sx={{
                mb: 3,
                color: "#374151",
                fontSize: "1.05rem",
              }}
            >
              {viewMsg.question}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
                color: "#111827",
                fontSize: "1.1rem",
              }}
            >
              Answer:
            </Typography>

            <Typography
              sx={{
                mb: 4,
                color: "#374151",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
              }}
            >
              {viewMsg.answer}
            </Typography>

            {viewMsg.source_chunks?.length > 0 && (
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    mb: 1.5,
                    fontSize: "0.85rem",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Sources Used:
                </Typography>

                <Grid container spacing={2}>
                  {viewMsg.source_chunks.map((src, i) => {
                    const sourceText = getSourceText(src);

                    return (
                      <Grid item xs={12} sm={6} key={src.chunk_id || i}>
                        <Box
                          onClick={() => openSourceChunk(src, viewMsg, i)}
                          sx={{
                            p: 2,
                            border: "1px solid #E5E7EB",
                            borderRadius: "8px",
                            height: "100%",
                            backgroundColor: "#F9FAFB",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              backgroundColor: "#F0FDF4",
                              borderColor: "#16A34A",
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <DescriptionIcon
                              sx={{ fontSize: 16, color: "#9CA3AF" }}
                            />

                            <Typography
                              sx={{
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: "#111827",
                              }}
                              noWrap
                            >
                              {getSourceDocumentName(src, viewMsg)}
                            </Typography>
                          </Box>

                          <Typography
                            sx={{
                              fontSize: "0.7rem",
                              color: "#6B7280",
                              mb: 1,
                              fontWeight: 600,
                            }}
                          >
                            Chunk {src.chunk_no || i + 1} • Click to view full text
                          </Typography>

                          {sourceText ? (
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                color: "#4B5563",
                                fontStyle: "italic",
                                lineHeight: 1.5,
                                display: "-webkit-box",
                                WebkitLineClamp: 5,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              "{sourceText}"
                            </Typography>
                          ) : (
                            <Typography
                              sx={{
                                fontSize: "0.8rem",
                                color: "#9CA3AF",
                                fontStyle: "italic",
                              }}
                            >
                              No chunk text available
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </AppDialog>

      {/* Source Chunk Full View Dialog */}
      <AppDialog
        open={!!selectedSource}
        onClose={() => setSelectedSource(null)}
        title="Source Chunk"
        maxWidth="md"
      >
        {selectedSource && (
          <Box>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                mb: 3,
                p: 1.5,
                backgroundColor: "#F9FAFB",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
              }}
            >
              <DescriptionIcon sx={{ color: "#6B7280" }} />

              <Box>
                <Typography sx={{ fontWeight: 700, color: "#111827" }}>
                  {selectedSource.display_document_title}
                </Typography>

                <Typography sx={{ fontSize: "0.8rem", color: "#6B7280" }}>
                  Chunk {selectedSource.display_chunk_no}
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                fontWeight: 700,
                mb: 1,
                color: "#111827",
                fontSize: "1rem",
              }}
            >
              Chunk Text:
            </Typography>

            <Box
              sx={{
                p: 2,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                maxHeight: "60vh",
                overflowY: "auto",
              }}
            >
              <Typography
                sx={{
                  color: "#374151",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  fontSize: "0.95rem",
                }}
              >
                {selectedSource.display_text || "No chunk text available"}
              </Typography>
            </Box>
          </Box>
        )}
      </AppDialog>
    </Box>
  );
};

export default UserHistoryContainer;