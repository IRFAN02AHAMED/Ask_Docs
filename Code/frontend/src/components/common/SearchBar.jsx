import React from "react";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const SearchBar = ({ value, onChange, placeholder = "Search...", sx = {}, ...props }) => {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#9CA3AF", fontSize: 20 }} />
          </InputAdornment>
        ),
      }}
      sx={{
        width: { xs: "100%", sm: 280 },
        "& .MuiOutlinedInput-root": {
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
        },
        ...sx,
      }}
      {...props}
    />
  );
};

export default SearchBar;
