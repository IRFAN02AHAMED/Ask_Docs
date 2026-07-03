import React from "react";
import { Chip } from "@mui/material";
import { STATUS_COLORS } from "../../utils/constants";

const StatusChip = ({ status, label, size = "small", ...props }) => {
  const displayLabel = label || status || "unknown";
  const colors = STATUS_COLORS[status?.toLowerCase()] || { bg: "#F3F4F6", text: "#374151" };

  return (
    <Chip
      label={displayLabel.toUpperCase()}
      size={size}
      sx={{
        backgroundColor: colors.bg,
        color: colors.text,
        fontWeight: 700,
        fontSize: "0.65rem",
        letterSpacing: "0.05em",
        borderRadius: "6px",
        height: 24,
      }}
      {...props}
    />
  );
};

export default StatusChip;
