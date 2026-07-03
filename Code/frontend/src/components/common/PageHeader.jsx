import React from "react";
import { Box, Typography } from "@mui/material";

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        mb: 3,
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 600, color: "#111827" }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.5, color: "#6B7280" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
  );
};

export default PageHeader;
