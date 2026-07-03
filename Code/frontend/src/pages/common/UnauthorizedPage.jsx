import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import LockIcon from "@mui/icons-material/Lock";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F0FDF4", gap: 2 }}>
      <LockIcon sx={{ fontSize: 48, color: "#DC2626" }} />
      <Typography sx={{ fontSize: "2rem", fontWeight: 700, color: "#111827" }}>Unauthorized</Typography>
      <Typography sx={{ color: "#6B7280" }}>You don't have permission to access this page.</Typography>
      <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 1, backgroundColor: "#16A34A", "&:hover": { backgroundColor: "#166534" } }}>
        Go Back
      </Button>
    </Box>
  );
};

export default UnauthorizedPage;
