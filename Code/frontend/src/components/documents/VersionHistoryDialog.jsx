import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, CircularProgress, Typography, Paper, Chip, Button, Divider, Grid } from "@mui/material";
import { formatDate } from "../../utils/helpers";
import { formatTokenCount } from "../../utils/documentHelpers";

const VersionHistoryDialog = ({ open, onClose, versionsLoading, versionsList }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700 }}>Version History</DialogTitle>

      <DialogContent dividers>
        {versionsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : versionsList.length === 0 ? (
          <Typography>No previous versions found for this document.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {versionsList.map((version) => (
              <Paper
                key={version.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  border: "1px solid #E5E7EB",
                  borderRadius: 2,
                  backgroundColor: version.is_current ? "#F0FDF4" : "#FFFFFF",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "#111827",
                      }}
                    >
                      {version.version_label || `v${version.version_no}.0`}
                    </Typography>

                    <Typography sx={{ fontSize: "0.85rem", color: "#6B7280" }}>
                      File: {version.file_name || "N/A"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {version.is_current && (
                      <Chip
                        label="Current"
                        size="small"
                        sx={{
                          backgroundColor: "#DCFCE7",
                          color: "#16A34A",
                          fontWeight: 700,
                        }}
                      />
                    )}

                    <Chip
                      label={
                        version.status?.status_name ||
                        version.status?.name ||
                        "N/A"
                      }
                      size="small"
                      sx={{
                        backgroundColor: "#F3F4F6",
                        color: "#374151",
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        fontWeight: 600,
                      }}
                    >
                      Version Number
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: "#111827",
                        fontWeight: 500,
                      }}
                    >
                      {version.version_no || "N/A"}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        fontWeight: 600,
                      }}
                    >
                      File Type
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: "#111827",
                        fontWeight: 500,
                        textTransform: "uppercase",
                      }}
                    >
                      {version.file_type || "N/A"}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        fontWeight: 600,
                      }}
                    >
                      Tokens
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: "#111827",
                        fontWeight: 500,
                      }}
                    >
                      {formatTokenCount(version.token_count)}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        fontWeight: 600,
                      }}
                    >
                      Uploaded At
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "0.9rem",
                        color: "#111827",
                        fontWeight: 500,
                      }}
                    >
                      {formatDate(version.created_at)}
                    </Typography>
                  </Grid>
                </Grid>

                {version.change_note && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#6B7280",
                        fontWeight: 600,
                      }}
                    >
                      Change Note
                    </Typography>

                    <Typography sx={{ fontSize: "0.9rem", color: "#374151" }}>
                      {version.change_note}
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionHistoryDialog;
