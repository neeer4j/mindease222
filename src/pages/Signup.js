// frontend/src/components/Signup.jsx
import React, { useState, useContext, useEffect } from 'react';
import {
    Box,
    Button,
    Checkbox,
    CssBaseline,
    Divider,
    FormControlLabel,
    FormControl,
    FormLabel,
    IconButton,
    Link as MuiLink,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Stack,
    Card as MuiCard,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Visibility, VisibilityOff, Brightness4, Brightness7 } from '@mui/icons-material';
import { FcGoogle } from 'react-icons/fc';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ForgotPassword from './ForgotPassword';
import { SitemarkIcon } from './CustomIcons';
import AppTheme from '../shared-theme/AppTheme';
import { useTheme } from '@mui/material/styles';

// Styled Components
const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(3), // Reduced padding for mobile
    gap: theme.spacing(2),
    margin: 'auto',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '500px',
        padding: theme.spacing(4), // Original padding for larger screens
    },
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    borderRadius: '20px',
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
        backgroundColor: '#1C2B3C',
    }),
    [theme.breakpoints.down('sm')]: { // Mobile adjustments
        padding: theme.spacing(2), // Further reduced padding on small screens
    },
}));

const SignUpContainer = styled(motion(Stack))(({ theme }) => ({
    height: '100vh',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(3),
    },
    position: 'relative',
    backgroundColor: theme.palette.background.default,
    '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        inset: 0,
        backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
        backgroundRepeat: 'no-repeat',
        ...theme.applyStyles('dark', {
            backgroundImage:
                'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        }),
    },
    [theme.breakpoints.down('sm')]: { // Mobile adjustments
        padding: theme.spacing(1), // Reduced padding on very small screens
    },
}));

const DarkModeToggleButton = styled(IconButton)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    color: theme.palette.mode === 'dark' ? '#FFD700' : '#0A192F',
}));

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' }
    },
    exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

const cardVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.4, ease: 'easeOut' }
    },
};

const formVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    },
};

const fieldVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.2 }
    },
};

// Updated Google Button with white text
const GoogleButton = styled(Button)(({ theme }) => ({
    textTransform: 'none',
    backgroundColor: '#4285F4', // Google's blue
    color: '#FFFFFF', // White text
    border: 'none', // Remove default border
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '0.9rem',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px', // Space between icon and text
    '&:hover': {
        backgroundColor: '#357ae8', // Darker blue on hover
    },
    '&:disabled': {
        backgroundColor: '#a0c1f7', // Lighter blue when disabled
        color: '#ffffff', // Ensure text remains white when disabled
    },
}));

export default function Signup() {
    const navigate = useNavigate();
    const theme = useTheme();
    const { isAuthenticated, signup, signInWithGoogle, loading: authLoading, error: authError } = useContext(AuthContext);
    const [darkMode, setDarkMode] = useState(theme.palette.mode === 'dark');

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };


    const handleSignup = async (e) => {
        e.preventDefault();
        if (!fullName || !email || !password || !confirmPassword) {
            setError('All fields are required');
            setSuccess('');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setSuccess('');
            return;
        }

        setError('');
        setSuccess('');

        try {
            await signup(email, password, fullName);
            setSuccess('Signup successful! Redirecting to dashboard...');
            setError('');
            setFullName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(authError || 'Signup failed. Please try again.');
            setSuccess('');
        }
    };


    const handleGoogleSignup = async () => {
        setError('');
        setSuccess('');
        try {
            await signInWithGoogle();
            setSuccess('Signup with Google successful! Redirecting to dashboard...');
        } catch (err) {
            setError(authError || 'Google signup failed. Please try again.');
            setSuccess('');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword((prev) => !prev);
    };

    return (
        <AppTheme>
            <CssBaseline enableColorScheme />
            <AnimatePresence>
                <SignUpContainer
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <DarkModeToggleButton onClick={toggleDarkMode}>
                        {darkMode ? <Brightness7 /> : <Brightness4 />}
                    </DarkModeToggleButton>

                    <motion.div variants={cardVariants}>
                        <Card variant="outlined">
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <SitemarkIcon />
                            </Box>
                            <Typography
                                component="h1"
                                variant="h5"
                                sx={{
                                    width: '100%',
                                    fontSize: '1.5rem', // Slightly reduced font size for mobile
                                    textAlign: 'center',
                                    color: darkMode ? '#FFFFFF' : '#0A192F',
                                    fontFamily: 'Roboto, sans-serif',
                                    fontWeight: 700,
                                    mb: 2,
                                }}
                            >
                                Create Account
                            </Typography>
                            <motion.form
                                onSubmit={handleSignup}
                                noValidate
                                variants={formVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '100%',
                                    gap: '0.3rem',
                                }}
                            >
                                <AnimatePresence>
                                    {authError && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.9rem' }}>
                                                {authError}
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
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Alert severity="success" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.9rem' }}>
                                                {success}
                                            </Alert>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.div variants={fieldVariants}>
                                    <FormControl fullWidth>
                                        <FormLabel htmlFor="fullName" sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.9rem' }}>
                                            Full Name
                                        </FormLabel>
                                        <TextField
                                            error={Boolean(authError) && !success}
                                            helperText={Boolean(authError) && !success ? '' : ''}
                                            id="fullName"
                                            type="text"
                                            name="fullName"
                                            placeholder="John Doe"
                                            autoComplete="name"
                                            autoFocus
                                            required
                                            fullWidth
                                            variant="outlined"
                                            color={Boolean(authError) && !success ? 'error' : 'primary'}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            sx={{
                                                mt: 0.3,
                                                mb: 1,
                                                fontFamily: 'Roboto, sans-serif',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '8px',
                                                    height: '40px', // Slightly reduced height for mobile
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: '10px 12px',
                                                },
                                            }}
                                        />
                                    </FormControl>
                                </motion.div>

                                <motion.div variants={fieldVariants}>
                                    <FormControl fullWidth>
                                        <FormLabel htmlFor="email" sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.9rem' }}>
                                            Email
                                        </FormLabel>
                                        <TextField
                                            error={Boolean(authError) && !success}
                                            helperText={Boolean(authError) && !success ? '' : ''}
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="john.doe@example.com"
                                            autoComplete="email"
                                            required
                                            fullWidth
                                            variant="outlined"
                                            color={Boolean(authError) && !success ? 'error' : 'primary'}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            sx={{
                                                mt: 0.3,
                                                mb: 1,
                                                fontFamily: 'Roboto, sans-serif',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '8px',
                                                    height: '40px', // Slightly reduced height for mobile
                                                },
                                                '& .MuiInputBase-input': {
                                                    padding: '10px 12px',
                                                },
                                            }}
                                        />
                                    </FormControl>
                                </motion.div>

                                <motion.div variants={fieldVariants}>
                                    <FormControl fullWidth>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <FormLabel htmlFor="password" sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.9rem' }}>
                                                    Password
                                                </FormLabel>
                                                <MuiLink
                                                    component="button"
                                                    type="button"
                                                    onClick={handleClickOpen}
                                                    variant="body2"
                                                    sx={{
                                                        fontFamily: 'Roboto, sans-serif',
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline',
                                                        color: theme.palette.primary.main,
                                                        fontSize: '0.85rem',
                                                    }}
                                                >
                                                    Forgot?
                                                </MuiLink>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <TextField
                                                    error={Boolean(authError) && !success}
                                                    helperText={Boolean(authError) && !success ? '' : ''}
                                                    name="password"
                                                    placeholder="••••••"
                                                    type={showPassword ? 'text' : 'password'}
                                                    id="password"
                                                    autoComplete="new-password"
                                                    required
                                                    fullWidth
                                                    variant="outlined"
                                                    color={Boolean(authError) && !success ? 'error' : 'primary'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    sx={{
                                                        flexGrow: 1,
                                                        fontFamily: 'Roboto, sans-serif',
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '8px',
                                                            height: '40px', // Slightly reduced height for mobile
                                                        },
                                                        '& .MuiInputBase-input': {
                                                            padding: '10px 12px',
                                                        },
                                                    }}
                                                />
                                                <IconButton
                                                    onClick={togglePasswordVisibility}
                                                    edge="end"
                                                    aria-label="toggle password visibility"
                                                    size="large"
                                                    sx={{ ml: 1 }}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </FormControl>
                                </motion.div>

                                <motion.div variants={fieldVariants}>
                                    <FormControl fullWidth>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <FormLabel htmlFor="confirmPassword" sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.9rem' }}>
                                                Confirm Password
                                            </FormLabel>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <TextField
                                                    error={Boolean(authError) && !success}
                                                    helperText={Boolean(authError) && !success ? '' : ''}
                                                    name="confirmPassword"
                                                    placeholder="••••••"
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    id="confirmPassword"
                                                    autoComplete="new-password"
                                                    required
                                                    fullWidth
                                                    variant="outlined"
                                                    color={Boolean(authError) && !success ? 'error' : 'primary'}
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    sx={{
                                                        flexGrow: 1,
                                                        mt: 0.3,
                                                        mb: 1,
                                                        fontFamily: 'Roboto, sans-serif',
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: '8px',
                                                            height: '40px', // Slightly reduced height for mobile
                                                        },
                                                        '& .MuiInputBase-input': {
                                                            padding: '10px 12px',
                                                        },
                                                    }}
                                                />
                                                <IconButton
                                                    onClick={toggleConfirmPasswordVisibility}
                                                    edge="end"
                                                    aria-label="toggle confirm password visibility"
                                                    size="large"
                                                    sx={{ ml: 1 }}
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </FormControl>
                                </motion.div>

                                <motion.div variants={fieldVariants}>
                                    <FormControlLabel
                                        control={<Checkbox value="agree" color="primary" required />}
                                        label={
                                            <Typography sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.85rem' }}>
                                                I agree to the <strong>Terms and Conditions</strong>
                                            </Typography>
                                        }
                                        sx={{
                                            mb: 2,
                                            fontFamily: 'Roboto, sans-serif',
                                            fontSize: '0.85rem',
                                        }}
                                    />
                                </motion.div>

                                <ForgotPassword open={open} handleClose={handleClose} />

                                <motion.div variants={fieldVariants}>
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={authLoading}
                                        sx={{
                                            padding: '10px 22px', // Slightly reduced padding for mobile
                                            fontSize: '0.95rem', // Slightly reduced font size for mobile
                                            backgroundColor: theme.palette.primary.main,
                                            color: '#FFFFFF',
                                            borderRadius: '16px',
                                            fontFamily: 'Roboto, sans-serif',
                                            fontWeight: 600,
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.dark,
                                            },
                                        }}
                                        component={motion.button}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {authLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
                                    </Button>
                                </motion.div>

                                <motion.div variants={fieldVariants}>
                                    <Divider sx={{ my: 2 }}>OR</Divider>
                                </motion.div>

                                <motion.div variants={fieldVariants}>
                                    <GoogleButton
                                        variant="contained"
                                        startIcon={<FcGoogle size={20} />}
                                        onClick={handleGoogleSignup}
                                        disabled={authLoading}
                                        fullWidth
                                    >
                                        {authLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign Up with Google'}
                                    </GoogleButton>
                                </motion.div>

                                <motion.div variants={fieldVariants}>
                                    <Typography
                                        sx={{
                                            textAlign: 'center',
                                            mt: 1,
                                            fontFamily: 'Roboto, sans-serif',
                                            fontSize: '0.9rem',
                                        }}
                                    >
                                        Already have an account?{' '}
                                        <MuiLink
                                            component={Link}
                                            to="/login"
                                            variant="body2"
                                            sx={{
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                                color: theme.palette.primary.main,
                                                fontWeight: 500,
                                            }}
                                        >
                                            Login
                                        </MuiLink>
                                    </Typography>
                                </motion.div>
                            </motion.form>
                        </Card>
                    </motion.div>
                </SignUpContainer>
            </AnimatePresence>
        </AppTheme>
    );
}