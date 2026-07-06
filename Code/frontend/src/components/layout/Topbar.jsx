import React, { useState } from "react";
import {
  AppBar, Toolbar, Typography, IconButton, Box, Menu, MenuItem,
  Chip, Divider, Avatar, useMediaQuery, useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import useAuth from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { capitalize } from "../../utils/helpers";
import { TOPBAR_HEIGHT } from "../../utils/constants";

function getUserInitials(user) {
  const name = user?.full_name || user?.name || user?.username || user?.email || "User";

  if (name.includes("@")) {
    return name.charAt(0).toUpperCase();
  }

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return name.charAt(0).toUpperCase();
}

const Topbar = ({ title, onMenuClick, navItems, showLogo }) => {
  const { user, logout, fetchMe } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const handleAvatarClick = async (event) => {
    setAnchorEl(event.currentTarget);
    try {
      const data = await fetchMe();
      setProfileData(data);
    } catch {
      // Use stored user data as fallback
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    logout();
    navigate("/login");
  };

  const displayUser = profileData || user;
  const roleName = profileData?.role?.name || user?.role || "viewer";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        height: TOPBAR_HEIGHT,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        zIndex: 10,
      }}
    >
      <Toolbar sx={{ height: "100%", px: { xs: 2, md: 3 } }}>
        {isMobile && (
          <IconButton onClick={onMenuClick} sx={{ mr: 1, color: "#374151" }}>
            <MenuIcon />
          </IconButton>
        )}

        {showLogo && !isMobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 4 }}>
            <AutoStoriesIcon sx={{ color: "#16A34A", fontSize: 24 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", color: "#16A34A", lineHeight: 1.1 }}>Ask Docs</Typography>
              <Typography sx={{ fontSize: "0.6rem", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Academic Q&A</Typography>
            </Box>
          </Box>
        )}

        {(!navItems || isMobile) && (
          <Typography variant="h6" sx={{ color: "#111827", fontWeight: 600, fontSize: "1.15rem" }}>
            {title}
          </Typography>
        )}

        {navItems && !isMobile && (
          <Box sx={{ display: "flex", gap: 3, height: "100%" }}>
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Box
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    height: "100%",
                    position: "relative",
                    color: isActive ? "#16A34A" : "#6B7280",
                    fontWeight: isActive ? 600 : 500,
                    fontSize: "0.95rem",
                    "&:hover": { color: "#16A34A" },
                  }}
                >
                  {item.label}
                  {isActive && (
                    <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "#16A34A", borderRadius: "3px 3px 0 0" }} />
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip
            label={capitalize(roleName)}
            size="small"
            sx={{
              backgroundColor: "#F0FDF4",
              color: "#166534",
              fontWeight: 600,
              fontSize: "0.7rem",
              height: 24,
              display: { xs: "none", sm: "flex" },
            }}
          />

          <IconButton onClick={handleAvatarClick} size="small" sx={{ p: 0.5 }}>
            {displayUser?.avatar_url ? (
              <Avatar
                src={displayUser.avatar_url}
                sx={{ width: 36, height: 36, border: "1px solid #E5E7EB" }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "#111827",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 600,
                  border: "1px solid #E5E7EB",
                }}
              >
                {getUserInitials(displayUser)}
              </Avatar>
            )}
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#111827" }}>
                {displayUser?.full_name || displayUser?.name || "User"}
              </Typography>
              <Typography sx={{ fontSize: "0.8rem", color: "#6B7280", mt: 0.2 }}>
                {displayUser?.email || ""}
              </Typography>
              <Chip
                label={capitalize(roleName)}
                size="small"
                sx={{
                  mt: 1,
                  backgroundColor: "#F0FDF4",
                  color: "#166534",
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  height: 22,
                }}
              />
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1.2, color: "#DC2626" }}>
              <LogoutIcon sx={{ fontSize: 18, mr: 1.5 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
