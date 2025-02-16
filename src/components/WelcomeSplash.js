import React, { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';

const StyledBox = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #141E30, #243B55)'
      : 'linear-gradient(135deg, #89f7fe, #66a6ff)',
  backdropFilter: 'blur(10px)',
  zIndex: 9999,
  overflow: 'hidden',
}));

// Container animations (using spring for a fluid feel)
const containerVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { type: 'spring', stiffness: 120, damping: 20 },
  },
};

// Variants for the welcome text group
const welcomeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20, delay: 0.3 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
};

// Variants for the loading spinner
const spinnerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

const WelcomeSplash = ({ onComplete }) => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [displayName, setDisplayName] = useState('');

  // When the username is available, update local state.
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  // Once the displayName is set, start a timer to dismiss the splash.
  useEffect(() => {
    if (displayName) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [displayName, onComplete]);

  return (
    <AnimatePresence>
      <StyledBox
        key="welcomeSplash"
        component={motion.div}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        {/* Fluid animated background shape 1 */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: isMobile ? 200 : 350,
            height: isMobile ? 200 : 350,
            borderRadius: '50%',
            background:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)',
            top: '10%',
            left: '20%',
          }}
        />

        {/* Fluid animated background shape 2 */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: isMobile ? 180 : 300,
            height: isMobile ? 180 : 300,
            borderRadius: '50%',
            background:
              theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(0, 0, 0, 0.03)',
            bottom: '15%',
            right: '10%',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            padding: theme.spacing(2),
            textAlign: 'center',
          }}
        >
          <AnimatePresence mode="wait">
            {/* Show the spinner while displayName is empty */}
            {!displayName ? (
              <motion.div
                key="spinner"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={spinnerVariants}
              >
                <CircularProgress
                  color="inherit"
                  size={isMobile ? 40 : 50}
                />
              </motion.div>
            ) : (
              // Once displayName is available, animate in the welcome text.
              <motion.div
                key="welcomeText"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={welcomeVariants}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.palette.common.white,
                    mb: 1,
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                    textShadow: '1px 1px 4px rgba(0,0,0,0.4)',
                    fontSize: { xs: '1.2rem', sm: '1.5rem' },
                  }}
                >
                  Welcome back,
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    color: theme.palette.common.white,
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textShadow: '2px 2px 8px rgba(0,0,0,0.5)',
                    fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
                  }}
                >
                  {displayName}!
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </StyledBox>
    </AnimatePresence>
  );
};

export default WelcomeSplash;
