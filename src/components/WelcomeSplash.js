import React, { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
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
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha('#0A1929', 0.97)}, ${alpha('#1A3B66', 0.97)})`
    : `linear-gradient(135deg, ${alpha('#E3F2FD', 0.97)}, ${alpha('#90CAF9', 0.97)})`,
  backdropFilter: 'blur(20px)',
  zIndex: 9999,
  overflow: 'hidden',
}));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      duration: 0.5,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.15
    },
  },
  exit: {
    opacity: 0,
    transition: { 
      duration: 0.3,
      ease: 'easeIn',
      when: 'afterChildren',
      staggerChildren: 0.1
    },
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 150,
      damping: 15
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 }
  },
};

const WelcomeSplash = ({ onComplete }) => {
  const { user } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
      // Reduced timeout for a snappier experience
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.displayName, onComplete]);

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
        {/* Premium animated background elements */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            width: isMobile ? 300 : 600,
            height: isMobile ? 300 : 600,
            borderRadius: '50%',
            background: `radial-gradient(circle at center, ${
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.light, 0.2)
            }, transparent)`,
            filter: 'blur(40px)',
          }}
        />

        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            padding: theme.spacing(4),
            textAlign: 'center',
            maxWidth: '800px'
          }}
        >
          <motion.div variants={textVariants}>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.common.white, 0.9)
                  : alpha(theme.palette.common.black, 0.7),
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              Welcome back to MindEase
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                fontSize: { xs: '2.5rem', sm: '4rem', md: '5rem' },
                background: `linear-gradient(135deg, 
                  ${theme.palette.mode === 'dark' 
                    ? `${alpha(theme.palette.primary.light, 0.9)}, ${alpha(theme.palette.primary.main, 1)}` 
                    : `${theme.palette.primary.main}, ${theme.palette.primary.dark}`
                  })`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: theme.palette.mode === 'dark'
                  ? '0 0 40px rgba(255,255,255,0.2)'
                  : '0 0 40px rgba(0,0,0,0.1)',
                filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.15))',
                marginBottom: 1
              }}
            >
              {displayName}
            </Typography>
            <motion.div
              variants={textVariants}
              style={{ overflow: 'hidden' }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.common.white, 0.7)
                    : alpha(theme.palette.common.black, 0.6),
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  fontWeight: 400,
                  letterSpacing: '0.05em',
                  opacity: 0.9
                }}
              >
                Your journey to wellness continues
              </Typography>
            </motion.div>
          </motion.div>
        </Box>
      </StyledBox>
    </AnimatePresence>
  );
};

export default WelcomeSplash;
