import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  InputBase,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  FormControl
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ToggleOffOutlinedIcon from "@mui/icons-material/ToggleOffOutlined";
import ToggleOnOutlinedIcon from "@mui/icons-material/ToggleOnOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation, useNavigate } from "react-router-dom";
import useCategoryStore from "../../store/categoryStore";
import { formatDate } from "../../utils/helpers";
import useDebounce from "../../hooks/useDebounce";
import { SharedAdminSidebar, SharedAdminHeader } from "../../components/layout/SharedLayout";

const CategoriesPage = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  const debouncedSearch = useDebounce(search, 500);

  const location = useLocation();
  const navigate = useNavigate();

  const { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategoryStore();

  useEffect(() => {
    if (location.state?.openModal) {
      handleOpenAdd();
    }
  }, [location.state?.openModal]);

  useEffect(() => {
    fetchCategories({ search: debouncedSearch, is_active: isActiveFilter === "all" ? undefined : isActiveFilter === "active", page: 1, page_size: 50 });
  }, [fetchCategories, debouncedSearch, isActiveFilter]);

  const handleOpenAdd = () => {
    setEditId(null);
    setName("");
    setDescription("");
    setNameError("");
    setDescriptionError("");
    setOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setNameError("");
    setDescriptionError("");
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setNameError("");
    setDescriptionError("");

    let valid = true;
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    if (trimmedName.length < 2) {
      setNameError("Name must be at least 2 characters.");
      valid = false;
    } else if (trimmedName.length > 100) {
      setNameError("Name cannot exceed 100 characters.");
      valid = false;
    } else if (/<|>/g.test(trimmedName)) {
      setNameError("Name cannot contain HTML or script tags.");
      valid = false;
    }

    if (trimmedDesc.length > 500) {
      setDescriptionError("Description cannot exceed 500 characters.");
      valid = false;
    } else if (/<|>/g.test(trimmedDesc)) {
      setDescriptionError("Description cannot contain HTML or script tags.");
      valid = false;
    }

    if (!valid) return;

    try {
      let createdCat;
      if (editId) {
        await updateCategory(editId, { name, description });
      } else {
        createdCat = await createCategory({ name, description });
      }
      setOpen(false);
      fetchCategories();
      
      // If navigated from upload document page, return there
      if (!editId && location.state?.returnTo) {
        navigate(location.state.returnTo, { 
          state: { 
            categoryId: createdCat?.id, 
            ...location.state.returnState 
          } 
        });
      }
    } catch (error) {
      console.error("Failed to save category", error);
    }
  };

  const handleToggleStatus = async (row) => {
    const action = row.is_active ? "deactivate" : "activate";
    if (window.confirm(`Are you sure you want to ${action} this category?`)) {
      try {
        await updateCategory(row.id, { is_active: !row.is_active });
        fetchCategories();
      } catch (error) {
        console.error(`Failed to ${action} category`, error);
      }
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", fontFamily: "'Inter', sans-serif" }}>
      <SharedAdminSidebar activeMenu="categories" />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="Categories" />

        <Box sx={{ px: 6, pb: 4, pt: 4, flexGrow: 1, overflowY: 'auto' }}>
          {/* Header Area */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", mb: 0.5 }}>
                Category Management
              </Typography>
              <Typography sx={{ color: "#4B5563", fontSize: "0.95rem" }}>
                Create, edit, and manage document categories for document intelligence.
              </Typography>
            </Box>
            
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={isActiveFilter}
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                  sx={{ backgroundColor: 'white', borderRadius: 2 }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                backgroundColor: "white", 
                borderRadius: 2, 
                px: 2, 
                py: 1,
                width: 240,
                border: "1px solid #E5E7EB"
              }}>
                <SearchIcon sx={{ color: "#9CA3AF", fontSize: 20, mr: 1 }} />
                <InputBase 
                  placeholder="Search categories..." 
                  sx={{ fontSize: "0.95rem", width: '100%' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </Box>
              <Button 
                variant="contained" 
                sx={{ 
                  backgroundColor: "#16A34A", 
                  textTransform: "none", 
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: "none",
                  "&:hover": { backgroundColor: "#15803D", boxShadow: "none" }
                }}
                onClick={handleOpenAdd}
              >
                Create Category
              </Button>
            </Box>
          </Box>

          {/* Table Area */}
          <TableContainer component={Paper} elevation={0} sx={{ 
            backgroundColor: "white", 
            border: "1px solid #E5E7EB",
            borderRadius: 3,
            overflowX: "auto"
          }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#F9FAFB" }}>
                  <TableCell sx={{ fontWeight: 600, color: "#4B5563", borderBottom: "1px solid #E5E7EB", py: 2 }}>Category Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#4B5563", borderBottom: "1px solid #E5E7EB", py: 2 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#4B5563", borderBottom: "1px solid #E5E7EB", py: 2 }}>Docs Count</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#4B5563", borderBottom: "1px solid #E5E7EB", py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#4B5563", borderBottom: "1px solid #E5E7EB", py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={30} sx={{ color: '#22C55E' }} />
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#6B7280' }}>
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ borderBottom: "1px solid #F3F4F6", color: "#111827", py: 2.5, fontWeight: 500 }}>{row.name}</TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #F3F4F6", color: "#4B5563", py: 2.5 }}>{row.description || "—"}</TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #F3F4F6", color: "#4B5563", py: 2.5 }}>
                        <Box sx={{ backgroundColor: '#F3F4F6', display: 'inline-block', px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 600, color: '#4B5563' }}>
                          {row.document_count || 0} Docs
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #F3F4F6", color: "#111827", py: 2.5 }}>
                        <Box sx={{ 
                          backgroundColor: row.is_active ? '#ECFDF5' : '#FEF2F2', 
                          display: 'inline-block', 
                          px: 1.5, 
                          py: 0.5, 
                          borderRadius: 1.5, 
                          fontSize: '0.8rem', 
                          fontWeight: 700, 
                          color: row.is_active ? '#10B981' : '#EF4444' 
                        }}>
                          {row.is_active ? 'Active' : 'Inactive'}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: "1px solid #F3F4F6", py: 2.5 }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" aria-label="Edit category" onClick={() => handleOpenEdit(row)} sx={{ color: "#6B7280" }}>
                              <EditOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={row.is_active ? "Deactivate" : "Activate"}>
                            <IconButton 
                              size="small" 
                              aria-label={row.is_active ? "Deactivate category" : "Activate category"} 
                              onClick={() => handleToggleStatus(row)} 
                              sx={{ color: row.is_active ? "#EF4444" : "#10B981" }}
                            >
                              {row.is_active ? <ToggleOffOutlinedIcon sx={{ fontSize: 18 }} /> : <ToggleOnOutlinedIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Modal Overlay */}
        <Dialog 
          open={open} 
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: {
              width: 400,
              borderRadius: 3,
              p: 3,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              m: 0
            }
          }}
          sx={{
             '& .MuiBackdrop-root': {
               backgroundColor: 'rgba(255, 255, 255, 0.4)'
             }
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#111827" }}>
              {editId ? "Edit Category" : "Add Category"}
            </Typography>
            <IconButton aria-label="Close" onClick={() => setOpen(false)} size="small">
              <CloseIcon sx={{ fontSize: 20, color: "#6B7280" }} />
            </IconButton>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", mb: 1 }}>
              Category Name
            </Typography>
            <TextField 
              fullWidth 
              size="small"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError("");
              }}
              error={!!nameError}
              helperText={nameError}
              sx={{ 
                "& .MuiOutlinedInput-root": { 
                  borderRadius: 2,
                  "& fieldset": { borderColor: "#D1D5DB" }
                } 
              }} 
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827", mb: 1 }}>
              Description
            </Typography>
            <TextField 
              fullWidth 
              multiline
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionError("");
              }}
              error={!!descriptionError}
              helperText={descriptionError}
              sx={{ 
                "& .MuiOutlinedInput-root": { 
                  borderRadius: 2,
                  "& fieldset": { borderColor: "#D1D5DB" }
                } 
              }} 
            />
          </Box>

          <Button 
            fullWidth 
            variant="contained" 
            sx={{ 
              backgroundColor: "#22C55E", 
              textTransform: "none", 
              fontWeight: 600,
              fontSize: "1rem",
              borderRadius: 2,
              py: 1.2,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#16A34A", boxShadow: "none" }
            }}
            disabled={loading || !!nameError || !!descriptionError}
            onClick={handleSubmit}
          >
            {editId ? "Save Changes" : "Create Category"}
          </Button>
        </Dialog>
      </Box>
    </Box>
  );
};

export default CategoriesPage;
