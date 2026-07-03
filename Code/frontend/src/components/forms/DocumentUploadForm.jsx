import React from "react";
import { Box, TextField, MenuItem, Typography, Alert, Button } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AppButton from "../common/AppButton";

const DocumentUploadForm = ({
  title, setTitle, categoryId, setCategoryId, tags, setTags,
  textContent, setTextContent, file, setFile,
  categories = [], onSubmit, loading, error,
}) => {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ maxWidth: 600 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Document Title"
        fullWidth
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        label="Category"
        select
        fullWidth
        required
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        sx={{ mb: 2 }}
      >
        <MenuItem value="">Select Category</MenuItem>
        {categories.map((cat) => (
          <MenuItem key={cat.id} value={cat.id}>
            {cat.name}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Tags (comma-separated)"
        fullWidth
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="e.g. api, setup, guide"
        sx={{ mb: 2 }}
      />

      {/* File Upload */}
      <Box
        sx={{
          border: "2px dashed #E5E7EB",
          borderRadius: "12px",
          p: 3,
          textAlign: "center",
          mb: 2,
          backgroundColor: file ? "#F0FDF4" : "#F9FAFB",
          cursor: "pointer",
          "&:hover": { borderColor: "#16A34A" },
          transition: "border-color 0.2s",
        }}
        onClick={() => document.getElementById("file-upload").click()}
      >
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <CloudUploadIcon sx={{ fontSize: 36, color: file ? "#16A34A" : "#9CA3AF", mb: 1 }} />
        {file ? (
          <Typography sx={{ fontWeight: 600, color: "#16A34A" }}>{file.name}</Typography>
        ) : (
          <>
            <Typography sx={{ fontWeight: 500, color: "#374151" }}>
              Click to upload a file
            </Typography>
            <Typography variant="body2" sx={{ color: "#9CA3AF", mt: 0.5 }}>
              PDF, DOCX, or TXT (max 50MB)
            </Typography>
          </>
        )}
      </Box>

      <Typography variant="body2" sx={{ textAlign: "center", mb: 1, color: "#9CA3AF" }}>
        — OR paste text directly —
      </Typography>

      <TextField
        label="Text Content"
        multiline
        rows={4}
        fullWidth
        value={textContent}
        onChange={(e) => setTextContent(e.target.value)}
        placeholder="Paste your document text here..."
        sx={{ mb: 3 }}
      />

      <AppButton type="submit" disabled={loading} sx={{ px: 4 }}>
        {loading ? "Uploading..." : "Upload Document"}
      </AppButton>
    </Box>
  );
};

export default DocumentUploadForm;
