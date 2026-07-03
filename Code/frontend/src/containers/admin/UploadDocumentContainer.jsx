import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import useDocumentStore from "../../store/documentStore";
import useCategoryStore from "../../store/categoryStore";
import useUIStore from "../../store/uiStore";
import DocumentUploadForm from "../../components/forms/DocumentUploadForm";
import PageHeader from "../../components/common/PageHeader";
import ROUTES from "../../routes/routePaths";

const UploadDocumentContainer = () => {
  const { uploadDocument } = useDocumentStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { openSnackbar } = useUIStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories({ page_size: 100 });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) { setError("Title is required"); return; }
    if (!categoryId) { setError("Category is required"); return; }
    if (!file && !textContent.trim()) { setError("Please upload a file or paste text content"); return; }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category_id", categoryId);
    if (tags) formData.append("tags", tags);
    if (file) formData.append("file", file);
    if (textContent) formData.append("text_content", textContent);

    setLoading(true);
    try {
      await uploadDocument(formData);
      openSnackbar("Document uploaded successfully!", "success");
      navigate(ROUTES.ADMIN_DOCUMENTS);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
      openSnackbar("Upload failed", "error");
    }
    setLoading(false);
  };

  return (
    <Box>
      <PageHeader title="Upload Document" subtitle="Add a new document to the knowledge base" />
      <DocumentUploadForm
        title={title} setTitle={setTitle}
        categoryId={categoryId} setCategoryId={setCategoryId}
        tags={tags} setTags={setTags}
        textContent={textContent} setTextContent={setTextContent}
        file={file} setFile={setFile}
        categories={categories}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />
    </Box>
  );
};

export default UploadDocumentContainer;
