import React from "react";
import { Paper, Box, Typography, Tooltip } from "@mui/material";

const DocumentInfoStatCard = ({ icon, label, value, tooltip, uppercase }) => {
  const content = (
    <Typography
      sx={{
        fontSize: "1.25rem",
        fontWeight: 700,
        color: "#111827",
        textTransform: uppercase ? "uppercase" : "none",
        ...(tooltip && {
          cursor: "help",
          display: "inline-block",
          borderBottom: "1px dotted #9CA3AF",
        }),
      }}
    >
      {value}
    </Typography>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        p: 2.5,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          backgroundColor: "#F3F4F6",
          p: 1.5,
          borderRadius: 2,
          color: "#4B5563",
          display: "flex",
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#6B7280",
          }}
        >
          {label}
        </Typography>

        {tooltip ? (
          <Tooltip title={tooltip}>{content}</Tooltip>
        ) : (
          content
        )}
      </Box>
    </Paper>
  );
};

export default DocumentInfoStatCard;
