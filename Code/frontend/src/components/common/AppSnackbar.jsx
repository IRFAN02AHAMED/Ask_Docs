import React from "react";
import { Snackbar, Alert } from "@mui/material";
import useUIStore from "../../store/uiStore";

const AppSnackbar = () => {
  const { snackbar, closeSnackbar } = useUIStore();

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={closeSnackbar}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={closeSnackbar}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: "100%", borderRadius: "8px" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
};

export default AppSnackbar;
