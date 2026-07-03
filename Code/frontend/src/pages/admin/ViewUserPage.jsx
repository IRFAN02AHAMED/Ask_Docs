import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Divider, CircularProgress, Chip } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { SharedAdminSidebar, SharedAdminHeader } from '../../components/layout/SharedLayout';
import { useParams, useNavigate } from 'react-router-dom';
import * as userService from '../../services/userService';
import { formatDate } from '../../utils/helpers';

const ViewUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await userService.getUserById(id);
        setUserData(data);
      } catch (err) {
        setErrorMsg('Failed to fetch the user.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const getRoleChip = (role) => {
    if (!role) return null;
    const roleName = typeof role === 'object' ? role.name : role;
    const r = String(roleName).toLowerCase();
    if (r === 'admin') return <Chip label="Admin" size="small" sx={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontWeight: 600, borderRadius: 1.5 }} />;
    return <Chip label="Viewer" size="small" sx={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontWeight: 600, borderRadius: 1.5 }} />;
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
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <SharedAdminSidebar activeMenu="users" />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="View User" />
        
        <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, maxWidth: 600 }}>
            <Button 
              startIcon={<CloseOutlinedIcon />} 
              onClick={() => navigate('/admin/users')}
              sx={{ color: '#4B5563' }}
            >
              Close
            </Button>
            <Button 
              startIcon={<EditOutlinedIcon />} 
              onClick={() => navigate(`/admin/users/${id}/edit`)}
              sx={{ color: '#10B981' }}
            >
              Edit User
            </Button>
          </Box>

          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E5E7EB', maxWidth: 600 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress color="success" />
              </Box>
            ) : errorMsg ? (
              <Typography color="error">{errorMsg}</Typography>
            ) : userData ? (
              <>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>View User</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mb: 0.5 }}>Full Name</Typography>
                    <Typography sx={{ fontSize: '1rem', color: '#111827', fontWeight: 500 }}>{userData.name}</Typography>
                  </Box>
                  <Divider />
                  
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mb: 0.5 }}>Email Address</Typography>
                    <Typography sx={{ fontSize: '1rem', color: '#111827', fontWeight: 500 }}>{userData.email}</Typography>
                  </Box>
                  <Divider />
                  
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mb: 0.5 }}>Role</Typography>
                    <Box sx={{ mt: 0.5 }}>{getRoleChip(userData.role)}</Box>
                  </Box>
                  <Divider />

                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mb: 0.5 }}>Status</Typography>
                    <Box sx={{ mt: 0.5 }}>{getStatusDisplay(userData.is_active)}</Box>
                  </Box>
                  <Divider />

                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mb: 0.5 }}>Created Date</Typography>
                    <Typography sx={{ fontSize: '1rem', color: '#111827', fontWeight: 500 }}>{formatDate(userData.created_at)}</Typography>
                  </Box>
                </Box>
              </>
            ) : null}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ViewUserPage;
