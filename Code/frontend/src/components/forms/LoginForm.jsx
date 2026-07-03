import React, { useState } from "react";
import { Box, TextField, Typography, Alert, Checkbox, FormControlLabel, Link, InputAdornment, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import ThumbsUpDownOutlinedIcon from "@mui/icons-material/ThumbsUpDownOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { IconButton } from "@mui/material";

const LoginForm = ({ email, password, rememberMe, onEmailChange, onPasswordChange, onRememberMeChange, onSubmit, loading, error }) => {
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const defaultAdminEmail = "admin@kbsystem.com";

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#FAFAFA',
      // Fix for Webkit (Chrome/Safari) Autofill UI bug
      '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
        WebkitBoxShadow: '0 0 0 30px white inset !important',
        WebkitTextFillColor: '#111827 !important',
        transition: 'background-color 5000s ease-in-out 0s',
      }
    }}>
      {/* Left Side - Dark Green Branding */}
      <Box sx={{ 
        flex: 1, 
        backgroundColor: '#1B4D3E', // Matches dark green aesthetic
        color: 'white',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        p: 8
      }}>
        <Box sx={{ maxWidth: 480, mx: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <DescriptionIcon sx={{ fontSize: 36, color: '#A7F3D0', mr: 2 }} />
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#A7F3D0', letterSpacing: '-0.5px' }}>
              Ask Docs
            </Typography>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.3 }}>
            Turn documents into trusted AI answers.
          </Typography>
          
          <Typography sx={{ color: '#D1FAE5', fontSize: '1.1rem', mb: 6, lineHeight: 1.6 }}>
            Upload documents, publish verified knowledge, and ask questions with source-backed AI responses.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SearchIcon sx={{ color: '#A7F3D0' }} />
              <Typography sx={{ color: '#D1FAE5', fontWeight: 500 }}>Ask questions from documents</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <LightbulbOutlinedIcon sx={{ color: '#A7F3D0' }} />
              <Typography sx={{ color: '#D1FAE5', fontWeight: 500 }}>Get AI answers with sources</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <GppGoodOutlinedIcon sx={{ color: '#A7F3D0' }} />
              <Typography sx={{ color: '#D1FAE5', fontWeight: 500 }}>Admin verifies before publishing</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ThumbsUpDownOutlinedIcon sx={{ color: '#A7F3D0' }} />
              <Typography sx={{ color: '#D1FAE5', fontWeight: 500 }}>Helpful / not helpful feedback</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Side - Form */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 4
      }}>
        <Box sx={{ 
          width: '100%', 
          maxWidth: 420, 
          backgroundColor: 'white', 
          borderRadius: 3, 
          p: { xs: 4, sm: 5 }, 
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)' 
        }}>
          {!showContactAdmin ? (
            <Box component="form" onSubmit={onSubmit} autoComplete="off">
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#002E24', textAlign: 'center', mb: 4 }}>
                Welcome Back
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', mb: 1 }}>Email</Typography>
                <TextField
                  fullWidth
                  required
                  placeholder="you@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlineIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2 }
                  }}
                />
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827', mb: 1 }}>Password</Typography>
                <TextField
                  fullWidth
                  required
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" sx={{ color: '#9CA3AF' }} /> : <Visibility fontSize="small" sx={{ color: '#9CA3AF' }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2 }
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <FormControlLabel 
                  control={
                    <Checkbox 
                      size="small" 
                      checked={rememberMe}
                      onChange={(e) => onRememberMeChange(e.target.checked)}
                      sx={{ color: '#D1D5DB', '&.Mui-checked': { color: '#1B4D3E' } }} 
                    />
                  } 
                  label={<Typography sx={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: 500 }}>Remember me</Typography>} 
                />
                <Link component={RouterLink} to="/forgot-password" underline="hover" sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#002E24' }}>
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                endIcon={!loading && <ArrowForwardIcon sx={{ fontSize: 18 }} />}
                sx={{ 
                  py: 1.5, 
                  backgroundColor: '#002E24', 
                  color: 'white', 
                  fontWeight: 600, 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#001a14', boxShadow: 'none' }
                }}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>

              <Typography sx={{ textAlign: 'center', mt: 4, fontSize: '0.9rem', color: '#6B7280' }}>
                Need an account?{' '}
                <Link 
                  component="button" 
                  type="button"
                  onClick={() => setShowContactAdmin(true)} 
                  underline="hover" 
                  sx={{ fontWeight: 700, color: '#002E24' }}
                >
                  Contact Admin
                </Link>
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#002E24', textAlign: 'center', mb: 3 }}>
                Need an Account?
              </Typography>

              <Typography sx={{ color: '#4B5563', fontSize: '0.95rem', mb: 3, lineHeight: 1.6 }}>
                Ask Docs is a private document knowledge base. Access is managed by your organization's administrators.
              </Typography>

              <Box sx={{ backgroundColor: '#F9FAFB', p: 3, borderRadius: 2, mb: 4, border: '1px solid #E5E7EB' }}>
                <Typography sx={{ fontWeight: 600, color: '#111827', mb: 1 }}>How to get access:</Typography>
                <Typography sx={{ color: '#4B5563', fontSize: '0.9rem', lineHeight: 1.6, mb: 2 }}>
                  Please email the administrator requesting an account. The admin will verify your details.
                </Typography>
                <Typography sx={{ color: '#4B5563', fontSize: '0.9rem', lineHeight: 1.6, mb: 3 }}>
                  Once verified, you will receive an email containing your credentials so you may access the system.
                </Typography>
                
                <Typography sx={{ fontWeight: 600, color: '#111827', mb: 0.5, fontSize: '0.9rem' }}>Admin Email:</Typography>
                <Typography sx={{ color: '#002E24', fontWeight: 600 }}>{defaultAdminEmail}</Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                href={`mailto:${defaultAdminEmail}?subject=Request%20Account%20for%20Ask%20Docs`}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                sx={{ 
                  py: 1.5, 
                  backgroundColor: '#002E24', 
                  color: 'white', 
                  fontWeight: 600, 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  mb: 3,
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#001a14', boxShadow: 'none' }
                }}
              >
                Email Admin
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link 
                  component="button" 
                  type="button"
                  onClick={() => setShowContactAdmin(false)} 
                  underline="hover" 
                  sx={{ fontWeight: 700, color: '#002E24', fontSize: '0.9rem' }}
                >
                  Back to Login
                </Link>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default LoginForm;
