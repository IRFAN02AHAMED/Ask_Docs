import React from 'react';
import { Box, Typography, Paper, Grid, Divider, Avatar } from '@mui/material';
import useAuthStore from '../../store/authStore';

const UserSettingsPage = () => {
  const { user } = useAuthStore();
  
  const roleName = user?.role?.name || user?.role_name || user?.role || "User";
  const displayRole = roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', mb: 4 }}>
        Settings
      </Typography>

      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E5E7EB', maxWidth: 800 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#111827' }}>
          Profile Information
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: '#111827', fontSize: '1.5rem', fontWeight: 600 }}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#111827' }}>
              {user?.name || 'User'}
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '0.9rem' }}>
              {displayRole} Account
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
              Full Name
            </Typography>
            <Typography sx={{ color: '#111827', fontWeight: 500 }}>
              {user?.name || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
              Email Address
            </Typography>
            <Typography sx={{ color: '#111827', fontWeight: 500 }}>
              {user?.email || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography sx={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
              Role
            </Typography>
            <Typography sx={{ color: '#111827', fontWeight: 500 }}>
              {displayRole}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 5, p: 3, backgroundColor: '#F9FAFB', borderRadius: 2, border: '1px dashed #D1D5DB' }}>
          <Typography sx={{ color: '#4B5563', fontSize: '0.9rem', textAlign: 'center' }}>
            Profile settings can be managed by administrator.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default UserSettingsPage;
