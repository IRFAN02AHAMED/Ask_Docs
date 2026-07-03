import React from "react";
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { SIDEBAR_WIDTH } from "../../utils/constants";

const Sidebar = ({ menuItems = [], bottomContent, open, onClose, title = "Ask Docs", subtitle = "AI Q&A", forceDrawer = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const sidebarContent = (
    <Box
      sx={{
        width: SIDEBAR_WIDTH,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F3FAF6",
        py: 3,
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2.5, pb: 2, mb: 2, borderBottom: "1px solid #E5E2E1" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <AutoStoriesIcon sx={{ color: "#16A34A", fontSize: 28 }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "#16A34A", letterSpacing: "-0.01em" }}>
            {title}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", ml: "36px" }}>
          {subtitle}
        </Typography>
      </Box>

      {/* Nav Items */}
      <List sx={{ flex: 1, px: 1, "& .MuiListItemButton-root": { mb: 0.3 } }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile || forceDrawer) onClose?.();
              }}
              sx={{
                borderRadius: "6px",
                py: 1,
                px: 2,
                borderLeft: isActive ? "4px solid #16A34A" : "4px solid transparent",
                // backgroundColor: isActive ? "#EAE7E7" : "transparent",
                // color: isActive ? "#16A34A" : "#6B7280",
                fontWeight: isActive ? 700 : 500,
                // "&:hover": { backgroundColor: isActive ? "#EAE7E7" : "#E5E2E1" },
                transition: "all 0.15s ease",
                backgroundColor: isActive ? "#22C55E" : "transparent",
                color: isActive ? "#FFFFFF" : "#4B5563",
                "&:hover": {
                  backgroundColor: isActive ? "#16A34A" : "#E8F7EE",
                  color: isActive ? "#FFFFFF" : "#15803D",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive ? "#FFFFFF" : "#6B7280" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 700 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Bottom Actions */}
      {bottomContent && (
        <Box sx={{ pb: 3, pt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {bottomContent}
        </Box>
      )}
    </Box>
  );

  // Desktop: permanent sidebar
  if (!isMobile && !forceDrawer) {
    return (
      <Box
        component="aside"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          height: "100vh",
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 20,
        }}
      >
        {sidebarContent}
      </Box>
    );
  }

  // Mobile or forceDrawer
  return (
    <Drawer
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{ "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, border: "none" } }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;
