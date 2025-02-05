// src/pages/UserProfile.jsx

import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Button,
    Grid,
    Box,
    useTheme,
    useMediaQuery,
    TextField,
    CircularProgress,
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
} from '@mui/material';
import { styled } from '@mui/system';
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

// Styled components for better UI
const ProfileContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    marginTop: theme.spacing(4),
    boxShadow: theme.shadows[3],
    borderRadius: theme.spacing(3),
    background: theme.palette.background.paper,
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

const pageVariants = {
    initial: {
        opacity: 0,
        scale: 0.95,
    },
    in: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
    out: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.3,
            ease: 'easeIn',
        },
    },
};

const fieldVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.05,
            duration: 0.4,
            ease: 'easeOut',
        },
    }),
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } },
};

const UserProfile = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user, isAuthenticated, logout, updateUserData, uploadAvatar, deleteAvatar, authLoading, error, success, clearError, clearSuccess, setError } = useContext(AuthContext); // ADDED setError to context destructuring

    // State variables for form fields
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    // State to track which field is being edited
    const [editMode, setEditMode] = useState({
        name: false,
        email: false,
        password: false,
    });

    // State for password visibility
    const [showPassword, setShowPassword] = useState(false);

    // State for password strength
    const [passwordStrength, setPasswordStrength] = useState(0);

    // State for confirmation dialogs
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        field: '',
    });

    // State for avatar upload
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Helper function to capitalize
    const capitalize = (s) => {
        if (typeof s !== "string") return "";
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    // Fetch user profile on component mount via AuthContext
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setFormData({
                    name: user.displayName || '',
                    email: user.email || '',
                    password: '',
                });
                setAvatarPreview(user.avatar || null);
            } catch (err) {
                console.error('Error fetching profile:', err);
                // Handle error if needed
            }
        };

        if (isAuthenticated && user) {
            fetchProfile();
        }
    }, [isAuthenticated, user]);

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // If password field is being updated, calculate strength
        if (name === 'password') {
            calculatePasswordStrength(value);
        }
    };

    // Calculate password strength (simple example)
    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        setPasswordStrength(strength);
    };

    // Toggle password visibility
    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    // Open confirmation dialog
    const handleOpenConfirmDialog = (field) => {
        setConfirmDialog({
            open: true,
            field: field,
        });
    };

    // Close confirmation dialog
    const handleCloseConfirmDialog = () => {
        setConfirmDialog({
            open: false,
            field: '',
        });
    };

    // Confirm edit and submit
    const handleConfirmEdit = async () => {
        const field = confirmDialog.field;
        setConfirmDialog({
            open: false,
            field: '',
        });
        await handleFieldSubmit(field);
    };

    // Handle individual field submission
    const handleFieldSubmit = async (field) => {
        try {
            let value;
            if (field === 'password') {
                value = formData.password;
            } else {
                value = formData[field];
            }

            // Update user data via AuthContext
            await updateUserData(field, value);

            console.log('Profile Update Response:', value);
            setEditMode({ ...editMode, [field]: false });

            // Reset formData for password or update the corresponding field
            if (field !== 'password') {
                setFormData((prevData) => ({
                    ...prevData,
                    [field]: value || prevData[field],
                }));
            } else {
                setFormData((prevData) => ({
                    ...prevData,
                    password: '',
                }));
                setPasswordStrength(0);
            }
        } catch (err) {
            console.error('Error Updating Profile:', err.message || err);
            // The context's error state is already set, so no need to set it again here
        }
    };

    // Handle canceling edit mode for a field
    const handleCancelEdit = (field) => {
        setEditMode({ ...editMode, [field]: false });
        // Reset form data to original user data
        setFormData((prevData) => ({
            ...prevData,
            name: user.displayName || '',
            email: user.email || '',
            password: '',
        }));
        setPasswordStrength(0);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error("Logout failed:", err);
            // The context's error state is already set
        }
    };

    // Password strength color
    const getPasswordStrengthColor = () => {
        if (passwordStrength === 100) return 'success';
        if (passwordStrength >= 75) return 'info';
        if (passwordStrength >= 50) return 'warning';
        return 'error';
    };

    // Handle avatar file selection
    const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        console.log("📂 Selected file:", file);

        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            clearSuccess();
            setError("❌ Only JPG, PNG, and GIF files are allowed.");
            return;
        }

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            clearSuccess();
            setError("❌ File size should not exceed 2MB.");
            return;
        }

        setAvatarFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            console.log("🖼️ Image preview generated");
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);
    }
};


    // Handle avatar upload
    const handleAvatarUpload = async () => {
        if (!avatarFile) {
            setError("No file selected for avatar."); // setError is used here
            return;
        }

        try {
            // Upload the avatar and get the new URL from the response
            const newAvatarUrl = await uploadAvatar(avatarFile);

            // Update preview with the new URL
            setAvatarPreview(newAvatarUrl);
            setAvatarFile(null);
            clearError();
            // Success message is handled by context
        } catch (err) {
            setError(err.message || "Failed to upload avatar."); // setError is used here
        }
    };

    // Handle avatar removal
    const handleAvatarRemove = async () => {
        if (!user?.avatar) {
            setError("No avatar to remove."); // setError is used here
            return;
        }

        try {
            await deleteAvatar();
            clearError();
            // Success message is handled by context
        } catch (err) {
            setError(err.message || "Failed to remove avatar."); // setError is used here
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
            }}
        >
            <Container maxWidth="md">
                <ProfileContainer component={motion.div} variants={fieldVariants} initial="hidden" animate="visible" exit="hidden" custom={0}>
                    <Typography
                        variant="h4"
                        align="center"
                        gutterBottom
                        sx={{ fontWeight: 700, color: theme.palette.text.primary }}
                    >
                        User Profile
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        align="center"
                        color="textSecondary"
                        gutterBottom
                    >
                        Manage your account information and settings
                    </Typography>

                    {/* Avatar Section */}
                    <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
                        <Avatar
                            src={avatarPreview}
                            alt={formData.name}
                            sx={{
                                width: 120,
                                height: 120,
                                fontSize: 50,
                                bgcolor: theme.palette.primary.main,
                            }}
                        >
                            {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="avatar-upload"
                            type="file"
                            onChange={handleAvatarChange}
                            ref={fileInputRef}
                        />
                        <label htmlFor="avatar-upload">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<PhotoCamera />}
                                sx={{ mt: 2 }}
                                disabled={authLoading}
                            >
                                Upload Avatar
                            </Button>
                        </label>
                        {avatarFile && (
                            <Box mt={2} display="flex" alignItems="center">
                                <GradientButton
                                    variant="contained"
                                    color="success"
                                    startIcon={<SaveIcon />}
                                    onClick={handleAvatarUpload}
                                    sx={{ mr: 2 }}
                                    disabled={authLoading}
                                >
                                    Save
                                </GradientButton>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<CancelIcon />}
                                    onClick={() => setAvatarFile(null)}
                                    disabled={authLoading}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        )}
                        {user.avatar && (
                            <Box mt={2}>
                                <Button
                                    variant="text"
                                    color="error"
                                    startIcon={<DeleteForeverIcon />}
                                    onClick={handleAvatarRemove}
                                    disabled={authLoading}
                                >
                                    Remove Avatar
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* Feedback Messages */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                key="error"
                            >
                                <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                key="success"
                            >
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
                                <Typography variant="subtitle2" color="textSecondary">
                                    Name:
                                </Typography>
                                {!editMode.name ? (
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="body1" color="textPrimary" sx={{ flexGrow: 1 }}>
                                            {formData.name || 'N/A'}
                                        </Typography>
                                        <Tooltip title="Edit Name">
                                            <IconButton
                                                color="primary"
                                                onClick={() => setEditMode({ ...editMode, name: true })}
                                                aria-label="Edit Name"
                                            >
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
                                            <GradientButton
                                                variant="contained"
                                                size="small"
                                                startIcon={<SaveIcon />}
                                                onClick={() => handleOpenConfirmDialog('name')}
                                                sx={{ mr: 1 }}
                                                disabled={authLoading}
                                            >
                                                Save
                                            </GradientButton>
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                size="small"
                                                startIcon={<CancelIcon />}
                                                onClick={() => handleCancelEdit('name')}
                                                disabled={authLoading}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </motion.div>
                        </Grid>

                        {/* Email Field */}
                        <Grid item xs={12} sm={6}>
                            <motion.div variants={fieldVariants} initial="hidden" animate="visible" exit="hidden" custom={2}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Email:
                                </Typography>
                                {!editMode.email ? (
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="body1" color="textPrimary" sx={{ flexGrow: 1 }}>
                                            {formData.email || 'N/A'}
                                        </Typography>
                                        <Tooltip title="Edit Email">
                                            <IconButton
                                                color="primary"
                                                onClick={() => setEditMode({ ...editMode, email: true })}
                                                aria-label="Edit Email"
                                            >
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
                                            <GradientButton
                                                variant="contained"
                                                size="small"
                                                startIcon={<SaveIcon />}
                                                onClick={() => handleOpenConfirmDialog('email')}
                                                sx={{ mr: 1 }}
                                                disabled={authLoading}
                                            >
                                                Save
                                            </GradientButton>
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                size="small"
                                                startIcon={<CancelIcon />}
                                                onClick={() => handleCancelEdit('email')}
                                                disabled={authLoading}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </motion.div>
                        </Grid>

                        {/* Password Field */}
                        <Grid item xs={12} sm={6}>
                            <motion.div variants={fieldVariants} initial="hidden" animate="visible" exit="hidden" custom={3}>
                                <Typography variant="subtitle2" color="textSecondary">
                                    Password:
                                </Typography>
                                {!editMode.password ? (
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="body1" color="textPrimary" sx={{ flexGrow: 1 }}>
                                            ********
                                        </Typography>
                                        <Tooltip title="Change Password">
                                            <IconButton
                                                color="primary"
                                                onClick={() => setEditMode({ ...editMode, password: true })}
                                                aria-label="Change Password"
                                            >
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
                                        {/* Password Strength Indicator */}
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
                                            <GradientButton
                                                variant="contained"
                                                size="small"
                                                startIcon={<SaveIcon />}
                                                onClick={() => handleOpenConfirmDialog('password')}
                                                sx={{ mr: 1 }}
                                                disabled={authLoading}
                                            >
                                                Save
                                            </GradientButton>
                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                size="small"
                                                startIcon={<CancelIcon />}
                                                onClick={() => handleCancelEdit('password')}
                                                disabled={authLoading}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </motion.div>
                        </Grid>
                    </Grid>

                    {/* Logout Button */}
                    <Box display="flex" justifyContent="flex-end" mt={4}>
                        <GradientButton
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleLogout}
                            disabled={authLoading}
                        >
                            Logout
                        </GradientButton>
                    </Box>
                </ProfileContainer>

                {/* Confirmation Dialog */}
                <AnimatePresence>
                    {confirmDialog.open && (
                        <Dialog
                            open={confirmDialog.open}
                            onClose={handleCloseConfirmDialog}
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
                                <Button onClick={handleCloseConfirmDialog} color="secondary" startIcon={<CancelIcon />}>
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