import React from "react";
import { Button } from "@mui/material";

const AppButton = ({ children, variant = "contained", color = "primary", sx = {}, ...props }) => {
  return (
    <Button
      variant={variant}
      color={color}
      sx={{
        fontWeight: 600,
        fontSize: "0.875rem",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AppButton;
