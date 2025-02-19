// src/pages/UserProfile.jsx

import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  useTheme,
  useMediaQuery,
  TextField,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Avatar,
  Card,
  CardContent,
  Tabs,
  Tab,
  Badge,
  Divider,
  Chip
} from '@mui/material';
import { styled, alpha } from '@mui/system';
import { AuthContext } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  DeleteForever as DeleteForeverIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

// Enhanced styled components
const ProfileContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: '24px',
  background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 50px',
  transition: 'all 0.4s ease-in-out',
  '&:hover': {
    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 15px 60px',
    transform: 'translateY(-8px)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderRadius: '16px',
  }
}));

const ProfileCard = styled(Card)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
  borderRadius: '16px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'transform 0.3s ease',
  height: '100%',
  minHeight: theme.spacing(25), // Add minimum height
  '&:hover': {
    transform: 'translateY(-4px)',
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: '12px',
    minHeight: theme.spacing(20),
  }
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `4px solid ${theme.palette.primary.main}`,
  boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05) rotate(5deg)',
    boxShadow: `0 0 30px ${alpha(theme.palette.primary.main, 0.5)}`,
  },
  [theme.breakpoints.down('sm')]: {
    width: 90,
    height: 90,
  }
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
  border: 0,
  borderRadius: '20px',
  boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
  color: 'white',
  padding: '8px 24px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 10px 4px rgba(0, 0, 0, .15)',
  },
}));

// Animation variants
const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  in: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      duration: 0.6,
      ease: [0.6, -0.05, 0.01, 0.99],
    } 
  },
  out: { opacity: 0, scale: 0.95 },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  }),
};

const UserProfile = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    user,
    isAuthenticated,
    logout,
    updateUserData,
    uploadAvatar,
    deleteAvatar,
    authLoading,
    error,
    success,
    clearError,
    clearSuccess,
    setError,
  } = useContext(AuthContext);

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [editMode, setEditMode] = useState({ name: false, email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, field: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  // Helper: Capitalize first letter
  const capitalize = (s) =>
    typeof s === 'string' && s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  // Fetch and set initial profile info on mount/update
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData({ name: user.displayName || '', email: user.email || '', password: '' });
      setAvatarPreview(user.avatar || null);
    }
  }, [isAuthenticated, user]);

  // Handler for input change (including password strength calculation)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'password') calculatePasswordStrength(value);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  const openConfirmDialog = (field) => setConfirmDialog({ open: true, field });
  const closeConfirmDialog = () => setConfirmDialog({ open: false, field: '' });

  const handleConfirmEdit = async () => {
    const field = confirmDialog.field;
    closeConfirmDialog();
    await handleFieldSubmit(field);
  };

  const handleFieldSubmit = async (field) => {
    const value = field === 'password' ? formData.password : formData[field];
    try {
      await updateUserData(field, value);
      setEditMode((prev) => ({ ...prev, [field]: false }));
      setFormData((prev) => ({
        ...prev,
        ...(field === 'password' ? { password: '' } : { [field]: value || prev[field] }),
      }));
      if (field === 'password') setPasswordStrength(0);
    } catch (err) {
      console.error('Error Updating Profile:', err.message || err);
    }
  };

  const handleCancelEdit = (field) => {
    setEditMode((prev) => ({ ...prev, [field]: false }));
    setFormData({
      name: user.displayName || '',
      email: user.email || '',
      password: '',
    });
    if (field === 'password') setPasswordStrength(0);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const getPasswordStrengthColor = useCallback(() => {
    if (passwordStrength === 100) return 'success';
    if (passwordStrength >= 75) return 'info';
    if (passwordStrength >= 50) return 'warning';
    return 'error';
  }, [passwordStrength]);

  // Handle avatar change with file size check (limit set to 1MB)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 1 * 1024 * 1024; // 1MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

      if (!allowedTypes.includes(file.type)) {
        clearSuccess();
        setError("❌ Only JPG, PNG, and GIF files are allowed.");
        return;
      }

      if (file.size > maxSize) {
        clearSuccess();
        setError("❌ File size should not exceed 1MB.");
        return;
      }

      setError(null);
      setAvatarFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setError("No file selected for avatar.");
      return;
    }
    try {
      const newAvatarUrl = await uploadAvatar(avatarFile);
      setAvatarPreview(newAvatarUrl);
      setAvatarFile(null);
      clearError();
    } catch (err) {
      setError(err.message || "Failed to upload avatar.");
    }
  };

  // When canceling, clear the selected file, clear the file input, and revert the preview
  const handleAvatarCancel = () => {
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!user?.avatar) {
      setError("No avatar to remove.");
      return;
    }
    try {
      await deleteAvatar();
      setAvatarPreview(null);
      clearError();
    } catch (err) {
      setError(err.message || "Failed to remove avatar.");
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      style={{
        minHeight: '100vh',
        background: theme.palette.background.gradient || theme.palette.background.default,
        padding: theme.spacing(isMobile ? 2 : 4),
        paddingTop: theme.spacing(isMobile ? 12 : 14), // Increased top padding
        paddingBottom: theme.spacing(isMobile ? 12 : 14), // Increased bottom padding
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        color: theme.palette.text.primary,
      }}
    >
      <Container maxWidth="lg">
        <ProfileContainer elevation={3}>
          {/* Header Section */}
          <Box mb={isMobile ? 2 : 4} textAlign="center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
              >
                <StyledAvatar
                  src={avatarPreview}
                  alt={formData.name}
                >
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                </StyledAvatar>
              </StyledBadge>
              <Typography 
                variant={isMobile ? "h5" : "h4"} 
                sx={{ 
                  mt: isMobile ? 1 : 2, 
                  fontWeight: 600,
                  fontSize: isMobile ? '1.5rem' : '2rem'
                }}
              >
                {formData.name || 'User'}
              </Typography>
              <Chip
                label="Active"
                color="success"
                size="small"
                sx={{ mt: 0.5 }}
              />
            </motion.div>
          </Box>

          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: isMobile ? 2 : 4 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab 
                icon={<EditIcon sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />} 
                label={isMobile ? null : "Profile Info"}
                aria-label="Profile Info"
              />
              <Tab 
                icon={<SecurityIcon sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />} 
                label={isMobile ? null : "Security"}
                aria-label="Security"
              />
              <Tab 
                icon={<SettingsIcon sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />} 
                label={isMobile ? null : "Preferences"}
                aria-label="Preferences"
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <AnimatePresence mode="wait">
            {activeTab === 0 && (
              <motion.div
                key="profile"
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Grid container spacing={isMobile ? 2 : 4}>
                  {/* Personal Information Section */}
                  <Grid item xs={12} md={6}>
                    <ProfileCard elevation={2}>
                      <CardContent sx={{ 
                        p: isMobile ? 2.5 : 3.5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                          Personal Information
                        </Typography>
                        <Divider sx={{ mb: isMobile ? 1.5 : 3 }} />
                        {/* Name Field */}
                        <Box mb={3}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Name
                          </Typography>
                          {!editMode.name ? (
                            <Box display="flex" alignItems="center">
                              <Typography variant="body1" sx={{ flexGrow: 1 }}>
                                {formData.name || 'Not set'}
                              </Typography>
                              <Tooltip title="Edit Name">
                                <IconButton
                                  color="primary"
                                  onClick={() => setEditMode((prev) => ({ ...prev, name: true }))}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Box>
                              <TextField
                                fullWidth
                                variant="outlined"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                sx={{ mb: 2 }}
                              />
                              <Box display="flex" justifyContent="flex-end" gap={1}>
                                <GradientButton
                                  size="small"
                                  startIcon={<SaveIcon />}
                                  onClick={() => openConfirmDialog('name')}
                                >
                                  Save
                                </GradientButton>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<CancelIcon />}
                                  onClick={() => handleCancelEdit('name')}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Box>

                        {/* Email Field */}
                        <Box mb={3}>
                          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            Email
                          </Typography>
                          {!editMode.email ? (
                            <Box display="flex" alignItems="center">
                              <Typography variant="body1" sx={{ flexGrow: 1 }}>
                                {formData.email || 'Not set'}
                              </Typography>
                              <Tooltip title="Edit Email">
                                <IconButton
                                  color="primary"
                                  onClick={() => setEditMode((prev) => ({ ...prev, email: true }))}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          ) : (
                            <Box>
                              <TextField
                                fullWidth
                                variant="outlined"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                sx={{ mb: 2 }}
                              />
                              <Box display="flex" justifyContent="flex-end" gap={1}>
                                <GradientButton
                                  size="small"
                                  startIcon={<SaveIcon />}
                                  onClick={() => openConfirmDialog('email')}
                                >
                                  Save
                                </GradientButton>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<CancelIcon />}
                                  onClick={() => handleCancelEdit('email')}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </ProfileCard>
                  </Grid>

                  {/* Avatar Section */}
                  <Grid item xs={12} md={6}>
                    <ProfileCard elevation={2}>
                      <CardContent sx={{ 
                        p: isMobile ? 2.5 : 3.5,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                          Profile Picture
                        </Typography>
                        <Divider sx={{ mb: isMobile ? 1.5 : 3 }} />
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="avatar-upload"
                            type="file"
                            onChange={handleAvatarChange}
                            ref={fileInputRef}
                          />
                          <label htmlFor="avatar-upload">
                            <GradientButton
                              component="span"
                              startIcon={<PhotoCamera />}
                              sx={{ mb: 2 }}
                            >
                              Upload New Photo
                            </GradientButton>
                          </label>
                          {avatarFile && (
                            <Box mt={2} display="flex" gap={2}>
                              <GradientButton
                                startIcon={<SaveIcon />}
                                onClick={handleAvatarUpload}
                              >
                                Save
                              </GradientButton>
                              <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={<CancelIcon />}
                                onClick={handleAvatarCancel}
                              >
                                Cancel
                              </Button>
                            </Box>
                          )}
                          {user?.avatar && (
                            <Button
                              color="error"
                              startIcon={<DeleteForeverIcon />}
                              onClick={handleAvatarRemove}
                              sx={{ mt: 2 }}
                            >
                              Remove Photo
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </ProfileCard>
                  </Grid>
                </Grid>
              </motion.div>
            )}

            {activeTab === 1 && (
              <motion.div
                key="security"
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <ProfileCard elevation={2}>
                  <CardContent sx={{ 
                    p: isMobile ? 2.5 : 3.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                      Security Settings
                    </Typography>
                    <Divider sx={{ mb: isMobile ? 1.5 : 3 }} />
                    <Box mb={4}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Password
                      </Typography>
                      {!editMode.password ? (
                        <Box display="flex" alignItems="center">
                          <Typography variant="body1" sx={{ flexGrow: 1 }}>
                            ••••••••
                          </Typography>
                          <Tooltip title="Change Password">
                            <IconButton
                              color="primary"
                              onClick={() => setEditMode((prev) => ({ ...prev, password: true }))}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box>
                          <TextField
                            fullWidth
                            variant="outlined"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            InputProps={{
                              endAdornment: (
                                <IconButton onClick={handleTogglePassword} edge="end">
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              ),
                            }}
                            sx={{ mb: 2 }}
                          />
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="textSecondary">
                              Password Strength
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={passwordStrength}
                              color={getPasswordStrengthColor()}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          <Box display="flex" justifyContent="flex-end" gap={1}>
                            <GradientButton
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => openConfirmDialog('password')}
                            >
                              Update Password
                            </GradientButton>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => handleCancelEdit('password')}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </ProfileCard>
              </motion.div>
            )}

            {activeTab === 2 && (
              <motion.div
                key="preferences"
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <ProfileCard elevation={2}>
                  <CardContent sx={{ 
                    p: isMobile ? 2.5 : 3.5,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant={isMobile ? "subtitle1" : "h6"} gutterBottom>
                      Account Preferences
                    </Typography>
                    <Divider sx={{ mb: isMobile ? 1.5 : 3 }} />
                    <Box display="flex" justifyContent="center" mt={4}>
                      <GradientButton
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleLogout}
                      >
                        Logout
                      </GradientButton>
                    </Box>
                  </CardContent>
                </ProfileCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert 
                  severity="error" 
                  onClose={clearError} 
                  sx={{ 
                    mt: 2,
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert 
                  severity="success" 
                  onClose={clearSuccess} 
                  sx={{ 
                    mt: 2,
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                >
                  {success}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </ProfileContainer>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {confirmDialog.open && (
            <Dialog
              open={confirmDialog.open}
              onClose={closeConfirmDialog}
              fullWidth
              maxWidth="xs"
              PaperProps={{
                component: motion.div,
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.9 },
                transition: { duration: 0.2 },
                sx: { m: isMobile ? 2 : 3 }
              }}
            >
              <DialogTitle>
                Confirm Changes
              </DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to update your {confirmDialog.field}?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={closeConfirmDialog} startIcon={<CancelIcon />}>
                  Cancel
                </Button>
                <GradientButton onClick={handleConfirmEdit} startIcon={<SaveIcon />}>
                  Confirm
                </GradientButton>
              </DialogActions>
            </Dialog>
          )}
        </AnimatePresence>
      </Container>
    </motion.div>
  );
};

export default UserProfile;
