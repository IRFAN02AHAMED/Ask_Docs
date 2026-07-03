import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const AppDialog = ({ open, onClose, title, children, actions, maxWidth = "sm", ...props }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth {...props}>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 600,
          borderBottom: "1px solid #E5E7EB",
          pb: 1.5,
        }}
      >
        {title}
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>{children}</DialogContent>
      {actions && (
        <DialogActions sx={{ px: 3, pb: 2, borderTop: "1px solid #E5E7EB" }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AppDialog;
