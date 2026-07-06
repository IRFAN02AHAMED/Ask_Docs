import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  Select,
  FormControl,
  OutlinedInput,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { SharedAdminSidebar, SharedAdminHeader } from "../../components/layout/SharedLayout";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import { useNavigate, useLocation } from "react-router-dom";
import useCategoryStore from "../../store/categoryStore";
import useDocumentStore from "../../store/documentStore";
const UploadDocumentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const { categories, fetchCategories } = useCategoryStore();
  const { uploadDocument, uploadNewVersion, loading: uploadLoading } = useDocumentStore();
  const versionState = location.state?.returnState || location.state || {};
  const isNewVersion = !!versionState.newVersionOf;
  const documentId = versionState.newVersionOf;
  const nextVersionNo = (versionState.currentVersionNo || 1) + 1;

  const [title, setTitle] = useState(versionState.documentTitle || "");
  const [categoryId, setCategoryId] = useState(location.state?.categoryId || versionState.categoryId || "");
  const [tags, setTags] = useState(versionState.tags || "");
  const [versionLabel, setVersionLabel] = useState(`v${nextVersionNo}.0`);
  const [changeNote, setChangeNote] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleFileChange = (e) => {
    if (!e.target.files || !e.target.files[0]) return;

    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (!title && !isNewVersion) {
      const filename = selectedFile.name;
      setTitle(filename.substring(0, filename.lastIndexOf(".")) || filename);
    }
  };
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (isNewVersion) {
      if (!file) {
        alert("Please upload a file for the new version.");
        return;
      }
      const formData = new FormData();

      if (title) formData.append("title", title);
      if (versionLabel) formData.append("version_label", versionLabel);
      if (changeNote) formData.append("change_note", changeNote);

      formData.append("file", file);

      try {
        await uploadNewVersion(documentId, formData);
        navigate(`/admin/documents/${documentId}`, { replace: true });
      } catch (err) {
        console.error("Version upload failed", err);
        alert(err?.response?.data?.detail || "Upload failed. Please try again.");
      }

      return;
    }

    if (!title || !categoryId || !file) {
      alert("Please fill in the required fields: Title, Category, and File.");
      return;
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("category_id", categoryId);
    formData.append("file", file);

    if (tags) {
      const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
      formData.append("tags", JSON.stringify(tagsArray));
    }
    try {
      const doc = await uploadDocument(formData);

      if (doc && doc.id) {
        navigate(`/admin/documents/${doc.id}`, { replace: true });
      } else {
        navigate("/admin/documents", { replace: true });
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert(err?.response?.data?.detail || "Upload failed. Please try again.");
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#FAFAFA",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <SharedAdminSidebar activeMenu="upload" />

      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <SharedAdminHeader title="Ask Docs AI" />

        <Box sx={{ p: 4, flexGrow: 1, overflowY: "auto" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#111827" }}>
              {isNewVersion ? "Upload New Version" : "Upload Document"}
            </Typography>

            {isNewVersion && (
              <Chip
                label={`Version ${nextVersionNo}`}
                sx={{
                  backgroundColor: "#DBEAFE",
                  color: "#1D4ED8",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                }}
              />
            )}
          </Box>

          <Typography sx={{ color: "#4B5563", fontSize: "1rem", mb: 4 }}>
            {isNewVersion
              ? `Upload an updated version of "${versionState.documentTitle || "this document"}". The document will need to be re-processed after uploading.`
              : "Add a new document file to your knowledge base to improve AI intelligence."}
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              backgroundColor: "white",
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#111827", mb: 3 }}>
              {isNewVersion ? "Version Details" : "Document Details"}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", mb: 1 }}>
                Document Title <span style={{ color: "#EF4444" }}>*</span>
              </Typography>

              <TextField
                fullWidth
                placeholder="e.g., Q3 Financial Report 2023"
                size="small"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "#FFFFFF",
                    "& fieldset": { borderColor: "#E5E7EB" },
                  },
                }}
              />
            </Box>

            {isNewVersion ? (
              <Box sx={{ display: "flex", gap: 3, mb: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", mb: 1 }}>
                    Version Label
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="e.g., v2.0"
                    size="small"
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#E5E7EB" },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", mb: 1 }}>
                    Change Note (Optional)
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="e.g., Updated Q3 figures with corrections"
                    size="small"
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#E5E7EB" },
                      },
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", gap: 3, mb: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", mb: 1 }}>
                    Category <span style={{ color: "#EF4444" }}>*</span>
                  </Typography>

                  <FormControl fullWidth size="small">
                    <Select
                      displayEmpty
                      value={categoryId}
                      onChange={(e) => {
                        if (e.target.value === "create_new_category") {
                          navigate("/admin/categories", {
                            state: {
                              openModal: true,
                              returnTo: location.pathname,
                              returnState: location.state,
                            },
                          });
                        } else {
                          setCategoryId(e.target.value);
                        }
                      }}
                      input={
                        <OutlinedInput
                          sx={{
                            borderRadius: 2,
                            backgroundColor: "#FFFFFF",
                            "& fieldset": { borderColor: "#E5E7EB" },
                          }}
                        />
                      }
                    >
                      <MenuItem disabled value="">
                        <em style={{ color: "#9CA3AF", fontStyle: "normal" }}>
                          Select a category
                        </em>
                      </MenuItem>

                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </MenuItem>
                      ))}

                      <MenuItem value="create_new_category" sx={{ color: "#16A34A", fontWeight: 600 }}>
                        + Create new category
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", mb: 1 }}>
                    Tags (Optional)
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="e.g., policy, draft, 2023 (comma separated)"
                    size="small"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "#FFFFFF",
                        "& fieldset": { borderColor: "#E5E7EB" },
                      },
                    }}
                  />
                </Box>
              </Box>
            )}
            <Box sx={{ borderBottom: "1px solid #E5E7EB", mb: 4 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#111827" }}>
                {isNewVersion ? "Updated File" : "Document File"}{" "}
                <span style={{ color: "#EF4444" }}>*</span>
              </Typography>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563" }}>
                Only PDF, DOCX, and TXT files are supported
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 3, mb: 4, alignItems: "stretch" }}>
              <Box sx={{ flex: 1.2 }}>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", mb: 1 }}>
                  Upload File
                </Typography>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <Box
                  onClick={handleUploadClick}
                  sx={{
                    minHeight: 220,
                    border: "1.5px dashed #86EFAC",
                    backgroundColor: file ? "#DCFCE7" : "#F8FAF9",
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 6,
                    px: 3,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "#F0FDF4",
                      borderColor: "#22C55E",
                    },
                  }}
                >
                  <NoteAddOutlinedIcon
                    sx={{
                      fontSize: 42,
                      color: file ? "#16A34A" : "#9CA3AF",
                      mb: 1.5,
                    }}
                  />
                  <Typography sx={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>
                    {file ? (
                      <span style={{ color: "#16A34A" }}>{file.name} selected</span>
                    ) : (
                      <>
                        <span style={{ color: "#16A34A" }}>Click to upload</span> or drag and drop
                      </>
                    )}
                  </Typography>
                  <Typography sx={{ color: "#6B7280", fontSize: "0.8rem", mt: 0.75 }}>
                    PDF, DOCX, TXT files only
                  </Typography>

                  <Typography sx={{ color: "#9CA3AF", fontSize: "0.75rem", mt: 0.4 }}>
                    Maximum file size: 10MB
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 0.65 }}>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", mb: 1 }}>
                  Upload Guide
                </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          minHeight: 170,
                          p: 1.5,
                          borderRadius: 2,
                          border: "1px solid #E5E7EB",
                          backgroundColor: "#F9FAFB",
                        }}
                      >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                    <TipsAndUpdatesOutlinedIcon sx={{ color: "#16A34A", fontSize: 20 }} />

                    <Typography sx={{ fontWeight: 700, color: "#111827" }}>
                      What happens next?
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                    {[
                      "Upload the document file.",
                      "Process it to extract text and chunks.",
                      "Test the AI answer quality.",
                      "Publish it for users to ask questions.",
                    ].map((item, index) => (
                      <Box key={index} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 17, color: "#16A34A", mt: "2px" }} />

                        <Typography sx={{ fontSize: "0.85rem", color: "#4B5563", lineHeight: 1.5 }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "#ECFDF5",
                      border: "1px solid #BBF7D0",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.8rem", color: "#15803D", fontWeight: 600 }}>
                      Tip: Use a clear title and category
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>

            {isNewVersion && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                After uploading, the document status will reset to <strong>Pending</strong>. You will need to{" "}
                <strong>Process</strong>, <strong>Test</strong>, and <strong>Publish</strong> it again.
              </Alert>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() =>
                  isNewVersion ? navigate(`/admin/documents/${documentId}`) : navigate("/admin/documents")
                }
                sx={{
                  borderColor: "#E5E7EB",
                  color: "#374151",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                  backgroundColor: "white",
                  "&:hover": { backgroundColor: "#F9FAFB" },
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                startIcon={
                  uploadLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadOutlinedIcon />
                }
                onClick={handleSubmit}
                disabled={uploadLoading}
                sx={{
                  backgroundColor: "#22C55E",
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 4,
                  py: 1,
                  "&:hover": { backgroundColor: "#16A34A" },
                }}
              >
                {uploadLoading ? "Uploading..." : isNewVersion ? `Upload Version ${nextVersionNo}` : "Upload Document"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default UploadDocumentPage;