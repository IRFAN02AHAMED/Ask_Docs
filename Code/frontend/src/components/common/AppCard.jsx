/**
 * It is used in User modules
 * Used to show each Q&A history message card.
 * Used to show each published document card.
 */


import React from "react";
import { Card, CardContent } from "@mui/material";

const AppCard = ({ children, sx = {}, contentSx = {}, ...props }) => {
  return (
    <Card
      sx={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        boxShadow: "none",
        "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
        transition: "box-shadow 0.2s ease",
        ...sx,
      }}
      {...props}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 }, ...contentSx }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default AppCard;
