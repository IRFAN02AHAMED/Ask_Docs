import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

export const STATUS_ORDER = ["pending", "processing", "processed", "published"];

export const StatusStep = ({ label, status, active }) => {
  let icon;

  if (status === "completed") {
    icon = (
      <CheckCircleIcon
        sx={{
          color: "#10B981",
          fontSize: 28,
          zIndex: 1,
          backgroundColor: "white",
        }}
      />
    );
  } else if (status === "current") {
    icon = (
      <RadioButtonCheckedIcon
        sx={{
          color: "#3B82F6",
          fontSize: 28,
          zIndex: 1,
          backgroundColor: "white",
        }}
      />
    );
  } else {
    icon = (
      <FiberManualRecordIcon
        sx={{
          color: "#D1D5DB",
          fontSize: 16,
          zIndex: 1,
          backgroundColor: "white",
          m: "6px",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        width: 100,
      }}
    >
      {icon}

      <Typography
        sx={{
          mt: 1,
          fontSize: "0.85rem",
          fontWeight: active ? 700 : 500,
          color: active
            ? "#111827"
            : status === "completed"
            ? "#111827"
            : "#9CA3AF",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

const DocumentStatusTracker = ({ status }) => {
  const isProcessed = status === "processed";
  const isPublished = status === "published";
  const isPending = status === "pending";
  const isProcessing = status === "processing";
  const isFailed = status === "failed";

  const statusIdx = STATUS_ORDER.indexOf(status);

  const getStepStatus = (stepName) => {
    const stepIdx = STATUS_ORDER.indexOf(stepName);

    if (status === "failed") {
      return stepIdx === 0 ? "completed" : "pending";
    }

    if (stepIdx < statusIdx) return "completed";
    if (stepIdx === statusIdx) return "current";
    return "pending";
  };

  const getProgressWidth = () => {
    if (status === "pending") return "0%";
    if (status === "processing") return "33%";
    if (status === "processed") return "66%";
    if (status === "published") return "100%";
    return "0%";
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        backgroundColor: "white",
        mb: 4,
        position: "relative",
      }}
    >
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#6B7280",
          letterSpacing: "0.5px",
          mb: 3,
        }}
      >
        DOCUMENT STATUS
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          position: "relative",
          px: 4,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 14,
            left: 90,
            right: 90,
            height: 2,
            display: "flex",
          }}
        >
          <Box
            sx={{
              width: getProgressWidth(),
              height: "100%",
              backgroundColor: "#3B82F6",
              transition: "width 0.5s ease",
            }}
          />
          <Box
            sx={{
              flexGrow: 1,
              height: "100%",
              backgroundColor: "#E5E7EB",
            }}
          />
        </Box>

        <StatusStep
          label="Pending"
          status={getStepStatus("pending")}
          active={isPending}
        />
        <StatusStep
          label="Processing"
          status={getStepStatus("processing")}
          active={isProcessing}
        />
        <StatusStep
          label="Processed"
          status={getStepStatus("processed")}
          active={isProcessed}
        />
        <StatusStep
          label="Published"
          status={getStepStatus("published")}
          active={isPublished}
        />

        {isFailed && (
          <StatusStep label="Failed" status="current" active={true} />
        )}
      </Box>
    </Paper>
  );
};

export default DocumentStatusTracker;
