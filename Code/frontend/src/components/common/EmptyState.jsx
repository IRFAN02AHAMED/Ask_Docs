import React from "react";
import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/InboxOutlined";

const EmptyState = ({ message = "No data found", icon: Icon = InboxIcon, action }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        gap: 1.5,
      }}
    >
      <Icon sx={{ fontSize: 48, color: "#D1D5DB" }} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
};

export default EmptyState;
