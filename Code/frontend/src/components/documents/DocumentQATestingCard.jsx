import React from "react";
import { Paper, Box, Typography, Chip, Alert, TextField, Button, CircularProgress } from "@mui/material";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";

const DocumentQATestingCard = ({
  canTest,
  qaTestStatus,
  testQuestion,
  setTestQuestion,
  askLoading,
  handleAskTestQuestion,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        backgroundColor: "white",
        position: "relative",
        opacity: canTest ? 1 : 0.6,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 250,
          height: 250,
          background:
            "radial-gradient(circle at top right, #ECFDF5 0%, transparent 70%)",
          borderTopRightRadius: 12,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ScienceOutlinedIcon sx={{ color: "#10B981" }} />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1.2rem",
              color: "#111827",
            }}
          >
            Quality Assurance Testing
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {qaTestStatus !== "not_tested" && (
            <Chip
              label={
                qaTestStatus === "looks_good"
                  ? "Approved"
                  : "Needs Fix"
              }
              size="small"
              sx={{
                backgroundColor:
                  qaTestStatus === "looks_good"
                    ? "#ECFDF5"
                    : "#FEE2E2",
                color:
                  qaTestStatus === "looks_good"
                    ? "#10B981"
                    : "#EF4444",
                fontWeight: 600,
                borderRadius: 1,
              }}
            />
          )}

          <Chip
            label="Simulation Mode"
            size="small"
            sx={{
              backgroundColor: "#F3F4F6",
              color: "#4B5563",
              fontWeight: 600,
              borderRadius: 1,
            }}
          />
        </Box>
      </Box>

      {!canTest ? (
        <Alert
          severity="info"
          sx={{
            borderRadius: 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          Process the document first before testing. Click "Process
          Document" above.
        </Alert>
      ) : (
        <>
          <Typography
            sx={{
              color: "#4B5563",
              fontSize: "0.95rem",
              mb: 3,
              position: "relative",
              zIndex: 1,
            }}
          >
            Ask a question specifically about this document to test
            the current embedding and retrieval configuration before
            publishing.
          </Typography>

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder="e.g., What is this document about?"
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              sx={{
                backgroundColor: "white",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  pb: 6,
                  "& fieldset": { borderColor: "#E5E7EB" },
                },
              }}
            />

            <Button
              variant="contained"
              onClick={handleAskTestQuestion}
              disabled={askLoading || !testQuestion.trim()}
              startIcon={
                askLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <AutoAwesomeOutlinedIcon />
                )
              }
              sx={{
                position: "absolute",
                bottom: 12,
                right: 12,
                backgroundColor: "#10B981",
                color: "#ffffff",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 1.5,
                px: 2,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#D1D5DB",
                  boxShadow: "none",
                },
                "&.Mui-disabled": {
                  backgroundColor: "#F3F4F6",
                  color: "#9CA3AF",
                },
              }}
            >
              {askLoading ? "Analyzing..." : "Ask Test Question"}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default DocumentQATestingCard;
