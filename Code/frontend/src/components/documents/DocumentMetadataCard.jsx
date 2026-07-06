import React from "react";
import { Paper, Box, Typography, Chip, Grid, Avatar } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import { formatDate, parseTags } from "../../utils/helpers";

const DocumentMetadataCard = ({ doc, versionLabel }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        backgroundColor: "white",
        height: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "#111827",
          }}
        >
          Metadata
        </Typography>

        <Chip
          icon={
            <CheckCircleIcon
              sx={{ fontSize: "1rem !important" }}
            />
          }
          label="Active"
          size="small"
          sx={{
            backgroundColor: "#ECFDF5",
            color: "#10B981",
            fontWeight: 600,
            border: "1px solid #A7F3D0",
          }}
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#6B7280",
              fontWeight: 500,
            }}
          >
            Document ID
          </Typography>
          <Typography
            sx={{
              fontSize: "0.95rem",
              color: "#111827",
              fontWeight: 500,
            }}
          >
            {doc.id}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#6B7280",
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            Category
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FolderOutlinedIcon
              sx={{ fontSize: 18, color: "#6B7280" }}
            />
            <Typography
              sx={{
                fontSize: "0.95rem",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              {doc.category?.name || "Uncategorized"}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#6B7280",
              fontWeight: 500,
            }}
          >
            Current Version
          </Typography>
          <Typography
            sx={{
              fontSize: "0.95rem",
              color: "#111827",
              fontWeight: 500,
            }}
          >
            {versionLabel}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#6B7280",
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            Uploaded By
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: "0.75rem",
                backgroundColor: "#3B82F6",
                fontWeight: 600,
              }}
            >
              {doc.uploader?.name ? doc.uploader.name[0] : "A"}
            </Avatar>

            <Typography
              sx={{
                fontSize: "0.95rem",
                color: "#374151",
                fontWeight: 500,
              }}
            >
              {doc.uploader?.name || "Admin"}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#6B7280",
              fontWeight: 500,
            }}
          >
            Upload Date
          </Typography>
          <Typography
            sx={{
              fontSize: "0.95rem",
              color: "#111827",
              fontWeight: 500,
            }}
          >
            {formatDate(doc.created_at)}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#6B7280",
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            Tags
          </Typography>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {parseTags(doc.tags).map((tag, i) => (
              <Chip
                key={i}
                label={String(tag).toUpperCase()}
                size="small"
                sx={{
                  backgroundColor: "#F3F4F6",
                  color: "#4B5563",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            ))}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DocumentMetadataCard;
