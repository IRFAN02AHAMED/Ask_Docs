import React, { useState } from 'react';
import { Box, Typography, Button, Divider, Avatar, IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export const SharedAdminSidebar = ({ activeMenu }) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardOutlinedIcon sx={{ fontSize: 22 }} />, id: 'dashboard' },
    { text: 'Categories', icon: <ListAltIcon sx={{ fontSize: 22 }} />, id: 'categories' },
    { text: 'Documents', icon: <InsertDriveFileOutlinedIcon sx={{ fontSize: 22 }} />, id: 'documents' },
    { text: 'Upload', icon: <FileUploadOutlinedIcon sx={{ fontSize: 22 }} />, id: 'upload' },
    { text: 'History', icon: <HistoryOutlinedIcon sx={{ fontSize: 22 }} />, id: 'history' },
    { text: 'Review', icon: <FactCheckOutlinedIcon sx={{ fontSize: 22 }} />, id: 'ai-validation' },
    { text: 'Users', icon: <PeopleOutlineOutlinedIcon sx={{ fontSize: 22 }} />, id: 'users' },
    { text: 'Logs', icon: <TextSnippetOutlinedIcon sx={{ fontSize: 22 }} />, id: 'logs' },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure that you want to logout?")) {
      logout();
      navigate('/login');
    }
  };

  const renderMenuItem = (item) => {
    const isActive = activeMenu === item.id;
    return (
      <Box 
        key={item.id}
        onClick={() => navigate('/admin/' + item.id)}
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          px: 3, 
          py: 1.5, 
          cursor: 'pointer', 
          backgroundColor: isActive ? '#d1fae2': 'transparent',
borderLeft: isActive ? '4px solid #4bb673' : '4px solid transparent',
color: isActive ? '#16A34A' : '#4B5563',
'&:hover': {
  backgroundColor: isActive ? '#d1fae2' : '#d2fbe2'
}
        }}
      >
        {item.icon}
        <Typography sx={{ fontWeight: isActive ? 600 : 500, fontSize: '0.95rem' }}>
          {item.text}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ width: 260, backgroundColor: "#F3FAF8", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #E5E7EB", height: '100vh' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ backgroundColor: '#22C55E', color: 'white', p: 0.5, borderRadius: 1, display: 'flex' }}>
          <DescriptionIcon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '1.1rem', lineHeight: 1.2 }}>Ask Docs AI</Typography>
          <Typography sx={{ color: '#6B7280', fontSize: '0.75rem', fontWeight: 500 }}>Document Intelligence</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 3, pb: 3 }}>
        {/* <Button 
          fullWidth
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/upload')}
          sx={{ 
            backgroundColor: "#22C55E", 
            textTransform: "none", 
            fontWeight: 600,
            fontSize: "0.95rem",
            borderRadius: 2,
            py: 1.2,
            boxShadow: "none",
            "&:hover": { backgroundColor: "#16A34A", boxShadow: "none" }
          }}
        >
          Upload New
        </Button> */}
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {menuItems.map(renderMenuItem)}
      </Box>

      <Box sx={{ pb: 3, pt: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box 
          onClick={() => navigate('/admin/settings')}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            px: 3, 
            py: 1.5, 
            cursor: 'pointer', 
            backgroundColor: activeMenu === 'settings' ? '#F0FDF4' : 'transparent',
            borderLeft: activeMenu === 'settings' ? '3px solid #22C55E' : '3px solid transparent',
            color: activeMenu === 'settings' ? '#15803D' : '#4B5563',
            '&:hover': {
              backgroundColor: '#F3F4F6'
            }
          }}
        >
          <SettingsOutlinedIcon sx={{ fontSize: 22 }} />
          <Typography sx={{ fontWeight: activeMenu === 'settings' ? 600 : 500, fontSize: '0.95rem' }}>
            Settings
          </Typography>
        </Box>

        <Box 
          onClick={handleLogout}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            px: 3, 
            py: 1.5, 
            cursor: 'pointer', 
            backgroundColor: 'transparent',
            borderLeft: '3px solid transparent',
            color: '#4B5563',
            '&:hover': {
              backgroundColor: '#FEE2E2',
              color: '#DC2626'
            }
          }}
        >
          <LogoutOutlinedIcon sx={{ fontSize: 22 }} />
          <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>
            Logout
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export const SharedAdminHeader = ({ title }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure that you want to logout?")) {
      logout();
      navigate('/login');
    }
  };

  const displayRole = () => {
    const role = typeof user?.role === 'object' ? user?.role?.name : user?.role;
    if (String(role).toLowerCase() === 'admin') return 'Super Administrator';
    return 'User';
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, borderBottom: '1px solid #E5E7EB', backgroundColor: 'white' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
        {title}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {/* User Info Block */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={handleAvatarClick}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem', lineHeight: 1.2 }}>
              {user?.name || 'Admin User'}
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {displayRole()}
            </Typography>
          </Box>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#111827', fontSize: '1rem', fontWeight: 600 }}>
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </Avatar>
        </Box>
        
        {/* Profile Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            elevation: 3,
            sx: { borderRadius: 2, minWidth: 220, mt: 1.5, border: '1px solid #E5E7EB' }
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB', mb: 1 }}>
            <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>{user?.name || 'Admin User'}</Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '0.8rem' }}>{user?.email || 'admin@example.com'}</Typography>
          </Box>
          <MenuItem onClick={() => { handleClose(); navigate('/admin/profile'); }}>
            <ListItemIcon>
              <PersonOutlineOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>My Profile</Typography>
          </MenuItem>
          <MenuItem onClick={() => { handleClose(); navigate('/admin/settings'); }}>
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Account Settings</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: '#DC2626', '&:hover': { backgroundColor: '#FEE2E2' } }}>
            <ListItemIcon>
              <LogoutOutlinedIcon fontSize="small" sx={{ color: '#DC2626' }} />
            </ListItemIcon>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>Logout</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};
