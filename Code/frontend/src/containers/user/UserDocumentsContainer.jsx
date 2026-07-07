//http://localhost:5173/user/documents

// Available documents list
// Search documents
// Published document cards
// Featured first document
// Category and tags display
// Document title and description
// Version display
// Created date display
// Ask Questions button
// Navigate to Ask page with document_id
// Loading state
// Empty state
// Pagination

import React, { useEffect, useState } from "react";
import { Box, Grid, Typography, Button, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useDocumentStore from "../../store/documentStore";
import AppCard from "../../components/common/AppCard";
import AppLoader from "../../components/common/AppLoader";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import SearchBar from "../../components/common/SearchBar";
import usePagination from "../../hooks/usePagination";
import useDebounce from "../../hooks/useDebounce";
import { formatDate, parseTags, truncateText } from "../../utils/helpers";
import { TablePagination } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import HistoryIcon from "@mui/icons-material/History";
import EventIcon from "@mui/icons-material/Event";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const getStatusName = (status) => {
  if (!status) return "";
  if (typeof status === "string") return status.toLowerCase();
  return String(status.status_name || status.name || "").toLowerCase();
};

const isPublishedDocument = (doc) => {
  const docStatus = getStatusName(doc.status);
  const versionStatus = getStatusName(doc.current_version?.status);

  if (docStatus && versionStatus) {
    return docStatus === "published" && versionStatus === "published";
  }

  return docStatus === "published" || versionStatus === "published";
};

const UserDocumentsContainer = () => {
  const { documents, pagination, loading, fetchPublishedDocuments } = useDocumentStore();
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPage } = usePagination();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  const getTagsArray = (tags) => {
    return parseTags(tags);
  };

  useEffect(() => {
    const params = { page, page_size: pageSize, sort_by: "created_at", sort_order: "desc" };
    if (debouncedSearch) params.search = debouncedSearch;
    fetchPublishedDocuments(params);
  }, [page, pageSize, debouncedSearch, fetchPublishedDocuments]);

  const handleAsk = (documentId) => {
    navigate(`/user/ask?document_id=${documentId}`);
  };

  return (
    <Box>
      <PageHeader 
        title="Available Documents" 
        subtitle="Access and query your organization's published knowledge base." 
        action={
          <Box sx={{ width: { xs: '100%', sm: 300 } }}>
            <SearchBar value={search} onChange={(v) => { setSearch(v); resetPage(); }} placeholder="Search documents..." />
          </Box>
        }
      />

      {loading ? <AppLoader /> : documents.length === 0 || documents.filter(isPublishedDocument).length === 0 ? (
        <EmptyState message="No documents available" icon={DescriptionIcon} />
      ) : (
        <>
          <Grid container spacing={3}>
            {documents.filter(isPublishedDocument).map((doc, index) => {
              const isFeatured = index === 0;
              return (
                <Grid item xs={12} sm={isFeatured ? 12 : 6} md={isFeatured ? 12 : 4} key={doc.id}>
                  <AppCard 
                    onClick={() => navigate(`/user/documents/${doc.id}`)}
                    sx={{ 
                    height: "100%", 
                    display: "flex", 
                    flexDirection: "column", 
                    p: isFeatured ? 4 : 3, 
                    borderRadius: "12px",
                    border: "1px solid #E5E7EB",
                    position: "relative",
                    overflow: "hidden",
                    ...(isFeatured && {
                      backgroundImage: "radial-gradient(circle at top right, rgba(22, 163, 74, 0.08) 0%, rgba(255, 255, 255, 0) 40%)",
                      backgroundColor: "#FFFFFF"
                    }),
                    cursor: "pointer",
                    "&:hover": { borderColor: "#16A34A", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" } 
                  }}>
                    
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: isFeatured ? 3 : 2, position: "relative", zIndex: 1 }}>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {doc.category && (
                          <Typography sx={{ 
                            fontSize: "0.65rem", 
                            fontWeight: 700, 
                            backgroundColor: "#F3F4F6", 
                            color: "#374151", 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: "4px", 
                            letterSpacing: "0.05em", 
                            textTransform: "uppercase" 
                          }}>
                            {doc.category.name}
                          </Typography>
                        )}
                        {getTagsArray(doc.tags).length > 0 ? (
                          getTagsArray(doc.tags).map((tag, idx) => (
                            <Typography key={idx} sx={{ 
                              fontSize: "0.65rem", 
                              fontWeight: 700, 
                              backgroundColor: "#F3F4F6", 
                              color: "#374151", 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: "4px", 
                              letterSpacing: "0.05em", 
                              textTransform: "uppercase" 
                            }}>
                              {tag}
                            </Typography>
                          ))
                        ) : (
                          <Typography sx={{ 
                            fontSize: "0.65rem", 
                            fontWeight: 700, 
                            backgroundColor: "#F3F4F6", 
                            color: "#374151", 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: "4px", 
                            letterSpacing: "0.05em", 
                            textTransform: "uppercase" 
                          }}>
                            CONFIDENTIAL
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, backgroundColor: "#DCFCE7", color: "#166534", px: 1, py: 0.5, borderRadius: "12px" }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16A34A" }} />
                        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700 }}>Published</Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant={isFeatured ? "h3" : "h5"} sx={{ 
                      fontWeight: 800, 
                      fontSize: isFeatured ? { xs: "2rem", md: "2.75rem" } : "1.25rem", 
                      color: "#111827", 
                      mb: isFeatured ? 2 : 1.5, 
                      lineHeight: 1.2,
                      position: "relative",
                      zIndex: 1,
                      maxWidth: isFeatured ? "85%" : "100%"
                    }}>
                      {isFeatured ? doc.title : truncateText(doc.title, 60)}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ 
                      color: "#4B5563", 
                      fontSize: isFeatured ? "1.1rem" : "0.85rem", 
                      mb: isFeatured ? 4 : 3, 
                      flex: 1, 
                      lineHeight: 1.6,
                      position: "relative",
                      zIndex: 1,
                      maxWidth: isFeatured ? "85%" : "100%"
                    }}>
                      {isFeatured ? (doc.description || "Comprehensive analysis of global market penetration, departmental expenditure, and projected growth vectors for the upcoming fiscal year. Includes unredacted executive summaries.") : truncateText(doc.description || "Comprehensive analysis of global market penetration, departmental expenditure, and projected growth vectors for the upcoming fiscal year. Includes unredacted executive summaries.", 150)}
                    </Typography>
                    
                    <Divider sx={{ mb: isFeatured ? 3 : 2, borderColor: "#F3F4F6", position: "relative", zIndex: 1 }} />
                    
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <HistoryIcon sx={{ fontSize: isFeatured ? 16 : 14, color: "#9CA3AF" }} />
                          <Typography variant="body2" sx={{ color: "#6B7280", fontSize: isFeatured ? "0.85rem" : "0.75rem", fontWeight: 500 }}>
                            Version {doc.current_version?.version_label || `v${doc.current_version?.version_no || doc.current_version_no || "1"}.0`}
                          </Typography>
                        </Box>
                        {isFeatured && (
                          <>
                            <Typography sx={{ color: "#D1D5DB" }}>•</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <EventIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
                              <Typography variant="body2" sx={{ color: "#6B7280", fontSize: "0.85rem", fontWeight: 500 }}>
                                {formatDate(doc.created_at, "MMM DD, YYYY")}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Box>
                      
                      {isFeatured ? (
                        <Button 
                          variant="contained" 
                          onClick={(e) => { e.stopPropagation(); handleAsk(doc.id); }}
                          sx={{ 
                            backgroundColor: "#16A34A", 
                            color: "#FFFFFF", 
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            px: 3,
                            py: 1,
                            "&:hover": { backgroundColor: "#15803D" },
                            boxShadow: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: 1
                          }}
                        >
                          <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
                          Ask Questions
                        </Button>
                      ) : (
                        <Button 
                          variant="text" 
                          onClick={(e) => { e.stopPropagation(); handleAsk(doc.id); }}
                          sx={{ 
                            color: "#16A34A", 
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            p: 0,
                            minWidth: "auto",
                            "&:hover": { backgroundColor: "transparent", color: "#15803D" },
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5
                          }}
                        >
                          Ask <ArrowForwardIcon sx={{ fontSize: 16 }} />
                        </Button>
                      )}
                    </Box>
                  </AppCard>
                </Grid>
              );
            })}
          </Grid>
          {pagination && (
            <TablePagination
              component="div"
              count={pagination.total || 0}
              page={(pagination.page || 1) - 1}
              rowsPerPage={pagination.page_size || 10}
              onPageChange={(e, newPage) => handlePageChange(newPage + 1)}
              onRowsPerPageChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[6, 12, 24]}
              sx={{ mt: 3 }}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default UserDocumentsContainer;
