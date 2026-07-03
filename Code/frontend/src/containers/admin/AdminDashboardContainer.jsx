import React, { useEffect } from "react";
import { Box, Grid, Typography, IconButton } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupIcon from "@mui/icons-material/Group";
import ForumIcon from "@mui/icons-material/Forum";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import useDashboardStore from "../../store/dashboardStore";
import useDocumentStore from "../../store/documentStore";
import useQAStore from "../../store/qaStore";
import AppCard from "../../components/common/AppCard";
import AppLoader from "../../components/common/AppLoader";
import DataTable from "../../components/tables/DataTable";
import StatusChip from "../../components/common/StatusChip";
import PageHeader from "../../components/common/PageHeader";
import { formatNumber, formatDate } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import ROUTES from "../../routes/routePaths";
import AppButton from "../../components/common/AppButton";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const statCards = [
  { key: "total_documents", label: "Total Documents", icon: <DescriptionIcon />, color: "#DBEAFE", iconColor: "#1E40AF" },
  { key: "total_questions", label: "Total Questions", icon: <ForumIcon />, color: "#DBEAFE", iconColor: "#1E40AF" },
  { key: "helpful_answers", label: "Helpful Answers", icon: <ThumbUpIcon />, color: "#F0FDF4", iconColor: "#16A34A" },
  { key: "unanswered_sessions", label: "Unanswered", icon: <HelpOutlineIcon />, color: "#FEF3C7", iconColor: "#92400E" },
  { key: "total_chunks", label: "Total Chunks", icon: <CheckCircleIcon />, color: "#E0E7FF", iconColor: "#3730A3" },
  { key: "total_users", label: "Total Users", icon: <GroupIcon />, color: "#F3F4F6", iconColor: "#374151" },
];

const AdminDashboardContainer = () => {
  const { stats, loading, fetchDashboardStats } = useDashboardStore();
  const { documents, fetchDocuments } = useDocumentStore();
  const { messages, fetchHistory } = useQAStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
    fetchDocuments({ page: 1, page_size: 5, sort_by: "created_at", sort_order: "desc" });
    fetchHistory({ page: 1, page_size: 5, sort_by: "created_at", sort_order: "desc" });
  }, []);

  if (loading && !stats) return <AppLoader fullPage />;

  const docColumns = [
    { field: "title", headerName: "Title" },
    { field: "status", headerName: "Status", renderCell: (row) => <StatusChip status={row.status?.status_name} /> },
    { field: "created_at", headerName: "Date", renderCell: (row) => formatDate(row.created_at) },
  ];

  const qaColumns = [
    { field: "question", headerName: "Question", renderCell: (row) => (
      <Typography noWrap sx={{ maxWidth: 200, fontSize: "0.875rem" }}>{row.question}</Typography>
    )},
    { field: "helpful", headerName: "Helpful", renderCell: (row) => (
      row.helpful === true ? <ThumbUpIcon sx={{ fontSize: 18, color: "#16A34A" }} /> :
      row.helpful === false ? <ThumbUpIcon sx={{ fontSize: 18, color: "#DC2626", transform: "scaleY(-1)" }} /> : "—"
    )},
    { field: "created_at", headerName: "Date", renderCell: (row) => formatDate(row.created_at) },
  ];

  return (
    <Box>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of your knowledge base"
        action={
          <AppButton startIcon={<UploadFileIcon />} onClick={() => navigate(ROUTES.ADMIN_UPLOAD)}>
            Upload Document
          </AppButton>
        }
      />

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={card.key}>
            <AppCard>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "10px", backgroundColor: card.color, display: "flex", alignItems: "center", justifyContent: "center", color: card.iconColor }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827" }}>
                    {formatNumber(stats?.[card.key] || 0)}
                  </Typography>
                </Box>
              </Box>
            </AppCard>
          </Grid>
        ))}
      </Grid>

      {/* Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "12px", overflow: "hidden", backgroundColor: "#FFFFFF" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.5, borderBottom: "1px solid #E5E7EB", backgroundColor: "#F6F3F2" }}>
              <Typography sx={{ fontWeight: 600, fontSize: "1rem" }}>Recent Documents</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#16A34A", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate(ROUTES.ADMIN_DOCUMENTS)}>View All</Typography>
            </Box>
            <DataTable columns={docColumns} rows={documents} emptyMessage="No documents yet" />
          </Box>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Box sx={{ border: "1px solid #E5E7EB", borderRadius: "12px", overflow: "hidden", backgroundColor: "#FFFFFF" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2.5, py: 1.5, borderBottom: "1px solid #E5E7EB", backgroundColor: "#F6F3F2" }}>
              <Typography sx={{ fontWeight: 600, fontSize: "1rem" }}>Recent Questions</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "#16A34A", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate(ROUTES.ADMIN_QA_SESSIONS)}>View All</Typography>
            </Box>
            <DataTable columns={qaColumns} rows={messages} emptyMessage="No questions yet" />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboardContainer;
