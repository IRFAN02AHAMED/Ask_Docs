import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Paper, Divider, Alert, CircularProgress } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { SharedAdminSidebar, SharedAdminHeader } from '../../components/layout/SharedLayout';
import useAuthStore from '../../store/authStore';
import * as userService from '../../services/userService';

const ProfilePage = () => {
  const { user, fetchMe } = useAuthStore();
  const [formData, setFormData] = useState({ name: '', email: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: typeof user.role === 'object' ? user.role.name : user.role || 'viewer'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      if (!user?.id) throw new Error("User ID not found");
      
      // Update the user using the API
      await userService.updateUser(user.id, { name: formData.name });
      
      // Fetch the updated profile to update the auth store
      await fetchMe();
      
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const displayRole = (role) => {
    if (String(role).toLowerCase() === 'admin') return 'Admin';
    return 'Viewer';
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <SharedAdminSidebar activeMenu="profile" />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="My Profile" />
        
        <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E5E7EB', maxWidth: 600 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Personal Information</Typography>
            
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
              

              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading || !formData.name.trim()}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveOutlinedIcon />}
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
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;
