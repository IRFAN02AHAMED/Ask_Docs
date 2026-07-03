import React, { useEffect, useState } from "react";
import { Box, Typography, Chip, IconButton, Button, Tooltip, Grid, Divider } from "@mui/material";
import useQAStore from "../../store/qaStore";
import PageHeader from "../../components/common/PageHeader";
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
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPage } = usePagination();

  const [search, setSearch] = useState("");
  const [viewMsg, setViewMsg] = useState(null);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    const params = { page, page_size: pageSize, sort_by: "created_at", sort_order: "desc" };
    if (debouncedSearch) params.search = debouncedSearch;
    fetchHistory(params);
  }, [page, pageSize, debouncedSearch]);

  return (
    <Box>
      <PageHeader title="My History" subtitle="Review your past questions and answers" />
      <Box sx={{ mb: 4, maxWidth: 500 }}>
        <SearchBar value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Search your history..." />
      </Box>

      {loading ? (
        <AppLoader />
      ) : messages.length === 0 ? (
        <EmptyState message="No history available" icon={HistoryIcon} />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {messages.map((msg) => (
            <AppCard key={msg.id} sx={{ p: 3, "&:hover": { borderColor: "#16A34A" } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827", flex: 1 }}>
                  {msg.question}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {msg.confidence_score !== undefined && (
                    <Chip 
                      label={`${(msg.confidence_score * 100).toFixed(0)}% Confidence`} 
                      size="small" 
                      sx={{ 
                        fontSize: "0.65rem", 
                        fontWeight: 600, 
                        backgroundColor: msg.confidence_score >= 0.8 ? "#F0FDF4" : "#FFFBEB", 
                        color: msg.confidence_score >= 0.8 ? "#16A34A" : "#D97706" 
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
                        backgroundColor: msg.validation_status === "approved" ? "#F0FDF4" : "#FEF2F2", 
                        color: msg.validation_status === "approved" ? "#16A34A" : "#DC2626" 
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
                      "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Box>

              <Typography sx={{ color: "#4B5563", fontSize: "0.9rem", mb: 2, lineHeight: 1.5 }}>
                {truncateText(msg.answer, 200)}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mt: "auto" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#6B7280" }}>
                  <EventIcon sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 500 }}>
                    {formatDate(msg.created_at, "MMM DD, YYYY")}
                  </Typography>
                </Box>
                
                {msg.source_chunks?.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: "0.75rem", color: "#D1D5DB" }}>|</Typography>
                    <DescriptionIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
                    <Typography sx={{ fontSize: "0.75rem", color: "#6B7280" }}>Sources:</Typography>
                    {Array.from(new Set(msg.source_chunks.map(s => s.document_title))).slice(0, 2).map((title, i) => (
                      <Chip key={i} label={truncateText(title, 20)} size="small" sx={{ fontSize: "0.65rem", backgroundColor: "#F3F4F6", color: "#4B5563" }} />
                    ))}
                    {msg.source_chunks.length > 2 && (
                      <Chip label={`+${msg.source_chunks.length - 2}`} size="small" sx={{ fontSize: "0.65rem", backgroundColor: "#F3F4F6" }} />
                    )}
                  </Box>
                )}

                <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
                  {msg.helpful === true && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#16A34A" }}>
                      <ThumbUpIcon sx={{ fontSize: 14 }} />
                      <Typography sx={{ fontSize: "0.7rem", fontWeight: 600 }}>Helpful</Typography>
                    </Box>
                  )}
                  {msg.helpful === false && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#DC2626" }}>
                      <ThumbDownIcon sx={{ fontSize: 14 }} />
                      <Typography sx={{ fontSize: "0.7rem", fontWeight: 600 }}>Not Helpful</Typography>
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
              onRowsPerPageChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 20]}
              sx={{ mt: 2 }}
            />
          )}
        </Box>
      )}

      <AppDialog open={!!viewMsg} onClose={() => setViewMsg(null)} title="Question Details" maxWidth="md">
        {viewMsg && (
          <Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
              {viewMsg.confidence_score !== undefined && (
                <Chip label={`Confidence: ${(viewMsg.confidence_score * 100).toFixed(0)}%`} size="small" sx={{ backgroundColor: "#F0FDF4", color: "#16A34A", fontWeight: 600 }} />
              )}
              {viewMsg.validation_status && (
                <Chip label={`Validation: ${viewMsg.validation_status}`} size="small" sx={{ backgroundColor: viewMsg.validation_status === "approved" ? "#F0FDF4" : "#FEF2F2", color: viewMsg.validation_status === "approved" ? "#16A34A" : "#DC2626", fontWeight: 600 }} />
              )}
              {viewMsg.helpful !== null && viewMsg.helpful !== undefined && (
                <Chip 
                  icon={viewMsg.helpful ? <ThumbUpIcon sx={{ fontSize: 14 }} /> : <ThumbDownIcon sx={{ fontSize: 14 }} />} 
                  label={viewMsg.helpful ? "Helpful" : "Not Helpful"} 
                  size="small" 
                  sx={{ backgroundColor: viewMsg.helpful ? "#F0FDF4" : "#FEF2F2", color: viewMsg.helpful ? "#16A34A" : "#DC2626", fontWeight: 600 }} 
                />
              )}
            </Box>

            <Typography sx={{ fontWeight: 700, mb: 1, color: "#111827", fontSize: "1.1rem" }}>Question:</Typography>
            <Typography sx={{ mb: 3, color: "#374151", fontSize: "1.05rem" }}>{viewMsg.question}</Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Typography sx={{ fontWeight: 700, mb: 1, color: "#111827", fontSize: "1.1rem" }}>Answer:</Typography>
            <Typography sx={{ mb: 4, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{viewMsg.answer}</Typography>
            
            {viewMsg.source_chunks?.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: "0.85rem", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sources Used:</Typography>
                <Grid container spacing={2}>
                  {viewMsg.source_chunks.map((src, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Box sx={{ p: 2, border: "1px solid #E5E7EB", borderRadius: "8px", height: "100%", backgroundColor: "#F9FAFB" }}>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                          <DescriptionIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
                          <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#111827" }} noWrap>{src.document_title}</Typography>
                        </Box>
                        {src.text && (
                          <Typography sx={{ fontSize: "0.8rem", color: "#4B5563", fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            "...{src.text}..."
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </AppDialog>
    </Box>
  );
};

export default UserHistoryContainer;
