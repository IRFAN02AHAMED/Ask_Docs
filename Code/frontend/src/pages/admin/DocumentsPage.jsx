import React, { useEffect, useState } from "react";
import { 
  Box, Typography, Button, Paper, Grid, Chip, InputBase, CircularProgress, Select, MenuItem, FormControl
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import { SharedAdminSidebar, SharedAdminHeader } from "../../components/layout/SharedLayout";
import { useNavigate, useLocation } from "react-router-dom";
import useDocumentStore from "../../store/documentStore";
import useCategoryStore from "../../store/categoryStore";
import { formatDate, parseTags, truncateText } from "../../utils/helpers";
import useDebounce from "../../hooks/useDebounce";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { documents, loading, fetchDocuments } = useDocumentStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  // Parse initial status from URL
  const searchParams = new URLSearchParams(location.search);
  const initialStatus = searchParams.get('status') || 'all';
  
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const params = { page: 1, page_size: 50, sort_by: "created_at", sort_order: "desc" };
    if (debouncedSearch) params.search = debouncedSearch;
    if (categoryFilter !== "all") params.category_id = categoryFilter;
    if (statusFilter !== "all") params.status = statusFilter; // Need backend map or just send text
    
    fetchDocuments(params);
  }, [debouncedSearch, categoryFilter, statusFilter, fetchDocuments]);

  const getStatusDisplay = (statusObj) => {
    const statusName = typeof statusObj === 'object' && statusObj !== null ? (statusObj.status_name || statusObj.name) : statusObj;
    const s = String(statusName || "pending").toLowerCase();
    
    if (s === "published" || s === "completed" || s === "success") {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#DCFCE7', px: 1.5, py: 0.5, borderRadius: 1.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>Published</Typography>
        </Box>
      );
    }
    if (s === "processing" || s === "indexing") {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#DBEAFE', px: 1.5, py: 0.5, borderRadius: 1.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2563EB' }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB' }}>Processing</Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#F3F4F6', px: 1.5, py: 0.5, borderRadius: 1.5 }}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#9CA3AF' }} />
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280' }}>Pending</Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", fontFamily: "'Inter', sans-serif" }}>
      <SharedAdminSidebar activeMenu="documents" />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="Knowledge Base" />

        <Box sx={{ px: 6, pb: 4, pt: 4, flexGrow: 1, overflowY: 'auto' }}>
          
          {/* Header Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', mb: 1, letterSpacing: '-0.5px' }}>
                Available Documents
              </Typography>
              <Typography sx={{ color: '#4B5563', fontSize: '1.05rem' }}>
                Access and query your organization's published knowledge base.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  displayEmpty
                  sx={{ backgroundColor: 'white', borderRadius: 2 }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories?.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  displayEmpty
                  sx={{ backgroundColor: 'white', borderRadius: 2 }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                backgroundColor: "white", 
                border: '1px solid #E5E7EB',
                borderRadius: 2, 
                px: 2, 
                py: 1,
                width: 280,
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <SearchIcon sx={{ color: "#9CA3AF", fontSize: 20, mr: 1 }} />
                <InputBase 
                  placeholder="Search documents..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ fontSize: "0.95rem", width: '100%' }} 
                />
              </Box>
            </Box>
          </Box>

          {/* Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 10 }}>
              <Typography sx={{ color: '#6B7280', fontSize: '1.1rem' }}>No documents found matching your criteria.</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {documents.map((doc, index) => {
                // Determine if this should be a featured card (first item, spans 2 columns on large screens)
                const isFeatured = index === 0;
                
                return (
                  <Grid item xs={12} md={isFeatured ? 12 : 6} lg={isFeatured ? 8 : 4} key={doc.id}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 4, 
                        borderRadius: 3, 
                        border: '1px solid #E5E7EB', 
                        backgroundColor: 'white',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
                        }
                      }}
                    >
                      {/* Card Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip 
                            label={doc.category?.name?.toUpperCase() || "UNCATEGORIZED"} 
                            size="small" 
                            sx={{ backgroundColor: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: '0.7rem', borderRadius: 1 }} 
                          />
                          {parseTags(doc.tags).map((tag, i) => (
                            <Chip 
                              key={i} 
                              label={String(tag).toUpperCase()} 
                              size="small" 
                              sx={{ backgroundColor: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: '0.7rem', borderRadius: 1 }} 
                            />
                          ))}
                        </Box>
                        {getStatusDisplay(doc.processing_status || doc.status)}
                      </Box>

                      {/* Card Body */}
                      <Box sx={{ flexGrow: 1, mb: 4 }}>
                        <Typography 
                          variant={isFeatured ? "h3" : "h5"} 
                          sx={{ 
                            fontWeight: 800, 
                            color: '#111827', 
                            mb: 2, 
                            lineHeight: 1.2,
                            letterSpacing: isFeatured ? '-1px' : '-0.5px'
                          }}
                        >
                          {doc.title || doc.filename}
                        </Typography>
                        <Typography sx={{ color: '#4B5563', fontSize: isFeatured ? '1.1rem' : '0.95rem', lineHeight: 1.6 }}>
                          {doc.description ? truncateText(doc.description, isFeatured ? 300 : 150) : "Technical specifications, context, and documentation regarding this uploaded file."}
                        </Typography>
                      </Box>

                      {/* Divider */}
                      <Box sx={{ height: '1px', backgroundColor: '#F3F4F6', mb: 3, mx: -4 }} />

                      {/* Card Footer */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6B7280' }}>
                            <HistoryOutlinedIcon sx={{ fontSize: 16 }} />
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Version {doc.current_version?.version_label || `v${doc.current_version?.version_no || doc.current_version_no || "1"}.0`}</Typography>
                          </Box>
                          {isFeatured && (
                            <>
                              <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6B7280' }}>
                                <CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatDate(doc.created_at)}</Typography>
                              </Box>
                            </>
                          )}
                        </Box>
                        
                        <Button 
                          onClick={() => navigate(`/admin/documents/${doc.id}`)}
                          endIcon={<ArrowForwardOutlinedIcon />}
                          sx={{ 
                            color: '#16A34A', 
                            textTransform: 'none', 
                            fontWeight: 700, 
                            fontSize: '0.95rem',
                            p: 0,
                            '&:hover': { backgroundColor: 'transparent', color: '#15803D' }
                          }}
                        >
                          Detailed View
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DocumentsPage;
