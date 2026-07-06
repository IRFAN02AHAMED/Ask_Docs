import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider, Alert, CircularProgress, Select, MenuItem, InputLabel, FormControl, FormControlLabel, Switch } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { SharedAdminSidebar, SharedAdminHeader } from '../../components/layout/SharedLayout';
import { useParams, useNavigate } from 'react-router-dom';
import * as userService from '../../services/userService';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', role_id: '', is_active: true });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, rolesData] = await Promise.all([
          userService.getUserById(id),
          userService.getRoles()
        ]);
        
        // Filter roles to only show Admin and Viewer
        const filteredRoles = rolesData.filter(r => 
          r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'viewer'
        );
        setRoles(filteredRoles);

        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          role_id: userData.role?.id || '',
          is_active: userData.is_active ?? true,
          role_name: userData.role?.name || ''
        });
      } catch (err) {
        setErrorMsg('Failed to load user details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const updateData = {
        name: formData.name,
        is_active: formData.is_active,
      };
      if (formData.role_id) {
        updateData.role_id = formData.role_id;
      }
      await userService.updateUser(id, updateData);
      setSuccessMsg('User updated successfully.');
      setTimeout(() => navigate('/admin/users'), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <SharedAdminSidebar activeMenu="users" />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="Edit User" />
        
        <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>
          <Button 
            startIcon={<ArrowBackOutlinedIcon />} 
            onClick={() => navigate('/admin/users')}
            sx={{ mb: 3, color: '#4B5563' }}
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
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>User Details</Typography>
                
                {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
                {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    variant="outlined"
                  />
                  
                  <TextField
                    label="Email Address"
                    name="email"
                    value={formData.email}
                    disabled
                    fullWidth
                    variant="outlined"
                    helperText="Email address cannot be changed."
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
                      {!roles.find(r => r.id === formData.role_id) && formData.role_id && (
                         <MenuItem value={formData.role_id}>
                           {String(formData.role_name).toLowerCase() === 'admin' ? 'Admin' : 'Viewer'}
                         </MenuItem>
                      )}
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch 
                        checked={formData.is_active} 
                        onChange={handleChange} 
                        name="is_active" 
                        color="success" 
                      />
                    }
                    label={formData.is_active ? "Active" : "Inactive"}
                  />
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving || !formData.name.trim()}
                      startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveOutlinedIcon />}
                      sx={{ 
                        backgroundColor: '#22C55E', 
                        px: 4,
                        py: 1.2,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': { backgroundColor: '#16A34A' }
                      }}
                    >
                      Save Changes
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

export default EditUserPage;
