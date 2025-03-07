import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext';

// Styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    padding: theme.spacing(2),
    background: theme.palette.background.paper,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(2),
      width: 'calc(100% - 32px)',
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '8px 24px',
  textTransform: 'none',
  fontWeight: 500,
  '&.MuiButton-contained': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
    color: theme.palette.primary.contrastText,
    boxShadow: '0 3px 5px 2px rgba(0, 0, 0, .1)',
    '&:hover': {
      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
    },
  },
}));

function ForgotPassword({ open, handleClose }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { resetPassword } = useContext(AuthContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await resetPassword(email);
      setSuccess('Password reset link has been sent to your email!');
      setEmail('');
      setTimeout(() => {
        handleClose();
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.2 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>Reset Password</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <DialogContentText>
            Enter your account's email address, and we'll send you a link to reset your password.
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="email"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            sx={{ mt: 1 }}
          />
          <AnimatePresence>
            {(error || success) && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
              </Box>
            )}
          </AnimatePresence>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <StyledButton 
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </StyledButton>
          <StyledButton
            type="submit"
            variant="contained"
            disabled={isLoading}
            sx={{ position: 'relative' }}
          >
            {isLoading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: 'inherit',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            ) : 'Send Reset Link'}
          </StyledButton>
        </DialogActions>
      </form>
    </StyledDialog>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ForgotPassword;
