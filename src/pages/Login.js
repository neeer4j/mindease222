// src/components/Login.jsx

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
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { FcGoogle } from 'react-icons/fc'; // Import Google Icon
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ForgotPassword from './ForgotPassword';
import AppTheme from '../shared-theme/AppTheme';
import { useTheme } from '@mui/material/styles';

// Styled Components
const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(3),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '500px',
    padding: theme.spacing(4),
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  borderRadius: '20px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    backgroundColor: '#1C2B3C',
  }),
}));

const SignInContainer = styled(motion(Stack))(({ theme }) => ({
  minHeight: '100vh',
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
}));

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
  exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
};

// Styled Google Button with white text
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
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.85rem',
    padding: '8px 10px',
  },
}));

export default function EnhancedLogin(props) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { 
    isAuthenticated, 
    login, 
    signInWithGoogle, 
    loading: authLoading, 
    error: authError, 
    showSplash,
    setShowSplash
  } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false); // For ForgotPassword modal

  // State for internal validation errors and success messages
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      if (!showSplash) {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate, showSplash]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setValidationError('Please enter both email and password.');
      setSuccess('');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address.');
      setSuccess('');
      return;
    }

    setValidationError('');
    try {
      await login(email, password);
      setSuccess('Login successful!');
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error("Error during login:", err);
      setSuccess('');
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setValidationError('');
    setSuccess('');
    try {
      await signInWithGoogle();
      setShowSplash(true); // Explicitly set splash screen for Google sign-in
      setSuccess('Login with Google successful!');
    } catch (err) {
      setSuccess('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Email validation function
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AnimatePresence>
        <SignInContainer
          direction="column"
          justifyContent="center"
          alignItems="center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div variants={cardVariants}>
            <Card variant="outlined">
              {/* Sitemark logo removed */}
              <Typography
                component="h1"
                variant="h5"
                sx={{
                  width: '100%',
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  textAlign: 'center',
                  color: theme.palette.text.primary,
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                Sign In
              </Typography>
              <motion.form
                onSubmit={handleLogin}
                noValidate
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  gap: '0.5rem',
                }}
              >
                {/* Conditionally Render Alerts Container */}
                {(validationError || authError || success) && (
                  <Box sx={{ minHeight: '60px', mb: 2 }}>
                    <AnimatePresence>
                      {validationError && (
                        <motion.div
                          key="validationError"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert
                            severity="error"
                            sx={{
                              borderRadius: '8px',
                              fontSize: { xs: '0.8rem', sm: '0.9rem' },
                              height: '50px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {validationError}
                          </Alert>
                        </motion.div>
                      )}
                      {authError && (
                        <motion.div
                          key="authError"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert
                            severity="error"
                            sx={{
                              borderRadius: '8px',
                              fontSize: { xs: '0.8rem', sm: '0.9rem' },
                              height: '50px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {authError}
                          </Alert>
                        </motion.div>
                      )}
                      {success && (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert
                            severity="success"
                            sx={{
                              borderRadius: '8px',
                              fontSize: { xs: '0.8rem', sm: '0.9rem' },
                              height: '50px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {success}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Box>
                )}

                {/* Email Field */}
                <motion.div variants={fieldVariants}>
                  <FormControl fullWidth>
                    <FormLabel
                      htmlFor="email"
                      sx={{
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      }}
                    >
                      Email
                    </FormLabel>
                    <TextField
                      error={Boolean(authError)}
                      helperText={Boolean(authError) ? '' : ''}
                      id="email"
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      autoComplete="email"
                      autoFocus
                      required
                      fullWidth
                      variant="outlined"
                      color={Boolean(authError) ? 'error' : 'primary'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      sx={{
                        mt: 0.3,
                        mb: 1,
                        fontFamily: 'Roboto, sans-serif',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          height: { xs: '40px', sm: '45px' },
                        },
                        '& .MuiInputBase-input': {
                          padding: '8px 12px',
                          fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        },
                      }}
                    />
                  </FormControl>
                </motion.div>

                {/* Password Field with Separate Eye Icon */}
                <motion.div variants={fieldVariants}>
                  <FormControl fullWidth>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <FormLabel
                          htmlFor="password"
                          sx={{
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          }}
                        >
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
                            fontSize: { xs: '0.75rem', sm: '0.85rem' },
                          }}
                        >
                          Forgot your password?
                        </MuiLink>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          error={Boolean(authError)}
                          helperText={Boolean(authError) ? '' : ''}
                          name="password"
                          placeholder="••••••"
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          autoComplete="current-password"
                          required
                          fullWidth
                          variant="outlined"
                          color={Boolean(authError) ? 'error' : 'primary'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          sx={{
                            flexGrow: 1,
                            fontFamily: 'Roboto, sans-serif',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              height: { xs: '40px', sm: '45px' },
                            },
                            '& .MuiInputBase-input': {
                              padding: '8px 12px',
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
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

                {/* Remember Me Checkbox */}
                <motion.div variants={fieldVariants}>
                  <FormControlLabel
                    control={<Checkbox value="remember" color="primary" />}
                    label={
                      <Typography
                        sx={{
                          fontFamily: 'Roboto, sans-serif',
                          fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        }}
                      >
                        Remember me
                      </Typography>
                    }
                    sx={{
                      mb: 2,
                      fontFamily: 'Roboto, sans-serif',
                    }}
                  />
                </motion.div>

                {/* Optional: ForgotPassword Component */}
                <ForgotPassword open={open} handleClose={handleClose} />

                {/* Sign In Button */}
                <motion.div variants={fieldVariants}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={authLoading}
                    sx={{
                      padding: { xs: '10px 20px', sm: '12px 24px' },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
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
                    {authLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                  </Button>
                </motion.div>

                {/* Divider */}
                <motion.div variants={fieldVariants}>
                  <Divider sx={{ my: 2 }}>OR</Divider>
                </motion.div>

                {/* Sign In with Google Button */}
                <motion.div variants={fieldVariants}>
                  <GoogleButton
                    variant="contained"
                    startIcon={<FcGoogle size={20} />}
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    fullWidth
                    aria-label="Sign in with Google"
                  >
                    {authLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign In with Google'}
                  </GoogleButton>
                </motion.div>

                {/* Login Link */}
                <motion.div variants={fieldVariants}>
                  <Typography
                    sx={{
                      textAlign: 'center',
                      mt: 0, // Removed extra margin between fields and Sign Up text
                      fontFamily: 'Roboto, sans-serif',
                      fontSize: { xs: '0.75rem', sm: '0.9rem' },
                    }}
                  >
                    Don't have an account?{' '}
                    <MuiLink
                      component={Link}
                      to="/signup"
                      variant="body2"
                      sx={{
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                        fontSize: { xs: '0.75rem', sm: '0.9rem' },
                      }}
                    >
                      Sign Up
                    </MuiLink>
                  </Typography>
                </motion.div>
              </motion.form>
            </Card>
          </motion.div>
        </SignInContainer>
      </AnimatePresence>
    </AppTheme>
  );
}
