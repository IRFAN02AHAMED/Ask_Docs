import React from "react";
import { Button } from "@mui/material";
import AppDialog from "./AppDialog";

const ConfirmDialog = ({ open, onClose, onConfirm, title = "Confirm", message = "Are you sure?", confirmText = "Confirm", cancelText = "Cancel", loading = false }) => {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button onClick={onClose} variant="outlined" disabled={loading}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} variant="contained" color="error" disabled={loading}>
            {loading ? "Processing..." : confirmText}
          </Button>
        </>
      }
    >
      {message}
    </AppDialog>
  );
};

export default ConfirmDialog;
