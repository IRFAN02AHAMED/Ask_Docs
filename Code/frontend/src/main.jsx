import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme/theme";
import App from "./App";
import AppSnackbar from "./components/common/AppSnackbar";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
      <AppSnackbar />
    </ThemeProvider>
  </React.StrictMode>
);
