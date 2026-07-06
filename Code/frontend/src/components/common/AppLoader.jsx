/**
 * AppLoader is used to show a loading spinner with a message 
 * while pages or API data are loading, like documents, users, history, or dashboard data.
 */

import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const AppLoader = ({ message = "Loading...", fullPage = false }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: fullPage ? 0 : 6,
        minHeight: fullPage ? "60vh" : "auto",
        gap: 2,
      }}
    >
      <CircularProgress size={36} sx={{ color: "#16A34A" }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default AppLoader;
