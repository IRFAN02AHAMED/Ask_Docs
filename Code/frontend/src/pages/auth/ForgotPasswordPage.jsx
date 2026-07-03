import React from "react";
import { Box, Typography, Button, Paper, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DescriptionIcon from "@mui/icons-material/Description";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ROUTES from "../../routes/routePaths";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@kbsystem.com";

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#FAFAFA',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3
    }}>
      <Paper sx={{ 
        width: '100%', 
        maxWidth: 460, 
        backgroundColor: 'white', 
        borderRadius: 4, 
        p: { xs: 4, sm: 5 }, 
        boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
        border: '1px solid #E5E7EB',
        textAlign: 'center'
      }}>
        {/* Header Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
          <DescriptionIcon sx={{ fontSize: 32, color: '#1B4D3E', mr: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B4D3E', letterSpacing: '-0.5px' }}>
            Ask Docs
          </Typography>
        </Box>

        {/* Title & Subtitle */}
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#111827', mb: 2 }}>
          Forgot Password
        </Typography>
        
        <Typography sx={{ color: '#4B5563', fontSize: '0.95rem', mb: 4, lineHeight: 1.6 }}>
          Please contact the administrator to reset or change your password.
        </Typography>

        {/* Admin Contact Information Box */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 1.5,
          p: 3, 
          backgroundColor: '#F9FAFB', 
          borderRadius: 3, 
          border: '1px solid #E5E7EB',
          mb: 4
        }}>
          <MailOutlineIcon sx={{ color: '#1B4D3E', fontSize: 28 }} />
          <Box>
            <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Administrator Email
            </Typography>
            <Link 
              href={`mailto:${adminEmail}`} 
              underline="hover" 
              sx={{ 
                fontSize: '1.05rem', 
                fontWeight: 700, 
                color: '#1B4D3E',
                display: 'block',
                mt: 0.5
              }}
            >
              {adminEmail}
            </Link>
          </Box>
        </Box>

        {/* Action Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate(ROUTES.LOGIN)}
          startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
          sx={{ 
            py: 1.5, 
            backgroundColor: '#002E24', 
            color: 'white', 
            fontWeight: 600, 
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '0.95rem',
            boxShadow: 'none',
            '&:hover': { 
              backgroundColor: '#1B4D3E',
              boxShadow: 'none'
            }
          }}
        >
          Back to Login
        </Button>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
