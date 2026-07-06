import React, { useState, useEffect } from "react";
import { 
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, 
  TableBody, InputBase, IconButton, Chip, Select, MenuItem, FormControl, CircularProgress, TableContainer, Tooltip
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { SharedAdminSidebar, SharedAdminHeader } from "../../components/layout/SharedLayout";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/userStore";
import useDebounce from "../../hooks/useDebounce";
import { formatDate } from "../../utils/helpers";

const UsersPage = () => {
  const navigate = useNavigate();
  const { users, loading, fetchUsers, deleteUser } = useUserStore();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const params = { page: 1, page_size: 50 };
    if (debouncedSearch) params.search = debouncedSearch;
    if (roleFilter !== "all") params.role = roleFilter;
    if (statusFilter !== "all") params.is_active = statusFilter === "active";
    
    fetchUsers(params);
  }, [debouncedSearch, roleFilter, statusFilter, fetchUsers]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteUser(id);
      fetchUsers({ page: 1, page_size: 50 });
    }
  };

  const getRoleChip = (role) => {
    const roleName = typeof role === 'object' && role !== null ? role.name : role;
    const r = String(roleName).toLowerCase();
    if (r === 'admin') return <Chip label="Admin" size="small" sx={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontWeight: 600, borderRadius: 1.5 }} />;
    if (r === 'viewer') return <Chip label="Viewer" size="small" sx={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontWeight: 600, borderRadius: 1.5 }} />;
    return <Chip label={roleName ? roleName.charAt(0).toUpperCase() + roleName.slice(1) : "Viewer"} size="small" sx={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontWeight: 600, borderRadius: 1.5 }} />;
  };

  const getStatusDisplay = (isActive) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isActive ? '#10B981' : '#9CA3AF' }} />
        <Typography sx={{ fontSize: '0.9rem', color: isActive ? '#111827' : '#6B7280', fontWeight: isActive ? 600 : 500 }}>
          {isActive ? 'Active' : 'Inactive'}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#FAFAFA", fontFamily: "'Inter', sans-serif" }}>
      <SharedAdminSidebar activeMenu="users" />

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="Users Management" />

        <Box sx={{ px: 6, pb: 4, flexGrow: 1, overflowY: 'auto' }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 4, mb: 4 }}>
            <Box>
              {/* <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>
                Users Management
              </Typography> */}
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' , mb: 0.5 }}>
                Manage Admin and Viewer accounts
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              onClick={() => navigate("/admin/users/create")}
              sx={{ 
                backgroundColor: '#22C55E', 
                color: "white", 
                fontWeight: 600, 
                textTransform: "none", 
                borderRadius: 2,
                px: 3,
                boxShadow: "none",
                '&:hover': { backgroundColor: '#16A34A', boxShadow: "none" }
              }}
            >
              + Create User
            </Button>
          </Box>

          <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
            
            {/* Toolbar */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', backgroundColor: 'white' }}>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                backgroundColor: "#F9FAFB", 
                border: '1px solid #E5E7EB',
                borderRadius: 2, 
                px: 1.5, 
                py: 0.5,
                width: 280,
              }}>
                <SearchIcon sx={{ color: "#9CA3AF", fontSize: 20, mr: 1 }} />
                <InputBase 
                  placeholder="Search users..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ fontSize: "0.9rem", width: '100%' }} 
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 2, fontSize: '0.9rem', color: '#374151', backgroundColor: '#F9FAFB', '& fieldset': { borderColor: '#E5E7EB' } }}
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 2, fontSize: '0.9rem', color: '#374151', backgroundColor: '#F9FAFB', '& fieldset': { borderColor: '#E5E7EB' } }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.85rem', py: 2, borderBottom: '1px solid #E5E7EB' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.85rem', py: 2, borderBottom: '1px solid #E5E7EB' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.85rem', py: 2, borderBottom: '1px solid #E5E7EB' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.85rem', py: 2, borderBottom: '1px solid #E5E7EB' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.85rem', py: 2, borderBottom: '1px solid #E5E7EB' }}>Created Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#4B5563', fontSize: '0.85rem', py: 2, borderBottom: '1px solid #E5E7EB' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ backgroundColor: 'white' }}>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={30} sx={{ color: '#16A34A' }} /></TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#6B7280' }}>No users found matching your criteria.</TableCell></TableRow>
                ) : (
                  users.map((row) => {
                    const isActive = row.is_active !== false; // Default to true if undefined
                    return (
                      <TableRow key={row.id}>
                        <TableCell sx={{ color: '#111827', fontSize: '0.95rem', fontWeight: 500, py: 2, borderBottom: '1px solid #F3F4F6' }}>{row.name}</TableCell>
                        <TableCell sx={{ color: '#4B5563', fontSize: '0.95rem', py: 2, borderBottom: '1px solid #F3F4F6' }}>{row.email}</TableCell>
                        <TableCell sx={{ py: 2, borderBottom: '1px solid #F3F4F6' }}>{getRoleChip(row.role)}</TableCell>
                        <TableCell sx={{ py: 2, borderBottom: '1px solid #F3F4F6' }}>{getStatusDisplay(isActive)}</TableCell>
                        <TableCell sx={{ color: '#4B5563', fontSize: '0.95rem', py: 2, borderBottom: '1px solid #F3F4F6' }}>{formatDate(row.created_at)}</TableCell>
                        <TableCell sx={{ py: 2, borderBottom: '1px solid #F3F4F6' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="View">
                              <IconButton 
                                aria-label="View user"
                                onClick={() => navigate(`/admin/users/${row.id}/view`)}
                                sx={{ 
                                  p: 0.5, 
                                  borderRadius: 1.5, 
                                  backgroundColor: isActive ? '#ECFDF5' : '#F3F4F6', 
                                  color: isActive ? '#10B981' : '#9CA3AF',
                                }}>
                                <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton 
                                aria-label="Edit user"
                                onClick={() => navigate(`/admin/users/${row.id}/edit`)}
                                sx={{ 
                                  p: 0.5, 
                                  borderRadius: 1.5, 
                                  backgroundColor: isActive ? '#ECFDF5' : '#F3F4F6', 
                                  color: isActive ? '#10B981' : '#9CA3AF',
                                }}>
                                <EditOutlinedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                aria-label="Delete user"
                                onClick={() => handleDelete(row.id)}
                                sx={{ 
                                  p: 0.5, 
                                  borderRadius: 1.5, 
                                  backgroundColor: isActive ? '#FEF2F2' : '#F3F4F6', 
                                  color: isActive ? '#EF4444' : '#9CA3AF',
                                }}>
                                <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </TableContainer>
          </Paper>

        </Box>
      </Box>
    </Box>
  );
};

export default UsersPage;
