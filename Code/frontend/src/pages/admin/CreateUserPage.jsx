import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider, Alert, CircularProgress, Select, MenuItem, InputLabel, FormControl, InputAdornment, IconButton } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { SharedAdminSidebar, SharedAdminHeader } from '../../components/layout/SharedLayout';
import { useNavigate } from 'react-router-dom';
import * as userService from '../../services/userService';
import * as authService from '../../services/authService';

const CreateUserPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role_id: '' });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesData = await userService.getRoles();
        // Filter roles to only show Admin and Viewer
        const filteredRoles = rolesData.filter(r => 
          r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'viewer'
        );
        setRoles(filteredRoles);
        
        // Default to viewer if available
        const viewerRole = filteredRoles.find(r => r.name.toLowerCase() === 'viewer');
        if (viewerRole) {
          setFormData(prev => ({ ...prev, role_id: viewerRole.id }));
        }
      } catch (err) {
        setErrorMsg('Failed to load roles.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role_id: formData.role_id
      });
      setSuccessMsg('User created successfully.');
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <SharedAdminSidebar activeMenu="users" />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="Create User" />
        
        <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>
          <Button 
            startIcon={<ArrowBackOutlinedIcon />} 
            onClick={() => navigate('/admin/users')}
            sx={{ mb: 3, color: '#4B5563', textTransform: 'none', fontWeight: 600 }}
          >
            Back to Users
          </Button>

          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E5E7EB', maxWidth: 600 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress color="success" />
              </Box>
            ) : (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#111827' }}>Create New User</Typography>
                
                {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{successMsg}</Alert>}
                {errorMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{errorMsg}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter full name"
                  />
                  
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter email address"
                  />
                  
                  <TextField
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter a secure password"
                    helperText="Password must be at least 6 characters long."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role_id"
                      value={formData.role_id}
                      onChange={handleChange}
                      label="Role"
                    >
                      {roles.map(r => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name.toLowerCase() === 'viewer' ? 'Viewer' : (r.name.charAt(0).toUpperCase() + r.name.slice(1))}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving || !formData.name.trim() || !formData.email.trim() || formData.password.length < 6 || !formData.role_id}
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveOutlinedIcon />}
                      sx={{ 
                        backgroundColor: '#10B981', 
                        px: 4,
                        py: 1.2,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 2,
                        boxShadow: 'none',
                        '&:hover': { backgroundColor: '#059669', boxShadow: 'none' }
                      }}
                    >
                      Create User
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateUserPage;
