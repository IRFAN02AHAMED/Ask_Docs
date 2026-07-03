import React, { useState } from 'react';
import { Box, Typography, Paper, Divider, Switch, FormControlLabel, TextField, Button, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import { SharedAdminSidebar, SharedAdminHeader } from '../../components/layout/SharedLayout';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>General Settings</Typography>
            <Divider />
            <Box>
              <Typography sx={{ fontWeight: 500, mb: 1, color: '#374151' }}>Application Name</Typography>
              <TextField fullWidth variant="outlined" defaultValue="Ask Docs AI" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, mb: 1, color: '#374151' }}>Default Language</Typography>
              <TextField fullWidth variant="outlined" defaultValue="English (US)" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, mb: 1, color: '#374151' }}>Timezone</Typography>
              <TextField fullWidth variant="outlined" defaultValue="UTC" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" sx={{ backgroundColor: '#22C55E', '&:hover': { backgroundColor: '#16A34A' }, textTransform: 'none', fontWeight: 600 }}>
                Save General Settings
              </Button>
            </Box>
          </Box>
        );
      case 'notifications':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Notification Preferences</Typography>
            <Divider />
            <FormControlLabel control={<Switch defaultChecked color="success" />} label="Email alerts for new documents" />
            <FormControlLabel control={<Switch defaultChecked color="success" />} label="Email alerts for failed processing" />
            <FormControlLabel control={<Switch defaultChecked color="success" />} label="Daily summary reports" />
            <FormControlLabel control={<Switch color="success" />} label="Weekly usage reports" />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" sx={{ backgroundColor: '#22C55E', '&:hover': { backgroundColor: '#16A34A' }, textTransform: 'none', fontWeight: 600 }}>
                Save Preferences
              </Button>
            </Box>
          </Box>
        );
      case 'apikeys':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>API Configuration</Typography>
            <Divider />
            <Box>
              <Typography sx={{ fontWeight: 500, mb: 1, color: '#374151' }}>Google Gemini API Key</Typography>
              <TextField fullWidth variant="outlined" type="password" defaultValue="*************************" />
              <Typography variant="caption" sx={{ color: '#6B7280', mt: 0.5, display: 'block' }}>
                Used for main processing and embeddings.
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 500, mb: 1, color: '#374151' }}>HuggingFace Access Token</Typography>
              <TextField fullWidth variant="outlined" type="password" defaultValue="*************************" />
              <Typography variant="caption" sx={{ color: '#6B7280', mt: 0.5, display: 'block' }}>
                Used as a fallback provider.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" sx={{ backgroundColor: '#22C55E', '&:hover': { backgroundColor: '#16A34A' }, textTransform: 'none', fontWeight: 600 }}>
                Update Keys
              </Button>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#F9FAFB' }}>
      <SharedAdminSidebar activeMenu="settings" />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <SharedAdminHeader title="Settings" />
        
        <Box sx={{ p: 4, overflowY: 'auto', flexGrow: 1, display: 'flex', gap: 4 }}>
          {/* Settings Sidebar */}
          <Paper elevation={0} sx={{ width: 280, flexShrink: 0, border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activeTab === 'general'} 
                  onClick={() => setActiveTab('general')}
                  sx={{ 
                    py: 2,
                    '&.Mui-selected': { backgroundColor: '#F0FDF4', borderLeft: '3px solid #22C55E' },
                    '&.Mui-selected:hover': { backgroundColor: '#DCFCE7' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'general' ? '#15803D' : '#6B7280' }}>
                    <SettingsOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary="General Settings" sx={{ '& .MuiTypography-root': { fontWeight: activeTab === 'general' ? 600 : 500, color: activeTab === 'general' ? '#15803D' : '#374151' } }} />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activeTab === 'notifications'} 
                  onClick={() => setActiveTab('notifications')}
                  sx={{ 
                    py: 2,
                    '&.Mui-selected': { backgroundColor: '#F0FDF4', borderLeft: '3px solid #22C55E' },
                    '&.Mui-selected:hover': { backgroundColor: '#DCFCE7' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'notifications' ? '#15803D' : '#6B7280' }}>
                    <NotificationsNoneOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary="Notifications" sx={{ '& .MuiTypography-root': { fontWeight: activeTab === 'notifications' ? 600 : 500, color: activeTab === 'notifications' ? '#15803D' : '#374151' } }} />
                </ListItemButton>
              </ListItem>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton 
                  selected={activeTab === 'apikeys'} 
                  onClick={() => setActiveTab('apikeys')}
                  sx={{ 
                    py: 2,
                    '&.Mui-selected': { backgroundColor: '#F0FDF4', borderLeft: '3px solid #22C55E' },
                    '&.Mui-selected:hover': { backgroundColor: '#DCFCE7' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: activeTab === 'apikeys' ? '#15803D' : '#6B7280' }}>
                    <KeyOutlinedIcon />
                  </ListItemIcon>
                  <ListItemText primary="API Keys" sx={{ '& .MuiTypography-root': { fontWeight: activeTab === 'apikeys' ? 600 : 500, color: activeTab === 'apikeys' ? '#15803D' : '#374151' } }} />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>

          {/* Settings Content */}
          <Paper elevation={0} sx={{ flexGrow: 1, p: 4, borderRadius: 2, border: '1px solid #E5E7EB', maxWidth: 800 }}>
            {renderContent()}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;
