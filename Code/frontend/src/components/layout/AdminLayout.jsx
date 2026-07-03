import React, { useState } from "react";
import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ROUTES from "../../routes/routePaths";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import HistoryIcon from "@mui/icons-material/History";
import RateReviewIcon from "@mui/icons-material/RateReview";
import QuizIcon from "@mui/icons-material/Quiz";
import GroupIcon from "@mui/icons-material/Group";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const adminMenuItems = [
  { label: "Dashboard", path: ROUTES.ADMIN_DASHBOARD, icon: <DashboardIcon fontSize="small" /> },
  { label: "Documents", path: ROUTES.ADMIN_DOCUMENTS, icon: <DescriptionIcon fontSize="small" /> },
  { label: "Upload", path: ROUTES.ADMIN_UPLOAD, icon: <UploadFileIcon fontSize="small" /> },
  { label: "History", path: ROUTES.ADMIN_QA_SESSIONS, icon: <HistoryIcon fontSize="small" /> },
  { label: "Review", path: ROUTES.ADMIN_AI_VALIDATION, icon: <RateReviewIcon fontSize="small" /> },
  { label: "Category", path: ROUTES.ADMIN_CATEGORIES, icon: <QuizIcon fontSize="small" /> },
  { label: "Users", path: ROUTES.ADMIN_USERS, icon: <GroupIcon fontSize="small" /> },
  { label: "Logs", path: ROUTES.ADMIN_CATEGORIES + "/logs", icon: <ReceiptLongIcon fontSize="small" /> },
];

// Map route to page title
const pageTitles = {
  [ROUTES.ADMIN_DASHBOARD]: "Admin Dashboard",
  [ROUTES.ADMIN_DOCUMENTS]: "Documents",
  [ROUTES.ADMIN_UPLOAD]: "Upload Document",
  [ROUTES.ADMIN_CATEGORIES]: "Categories",
  [ROUTES.ADMIN_USERS]: "Users",
  [ROUTES.ADMIN_QA_SESSIONS]: "Q&A Sessions",
  [ROUTES.ADMIN_AI_VALIDATION]: "AI Validation",
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "Admin";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F9FAFB" }}>
      <Sidebar
        menuItems={adminMenuItems}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Ask Docs AI"
        subtitle="Document Intelligence"
      />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <Topbar title={pageTitle} onMenuClick={() => setSidebarOpen(true)} />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            p: { xs: 2, md: 3 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
