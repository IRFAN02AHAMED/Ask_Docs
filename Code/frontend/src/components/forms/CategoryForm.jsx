import React from "react";
import { Box, TextField } from "@mui/material";
import AppButton from "../common/AppButton";

const CategoryForm = ({ name, setName, description, setDescription, onSubmit, loading, isEdit = false, nameError, descriptionError }) => {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ pt: 1 }}>
      <TextField
        label="Category Name"
        fullWidth
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!!nameError}
        helperText={nameError}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Description"
        fullWidth
        multiline
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={!!descriptionError}
        helperText={descriptionError}
        sx={{ mb: 2 }}
      />
      <AppButton type="submit" disabled={loading || !!nameError || !!descriptionError}>
        {loading ? "Saving..." : isEdit ? "Update Category" : "Create Category"}
      </AppButton>
    </Box>
  );
};

export default CategoryForm;
