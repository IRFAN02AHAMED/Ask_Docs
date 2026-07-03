import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F0FDF4", gap: 2 }}>
      <AutoStoriesIcon sx={{ fontSize: 48, color: "#16A34A" }} />
      <Typography sx={{ fontSize: "4rem", fontWeight: 800, color: "#16A34A" }}>404</Typography>
      <Typography sx={{ fontSize: "1.1rem", color: "#6B7280" }}>Page not found</Typography>
      <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 1, backgroundColor: "#16A34A", "&:hover": { backgroundColor: "#166534" } }}>
        Go Back
      </Button>
    </Box>
  );
};

export default NotFoundPage;
