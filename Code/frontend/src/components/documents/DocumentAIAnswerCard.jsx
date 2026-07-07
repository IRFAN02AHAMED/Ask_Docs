import React from "react";
import { Paper, Box, Typography, Avatar, Chip, Button, Divider } from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import { SourceChunksSection } from "../../components/common/SourceChunkCard";
import { getConfidenceBadge } from "../../utils/documentHelpers";
import { markdownToPlainText } from "../../utils/textFormatters";

const DocumentAIAnswerCard = ({
  activeAnswer,
  testQuestion,
  feedbackSent,
  handleQAApproval,
  handleCopy,
}) => {
  if (!activeAnswer) return null;

  const badge = getConfidenceBadge(
    activeAnswer.confidence_score,
    activeAnswer.answer
  );

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        border: "1px solid #E5E7EB",
        overflow: "hidden",
        backgroundColor: "white",
        mb: 4,
        flexShrink: 0,
      }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "0.8rem",
              fontWeight: 700,
              backgroundColor: "#E5E7EB",
              color: "#4B5563",
            }}
          >
            AD
          </Avatar>

          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#111827",
            }}
          >
            {activeAnswer.question || testQuestion}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "stretch" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                backgroundColor: "#10B981",
                color: "white",
                p: 0.5,
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>

            <Box
              sx={{
                width: "2px",
                backgroundColor: "#10B981",
                flexGrow: 1,
                my: 1,
              }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, pl: 0.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
                pt: 0.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#10B981",
                }}
              >
                AI Analysis
              </Typography>

              <Chip
                icon={
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: badge.color,
                      ml: 1,
                      mr: -0.5,
                    }}
                  />
                }
                label={`Confidence: ${badge.label} (${parseFloat(
                  activeAnswer.confidence_score || 0
                ).toFixed(2)})`}
                size="small"
                sx={{
                  backgroundColor: badge.bg,
                  color: badge.color,
                  fontWeight: 600,
                  border: `1px solid ${badge.border}`,
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
            </Box>

            <Typography
              sx={{
                fontSize: "0.95rem",
                color: "#374151",
                lineHeight: 1.65,
                mb: 2,
                whiteSpace: "pre-wrap",
              }}
            >
              {markdownToPlainText(activeAnswer.answer)}
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQAApproval("looks_good")}
                  startIcon={
                    <ThumbUpOutlinedIcon
                      sx={{
                        color:
                          feedbackSent === "up" ? "white" : "#10B981",
                      }}
                    />
                  }
                  sx={{
                    borderColor:
                      feedbackSent === "up" ? "#10B981" : "#E5E7EB",
                    color: feedbackSent === "up" ? "white" : "#374151",
                    backgroundColor:
                      feedbackSent === "up" ? "#10B981" : "transparent",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                    "&:hover": {
                      backgroundColor:
                        feedbackSent === "up" ? "#10B981" : "#ECFDF5",
                      borderColor: "#A7F3D0",
                    },
                  }}
                >
                  Helpful
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQAApproval("needs_fix")}
                  startIcon={
                    <ThumbDownOutlinedIcon
                      sx={{
                        color:
                          feedbackSent === "down"
                            ? "white"
                            : "#EF4444",
                      }}
                    />
                  }
                  sx={{
                    borderColor:
                      feedbackSent === "down" ? "#EF4444" : "#E5E7EB",
                    color:
                      feedbackSent === "down" ? "white" : "#374151",
                    backgroundColor:
                      feedbackSent === "down"
                        ? "#EF4444"
                        : "transparent",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                    "&:hover": {
                      backgroundColor:
                        feedbackSent === "down"
                          ? "#EF4444"
                          : "#FEE2E2",
                      borderColor: "#FECACA",
                    },
                  }}
                >
                  Not Helpful
                </Button>
              </Box>

              <Button
                size="small"
                variant="outlined"
                onClick={() => handleCopy(markdownToPlainText(activeAnswer.answer))}
                startIcon={
                  <FileCopyOutlinedIcon
                    sx={{ fontSize: 14, color: "#4B5563" }}
                  />
                }
                sx={{
                  borderColor: "#E5E7EB",
                  color: "#374151",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  "&:hover": {
                    backgroundColor: "#F9FAFB",
                    borderColor: "#D1D5DB",
                  },
                }}
              >
                Copy
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {(activeAnswer.source_chunks &&
        activeAnswer.source_chunks.length > 0) ||
      activeAnswer.is_unanswered ||
      activeAnswer.isUnanswered ? (
        <>
          <Divider />

          <Box sx={{ backgroundColor: "#F9FAFB", p: 3, py: 2.5 }}>
            {activeAnswer.source_chunks &&
            activeAnswer.source_chunks.length > 0 &&
            !activeAnswer.is_unanswered &&
            !activeAnswer.isUnanswered ? (
              <SourceChunksSection sources={activeAnswer.source_chunks} />
            ) : (
              <Box>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#6B7280",
                    mb: 1,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Sources Used
                </Typography>

                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    color: "#6B7280",
                    fontStyle: "italic",
                  }}
                >
                  No sources found for this answer.
                </Typography>
              </Box>
            )}
          </Box>
        </>
      ) : null}
    </Paper>
  );
};

export default DocumentAIAnswerCard;
