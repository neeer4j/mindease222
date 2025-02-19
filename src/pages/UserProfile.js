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
} from '@mui/material';
import { styled, alpha } from '@mui/system';
import { AuthContext } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

// Styled components
const ProfileContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  borderRadius: '24px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
    boxShadow: 'rgba(17, 12, 46, 0.2) 0px 48px 100px 0px',
    transform: 'translateY(-6px)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1, 3),
  boxShadow: theme.shadows[4],
  transition: 'background 0.5s, box-shadow 0.3s',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
    boxShadow: theme.shadows[6],
  },
}));

// Framer Motion variants
const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
  in: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  out: { opacity: 0, scale: 0.95, transition: { duration: 0.3, ease: 'easeIn' } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } },
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

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        background: theme.palette.background.gradient || theme.palette.background.default,
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(10),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.palette.text.primary,
      }}
    >
      <Container maxWidth="md">
        <ProfileContainer
          component={motion.div}
          variants={fieldVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          custom={0}
        >
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            User Profile
          </Typography>
          <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
            Manage your account information and settings
          </Typography>

          {/* Avatar Section */}
          <Grid container justifyContent="center" mb={4}>
            <Grid item xs={12} sm={6}>
              <motion.div variants={fieldVariants} initial="hidden" animate="visible" exit="hidden" custom={0}>
                <Card sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '16px',
                  boxShadow: theme.shadows[3],
                  transition: 'all 0.3s ease-in-out',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                  },
                }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ alignSelf: 'flex-start' }}>
                    Profile Picture
                  </Typography>
                  <Avatar
                    src={avatarPreview}
                    alt={formData.name}
                    sx={{
                      width: { xs: 120, sm: 160 },
                      height: { xs: 120, sm: 160 },
                      fontSize: { xs: 50, sm: 64 },
                      bgcolor: theme.palette.primary.main,
                      border: `4px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                      boxShadow: theme.shadows[4],
                      mb: 2
                    }}
                  >
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <label htmlFor="avatar-upload" style={{ width: '100%' }}>
                      <Button 
                        variant="contained" 
                        component="span" 
                        startIcon={<PhotoCamera />} 
                        disabled={authLoading}
                        fullWidth
                      >
                        Upload Avatar
                      </Button>
                    </label>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="avatar-upload"
                      type="file"
                      onChange={handleAvatarChange}
                      ref={fileInputRef}
                    />
                    
                    {avatarFile && (
                      <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <GradientButton 
                          variant="contained" 
                          color="success" 
                          startIcon={<SaveIcon />} 
                          onClick={handleAvatarUpload} 
                          disabled={authLoading}
                          fullWidth
                        >
                          Save
                        </GradientButton>
                        <Button 
                          variant="outlined" 
                          color="secondary" 
                          startIcon={<CancelIcon />} 
                          onClick={handleAvatarCancel} 
                          disabled={authLoading}
                          fullWidth
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                    
                    {user?.avatar && !avatarFile && (
                      <Button 
                        variant="text" 
                        color="error" 
                        startIcon={<DeleteForeverIcon />} 
                        onClick={handleAvatarRemove} 
                        disabled={authLoading}
                        fullWidth
                      >
                        Remove Avatar
                      </Button>
                    )}
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Feedback Messages */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="error">
                <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="success">
                <Alert severity="success" onClose={clearSuccess} sx={{ mb: 2 }}>
                  {success}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Fields */}
          <Grid container spacing={3} mt={2}>
            {/* Name Field */}
            <Grid item xs={12} sm={6}>
              <motion.div variants={fieldVariants} initial="hidden" animate="visible" exit="hidden" custom={1}>
                <Card sx={{
                  p: 2,
                  height: '100%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '16px',
                  boxShadow: theme.shadows[3],
                  transition: 'all 0.3s ease-in-out',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                  },
                }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
                    Name:
                  </Typography>
                  {!editMode.name ? (
                    <Box display="flex" alignItems="center">
                      <Typography variant="body1" color="textPrimary" sx={{ flexGrow: 1 }}>
                        {formData.name || 'N/A'}
                      </Typography>
                      <Tooltip title="Edit Name">
                        <IconButton color="primary" onClick={() => setEditMode((prev) => ({ ...prev, name: true }))} aria-label="Edit Name">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        label="Name"
                        name="name"
                        variant="outlined"
                        fullWidth
                        value={formData.name}
                        onChange={handleChange}
                        required
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 1 }}
                      />
                      <Box display="flex" justifyContent="flex-end">
                        <GradientButton variant="contained" size="small" startIcon={<SaveIcon />} onClick={() => openConfirmDialog('name')} sx={{ mr: 1 }} disabled={authLoading}>
                          Save
                        </GradientButton>
                        <Button variant="outlined" color="secondary" size="small" startIcon={<CancelIcon />} onClick={() => handleCancelEdit('name')} disabled={authLoading}>
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Card>
              </motion.div>
            </Grid>

            {/* Email Field */}
            <Grid item xs={12} sm={6}>
              <motion.div variants={fieldVariants} initial="hidden" animate="visible" exit="hidden" custom={2}>
                <Card sx={{
                  p: 2,
                  height: '100%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '16px',
                  boxShadow: theme.shadows[3],
                  transition: 'all 0.3s ease-in-out',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.15)} 0%, ${alpha(theme.palette.info.main, 0.08)} 100%)`,
                  },
                }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
                    Email:
                  </Typography>
                  {!editMode.email ? (
                    <Box display="flex" alignItems="center">
                      <Typography variant="body1" color="textPrimary" sx={{ flexGrow: 1 }}>
                        {formData.email || 'N/A'}
                      </Typography>
                      <Tooltip title="Edit Email">
                        <IconButton color="primary" onClick={() => setEditMode((prev) => ({ ...prev, email: true }))} aria-label="Edit Email">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        label="Email"
                        name="email"
                        variant="outlined"
                        type="email"
                        fullWidth
                        value={formData.email}
                        onChange={handleChange}
                        required
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 1 }}
                      />
                      <Box display="flex" justifyContent="flex-end">
                        <GradientButton variant="contained" size="small" startIcon={<SaveIcon />} onClick={() => openConfirmDialog('email')} sx={{ mr: 1 }} disabled={authLoading}>
                          Save
                        </GradientButton>
                        <Button variant="outlined" color="secondary" size="small" startIcon={<CancelIcon />} onClick={() => handleCancelEdit('email')} disabled={authLoading}>
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Card>
              </motion.div>
            </Grid>

            {/* Password Field */}
            <Grid item xs={12} sm={6}>
              <motion.div variants={fieldVariants} initial="hidden" animate="visible" exit="hidden" custom={3}>
                <Card sx={{
                  p: 2,
                  height: '100%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '16px',
                  boxShadow: theme.shadows[3],
                  transition: 'all 0.3s ease-in-out',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.15)} 0%, ${alpha(theme.palette.success.main, 0.08)} 100%)`,
                  },
                }}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
                    Password:
                  </Typography>
                  {!editMode.password ? (
                    <Box display="flex" alignItems="center">
                      <Typography variant="body1" color="textPrimary" sx={{ flexGrow: 1 }}>
                        ********
                      </Typography>
                      <Tooltip title="Change Password">
                        <IconButton color="primary" onClick={() => setEditMode((prev) => ({ ...prev, password: true }))} aria-label="Change Password">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        label="New Password"
                        name="password"
                        variant="outlined"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        value={formData.password}
                        onChange={handleChange}
                        required
                        helperText="Enter a new password to update."
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 1 }}
                        InputProps={{
                          endAdornment: (
                            <IconButton onClick={handleTogglePassword} edge="end" aria-label="Toggle Password Visibility">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          ),
                        }}
                      />
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Password Strength:
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={passwordStrength}
                          color={getPasswordStrengthColor()}
                          sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                        />
                      </Box>
                      <Box display="flex" justifyContent="flex-end">
                        <GradientButton variant="contained" size="small" startIcon={<SaveIcon />} onClick={() => openConfirmDialog('password')} sx={{ mr: 1 }} disabled={authLoading}>
                          Save
                        </GradientButton>
                        <Button variant="outlined" color="secondary" size="small" startIcon={<CancelIcon />} onClick={() => handleCancelEdit('password')} disabled={authLoading}>
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Logout Button */}
          <Box display="flex" justifyContent="flex-end" mt={4}>
            <GradientButton variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleLogout} disabled={authLoading}>
              Logout
            </GradientButton>
          </Box>
        </ProfileContainer>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {confirmDialog.open && (
            <Dialog
              open={confirmDialog.open}
              onClose={closeConfirmDialog}
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-description"
              component={motion.div}
              transition={{ duration: 0.3 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <DialogTitle id="confirm-dialog-title">Confirm Save</DialogTitle>
              <DialogContent>
                <DialogContentText id="confirm-dialog-description">
                  Are you sure you want to save changes to your {capitalize(confirmDialog.field)}?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={closeConfirmDialog} color="secondary" startIcon={<CancelIcon />}>
                  Cancel
                </Button>
                <GradientButton onClick={handleConfirmEdit} color="primary" startIcon={<SaveIcon />}>
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
