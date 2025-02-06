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
  FormHelperText,
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
import { FcGoogle } from 'react-icons/fc';
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
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
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
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
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

// Updated Google Button with white text
const GoogleButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  backgroundColor: '#4285F4',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '0.9rem',
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  '&:hover': {
    backgroundColor: '#357ae8',
  },
  '&:disabled': {
    backgroundColor: '#a0c1f7',
    color: '#ffffff',
  },
}));

export default function Signup() {
  const navigate = useNavigate();
  const theme = useTheme();
  const {
    isAuthenticated,
    signup,
    signInWithGoogle,
    loading: authLoading,
    error: authError,
  } = useContext(AuthContext);

  // Form field states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Visibility toggles for passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Global messages
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState('');

  // Field-specific error states
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });

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

  // Email regex for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate each field before signup
  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!termsAccepted) {
      newErrors.terms = 'You must agree to the Terms and Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    // Reset messages
    setErrorMessage('');
    setSuccess('');

    if (!validate()) {
      return;
    }

    try {
      await signup(email, password, fullName);
      setSuccess('Signup successful! Redirecting to dashboard...');
      setErrorMessage('');
      // Clear fields
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setTermsAccepted(false);
      setErrors({});
    } catch (err) {
      setErrorMessage(authError || 'Signup failed. Please try again.');
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage('');
    setSuccess('');
    try {
      await signInWithGoogle();
      setSuccess('Signup with Google successful! Redirecting to dashboard...');
    } catch (err) {
      setErrorMessage(authError || 'Google signup failed. Please try again.');
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
          <motion.div variants={cardVariants}>
            <Card variant="outlined">
              {/* Removed Sitemark Logo */}
              <Typography
                component="h1"
                variant="h5"
                sx={{
                  width: '100%',
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  color: theme.palette.text.primary,
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
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.9rem' }}>
                        {errorMessage}
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

                {/* Full Name Field */}
                <motion.div variants={fieldVariants}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="fullName" sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.9rem' }}>
                      Full Name
                    </FormLabel>
                    <TextField
                      error={Boolean(errors.fullName)}
                      helperText={errors.fullName}
                      id="fullName"
                      type="text"
                      name="fullName"
                      placeholder="John Doe"
                      autoComplete="name"
                      autoFocus
                      required
                      fullWidth
                      variant="outlined"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                      }}
                      sx={{
                        mt: 0.3,
                        mb: 1,
                        fontFamily: 'Roboto, sans-serif',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          height: '40px',
                        },
                        '& .MuiInputBase-input': {
                          padding: '10px 12px',
                        },
                      }}
                    />
                  </FormControl>
                </motion.div>

                {/* Email Field */}
                <motion.div variants={fieldVariants}>
                  <FormControl fullWidth>
                    <FormLabel htmlFor="email" sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.9rem' }}>
                      Email
                    </FormLabel>
                    <TextField
                      error={Boolean(errors.email)}
                      helperText={errors.email}
                      id="email"
                      type="email"
                      name="email"
                      placeholder="john.doe@example.com"
                      autoComplete="email"
                      required
                      fullWidth
                      variant="outlined"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      sx={{
                        mt: 0.3,
                        mb: 1,
                        fontFamily: 'Roboto, sans-serif',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          height: '40px',
                        },
                        '& .MuiInputBase-input': {
                          padding: '10px 12px',
                        },
                      }}
                    />
                  </FormControl>
                </motion.div>

                {/* Password Field */}
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
                          error={Boolean(errors.password)}
                          helperText={errors.password}
                          name="password"
                          placeholder="••••••"
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          autoComplete="new-password"
                          required
                          fullWidth
                          variant="outlined"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                          }}
                          sx={{
                            flexGrow: 1,
                            fontFamily: 'Roboto, sans-serif',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              height: '40px',
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

                {/* Confirm Password Field */}
                <motion.div variants={fieldVariants}>
                  <FormControl fullWidth>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <FormLabel htmlFor="confirmPassword" sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.9rem' }}>
                        Confirm Password
                      </FormLabel>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          error={Boolean(errors.confirmPassword)}
                          helperText={errors.confirmPassword}
                          name="confirmPassword"
                          placeholder="••••••"
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          autoComplete="new-password"
                          required
                          fullWidth
                          variant="outlined"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (errors.confirmPassword)
                              setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                          }}
                          sx={{
                            flexGrow: 1,
                            mt: 0.3,
                            mb: 1,
                            fontFamily: 'Roboto, sans-serif',
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '8px',
                              height: '40px',
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

                {/* Terms and Conditions */}
                <motion.div variants={fieldVariants}>
                  <FormControl error={Boolean(errors.terms)}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={termsAccepted}
                          onChange={(e) => {
                            setTermsAccepted(e.target.checked);
                            if (errors.terms) setErrors((prev) => ({ ...prev, terms: '' }));
                          }}
                          value="agree"
                          color="primary"
                          required
                        />
                      }
                      label={
                        <Typography sx={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.85rem' }}>
                          I agree to the <strong>Terms and Conditions</strong>
                        </Typography>
                      }
                      sx={{
                        mb: 0,
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '0.85rem',
                      }}
                    />
                    {errors.terms && (
                      <FormHelperText sx={{ ml: 2, fontSize: '0.75rem' }}>{errors.terms}</FormHelperText>
                    )}
                  </FormControl>
                </motion.div>

                <ForgotPassword open={open} handleClose={handleClose} />

                {/* Signup Button */}
                <motion.div variants={fieldVariants}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={authLoading}
                    sx={{
                      padding: '10px 22px',
                      fontSize: '0.95rem',
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

                {/* Divider */}
                <motion.div variants={fieldVariants}>
                  <Divider sx={{ my: 2 }}>OR</Divider>
                </motion.div>

                {/* Google Signup */}
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

                {/* Login Link */}
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
