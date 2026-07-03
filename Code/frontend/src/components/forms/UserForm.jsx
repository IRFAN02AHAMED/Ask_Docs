import React from "react";
import { Box, TextField, FormControlLabel, Switch } from "@mui/material";
import AppButton from "../common/AppButton";

const UserForm = ({ name, setName, isActive, setIsActive, onSubmit, loading }) => {
  return (
    <Box component="form" onSubmit={onSubmit} sx={{ pt: 1 }}>
      <TextField
        label="Name"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        sx={{ mb: 2 }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            color="primary"
          />
        }
        label="Active"
        sx={{ mb: 2, display: "block" }}
      />
      <AppButton type="submit" disabled={loading}>
        {loading ? "Saving..." : "Update User"}
      </AppButton>
    </Box>
  );
};

export default UserForm;
