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
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  CircularProgress as MuiCircularProgress
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

const CompletionBar = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '& .MuiLinearProgress-root': {
    height: 8,
    borderRadius: 4,
    flexGrow: 1,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
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

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    emergencyContact: '',
    bio: '',
    preferredLanguage: '',
    timezone: '',
    notificationPreferences: {
      email: true,
      push: true,
      moodReminders: true,
      activityReminders: true
    }
  });

  const [editMode, setEditMode] = useState({
    name: false,
    email: false,
    password: false,
    phone: false,
    address: false,
    dateOfBirth: false,
    gender: false,
    occupation: false,
    emergencyContact: false,
    bio: false,
    preferredLanguage: false,
    timezone: false
  });

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
      setFormData({
        name: user.displayName || '',
        email: user.email || '',
        password: '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        occupation: user.occupation || '',
        emergencyContact: user.emergencyContact || '',
        bio: user.bio || '',
        preferredLanguage: user.preferredLanguage || 'English',
        timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        notificationPreferences: user.notificationPreferences || {
          email: true,
          push: true,
          moodReminders: true,
          activityReminders: true
        }
      });
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

  const handleNotificationChange = async (type) => {
    const newPrefs = {
      ...formData.notificationPreferences,
      [type]: !formData.notificationPreferences[type]
    };
    setFormData(prev => ({
      ...prev,
      notificationPreferences: newPrefs
    }));
    await updateUserData('notificationPreferences', newPrefs);
  };

  const calculateProfileCompletion = useCallback(() => {
    const fieldsToCheck = [
      'name',
      'phone',
      'dateOfBirth',
      'gender',
      'occupation',
      'emergencyContact',
      'bio',
      'preferredLanguage',
      'timezone'
    ];
    
    let filledFields = 0;
    fieldsToCheck.forEach(field => {
      if (formData[field] && formData[field].toString().trim() !== '') {
        filledFields++;
      }
    });
    
    // Add avatar to completion calculation
    if (avatarPreview) {
      filledFields++;
      fieldsToCheck.push('avatar');
    }

    return Math.round((filledFields / fieldsToCheck.length) * 100);
  }, [formData, avatarPreview]);

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
          {!isMobile && (
            <CompletionBar>
              <Typography variant="body2" color="textSecondary" sx={{ minWidth: 'max-content' }}>
                Profile Completion:
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateProfileCompletion()}
                sx={{
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme => {
                      const completion = calculateProfileCompletion();
                      if (completion >= 80) return theme.palette.success.main;
                      if (completion >= 50) return theme.palette.warning.main;
                      return theme.palette.error.main;
                    },
                  },
                }}
              />
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ 
                  minWidth: '45px',
                  textAlign: 'right',
                  fontWeight: 'medium'
                }}
              >
                {`${calculateProfileCompletion()}%`}
              </Typography>
            </CompletionBar>
          )}

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
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label="Active"
                  color="success"
                  size="small"
                />
              </Box>
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
                label={isMobile ? null : "Basic Info"}
                aria-label="Basic Info"
              />
              <Tab 
                icon={<SecurityIcon sx={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }} />} 
                label={isMobile ? null : "Additional Info"}
                aria-label="Additional Info"
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
                key="basic"
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <ProfileCard elevation={2}>
                  <CardContent>
                    {/* Basic Info Fields */}
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

                    {/* Phone Field */}
                    <Box mb={3}>
                      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Phone
                      </Typography>
                      {!editMode.phone ? (
                        <Box display="flex" alignItems="center">
                          <Typography variant="body1" sx={{ flexGrow: 1 }}>
                            {formData.phone || 'Not set'}
                          </Typography>
                          <Tooltip title="Edit Phone">
                            <IconButton
                              color="primary"
                              onClick={() => setEditMode((prev) => ({ ...prev, phone: true }))}
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
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                          />
                          <Box display="flex" justifyContent="flex-end" gap={1}>
                            <GradientButton
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => openConfirmDialog('phone')}
                            >
                              Save
                            </GradientButton>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CancelIcon />}
                              onClick={() => handleCancelEdit('phone')}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* Password Field */}
                    <Box mb={3}>
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

            {activeTab === 1 && (
              <motion.div
                key="additional"
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <ProfileCard elevation={2}>
                  <CardContent>
                    {/* Additional Info Fields */}
                    <Grid container spacing={3}>
                      {/* Date of Birth */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Date of Birth
                        </Typography>
                        {!editMode.dateOfBirth ? (
                          <Box display="flex" alignItems="center">
                            <Typography variant="body1" sx={{ flexGrow: 1 }}>
                              {formData.dateOfBirth || 'Not set'}
                            </Typography>
                            <Tooltip title="Edit Date of Birth">
                              <IconButton
                                color="primary"
                                onClick={() => setEditMode((prev) => ({ ...prev, dateOfBirth: true }))}
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
                              type="date"
                              name="dateOfBirth"
                              value={formData.dateOfBirth}
                              onChange={handleChange}
                              sx={{ mb: 2 }}
                            />
                            <Box display="flex" justifyContent="flex-end" gap={1}>
                              <GradientButton
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={() => openConfirmDialog('dateOfBirth')}
                              >
                                Save
                              </GradientButton>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={() => handleCancelEdit('dateOfBirth')}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Grid>

                      {/* Gender */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Gender
                        </Typography>
                        {!editMode.gender ? (
                          <Box display="flex" alignItems="center">
                            <Typography variant="body1" sx={{ flexGrow: 1 }}>
                              {formData.gender || 'Not set'}
                            </Typography>
                            <Tooltip title="Edit Gender">
                              <IconButton
                                color="primary"
                                onClick={() => setEditMode((prev) => ({ ...prev, gender: true }))}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Box>
                            <FormControl fullWidth variant="outlined">
                              <Select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                              >
                                <MenuItem value="">
                                  <em>Select Gender</em>
                                </MenuItem>
                                <MenuItem value="male">Male</MenuItem>
                                <MenuItem value="female">Female</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                                <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                              </Select>
                            </FormControl>
                            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                              <GradientButton
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={() => openConfirmDialog('gender')}
                              >
                                Save
                              </GradientButton>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={() => handleCancelEdit('gender')}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Grid>

                      {/* Occupation */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Occupation
                        </Typography>
                        {!editMode.occupation ? (
                          <Box display="flex" alignItems="center">
                            <Typography variant="body1" sx={{ flexGrow: 1 }}>
                              {formData.occupation || 'Not set'}
                            </Typography>
                            <Tooltip title="Edit Occupation">
                              <IconButton
                                color="primary"
                                onClick={() => setEditMode((prev) => ({ ...prev, occupation: true }))}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Box>
                            <FormControl fullWidth variant="outlined">
                              <Select
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                              >
                                <MenuItem value="">
                                  <em>Select Occupation</em>
                                </MenuItem>
                                <MenuItem value="student">Student</MenuItem>
                                <MenuItem value="employed">Employed</MenuItem>
                                <MenuItem value="self-employed">Self-Employed</MenuItem>
                                <MenuItem value="business-owner">Business Owner</MenuItem>
                                <MenuItem value="freelancer">Freelancer</MenuItem>
                                <MenuItem value="unemployed">Unemployed</MenuItem>
                                <MenuItem value="retired">Retired</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                              </Select>
                            </FormControl>
                            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                              <GradientButton
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={() => openConfirmDialog('occupation')}
                              >
                                Save
                              </GradientButton>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={() => handleCancelEdit('occupation')}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Grid>

                      {/* Emergency Contact */}
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Emergency Contact
                        </Typography>
                        {!editMode.emergencyContact ? (
                          <Box display="flex" alignItems="center">
                            <Typography variant="body1" sx={{ flexGrow: 1 }}>
                              {formData.emergencyContact || 'Not set'}
                            </Typography>
                            <Tooltip title="Edit Emergency Contact">
                              <IconButton
                                color="primary"
                                onClick={() => setEditMode((prev) => ({ ...prev, emergencyContact: true }))}
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
                              name="emergencyContact"
                              value={formData.emergencyContact}
                              onChange={handleChange}
                              placeholder="Name: xxx, Relation: xxx, Phone: xxx"
                              sx={{ mb: 2 }}
                            />
                            <Box display="flex" justifyContent="flex-end" gap={1}>
                              <GradientButton
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={() => openConfirmDialog('emergencyContact')}
                              >
                                Save
                              </GradientButton>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CancelIcon />}
                                onClick={() => handleCancelEdit('emergencyContact')}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
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
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Notification Preferences
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.notificationPreferences.email}
                            onChange={() => handleNotificationChange('email')}
                            color="primary"
                          />
                        }
                        label="Email Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.notificationPreferences.push}
                            onChange={() => handleNotificationChange('push')}
                            color="primary"
                          />
                        }
                        label="Push Notifications"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.notificationPreferences.moodReminders}
                            onChange={() => handleNotificationChange('moodReminders')}
                            color="primary"
                          />
                        }
                        label="Mood Tracking Reminders"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.notificationPreferences.activityReminders}
                            onChange={() => handleNotificationChange('activityReminders')}
                            color="primary"
                          />
                        }
                        label="Activity Reminders"
                      />
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Language Preference */}
                    <Typography variant="subtitle1" gutterBottom>
                      Language Preference
                    </Typography>
                    {!editMode.preferredLanguage ? (
                      <Box display="flex" alignItems="center" mb={3}>
                        <Typography variant="body1" sx={{ flexGrow: 1 }}>
                          {formData.preferredLanguage}
                        </Typography>
                        <Tooltip title="Edit Language">
                          <IconButton
                            color="primary"
                            onClick={() => setEditMode((prev) => ({ ...prev, preferredLanguage: true }))}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Box mb={3}>
                        <FormControl fullWidth variant="outlined">
                          <Select
                            name="preferredLanguage"
                            value={formData.preferredLanguage}
                            onChange={handleChange}
                          >
                            <MenuItem value="English">English</MenuItem>
                            <MenuItem value="Spanish">Spanish</MenuItem>
                            <MenuItem value="French">French</MenuItem>
                            <MenuItem value="German">German</MenuItem>
                            <MenuItem value="Chinese">Chinese</MenuItem>
                            <MenuItem value="Japanese">Japanese</MenuItem>
                          </Select>
                        </FormControl>
                        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                          <GradientButton
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={() => openConfirmDialog('preferredLanguage')}
                          >
                            Save
                          </GradientButton>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={() => handleCancelEdit('preferredLanguage')}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    )}

                    {/* Timezone */}
                    <Typography variant="subtitle1" gutterBottom>
                      Timezone
                    </Typography>
                    {!editMode.timezone ? (
                      <Box display="flex" alignItems="center">
                        <Typography variant="body1" sx={{ flexGrow: 1 }}>
                          {formData.timezone}
                        </Typography>
                        <Tooltip title="Edit Timezone">
                          <IconButton
                            color="primary"
                            onClick={() => setEditMode((prev) => ({ ...prev, timezone: true }))}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    ) : (
                      <Box>
                        <FormControl fullWidth variant="outlined">
                          <Select
                            name="timezone"
                            value={formData.timezone}
                            onChange={handleChange}
                          >
                            {Intl.supportedValuesOf('timeZone').map((tz) => (
                              <MenuItem key={tz} value={tz}>
                                {tz}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                          <GradientButton
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={() => openConfirmDialog('timezone')}
                          >
                            Save
                          </GradientButton>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={() => handleCancelEdit('timezone')}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </ProfileCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alerts and Dialogs */}
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
                  sx={{ mt: 2 }}
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
                  sx={{ mt: 2 }}
                >
                  {success}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirmation Dialog */}
          <AnimatePresence>
            {confirmDialog.open && (
              <Dialog
                open={confirmDialog.open}
                onClose={closeConfirmDialog}
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
        </ProfileContainer>
      </Container>
    </motion.div>
  );
};

export default UserProfile;
