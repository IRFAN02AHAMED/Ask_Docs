import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ROUTES from "../../routes/routePaths";

import DescriptionIcon from "@mui/icons-material/Description";
import QuizIcon from "@mui/icons-material/Quiz";
import HistoryIcon from "@mui/icons-material/History";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import useAuthStore from "../../store/authStore";

const userMenuItems = [
  {
    label: "Available Documents",
    path: ROUTES.USER_DOCUMENTS,
    icon: <DescriptionIcon sx={{ fontSize: 22 }} />,
  },
  {
    label: "Ask Questions",
    path: ROUTES.USER_ASK,
    icon: <QuizIcon sx={{ fontSize: 22 }} />,
  },
  {
    label: "My History",
    path: ROUTES.USER_HISTORY,
    icon: <HistoryIcon sx={{ fontSize: 22 }} />,
  },
];

const pageTitles = {
  [ROUTES.USER_DOCUMENTS]: "Available Documents",
  [ROUTES.USER_ASK]: "Ask Questions",
  [ROUTES.USER_HISTORY]: "My History",
};

const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { logout } = useAuthStore();

  const pageTitle = pageTitles[location.pathname] || "Ask Docs";

  const isActiveSettings = location.pathname.startsWith("/user/settings");

  const handleLogout = () => {
    if (window.confirm("Are you sure that you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  const bottomContent = (
    <Box
      sx={{
        px: 1.5,
        pt: 2,
        pb: 1,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        borderTop: "1px solid #DCEEE3",
      }}
    >
      {/* Settings */}
      <Box
        onClick={() => navigate("/user/settings")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2,
          py: 1.35,
          borderRadius: 2,
          cursor: "pointer",
          backgroundColor: isActiveSettings ? "#22C55E" : "transparent",
          color: isActiveSettings ? "#FFFFFF" : "#4B5563",
          transition: "all 0.2s ease",

          "&:hover": {
            backgroundColor: isActiveSettings ? "#16A34A" : "#E8F7EE",
            color: isActiveSettings ? "#FFFFFF" : "#15803D",
          },
        }}
      >
        <SettingsOutlinedIcon sx={{ fontSize: 23 }} />

        <Typography
          sx={{
            fontWeight: isActiveSettings ? 700 : 600,
            fontSize: "1rem",
            color: "inherit",
          }}
        >
          Settings
        </Typography>
      </Box>

      {/* Logout */}
      <Box
        onClick={handleLogout}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2,
          py: 1.35,
          borderRadius: 2,
          cursor: "pointer",
          backgroundColor: "transparent",
          color: "#4B5563",
          transition: "all 0.2s ease",

          "&:hover": {
            backgroundColor: "#FEE2E2",
            color: "#DC2626",
          },
        }}
      >
        <LogoutOutlinedIcon sx={{ fontSize: 23 }} />

        <Typography
          sx={{
            fontWeight: 600,
            fontSize: "1rem",
            color: "inherit",
          }}
        >
          Logout
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
      }}
    >
      <Sidebar
        menuItems={userMenuItems}
        bottomContent={bottomContent}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Ask Docs"
        subtitle="Academic Q&A"
      />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Topbar
          title={pageTitle}
          onMenuClick={() => setSidebarOpen(true)}
          navItems={userMenuItems}
          showLogo={false}
        />

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

export default UserLayout;