import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  useMediaQuery,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
      ? 'linear-gradient(135deg, #4a148c, #311b92)'
      : 'linear-gradient(135deg, #e1bee7, #9c27b0)',
  backdropFilter: 'blur(10px)',
  zIndex: 9999,
  overflow: 'hidden',
}));

// Animation Variants
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

const stepVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    rotate: 20,
    transition: { duration: 0.2 },
  },
};

// Tutorial steps for Meditation
const tutorialSteps = [
  {
    title: 'Find Your Peace',
    description: 'Explore guided meditations for mindfulness and relaxation.',
    icon: <SelfImprovementIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Curated Audio',
    description: 'High-quality meditation tracks for different needs and durations.',
    icon: <LibraryMusicIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Practice Self-Care',
    description: 'Make meditation a regular part of your wellness routine.',
    icon: <FavoriteIcon sx={{ fontSize: 40 }} />,
  },
];

const MeditationSplash = ({ onComplete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = useCallback(() => {
    if (activeStep === tutorialSteps.length - 1) {
      onComplete();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  }, [activeStep, onComplete]);

  const handleBack = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  }, [activeStep]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Enable keyboard navigation: Right arrow, Left arrow, and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handleBack, handleSkip]);

  return (
    <AnimatePresence>
      <StyledBox
        component={motion.div}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
      >
        {/* Skip Button */}
        <Box
          sx={{
            position: 'absolute',
            top: theme.spacing(2),
            right: theme.spacing(2),
            zIndex: 2,
          }}
        >
          <Tooltip title="Skip Tutorial">
            <IconButton onClick={handleSkip} sx={{ color: theme.palette.common.white }}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Background Animations */}
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

        {/* Tutorial Content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            padding: theme.spacing(4),
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <motion.div key={activeStep} initial="hidden" animate="visible" exit="exit" variants={stepVariants}>
            <Box sx={{ mb: 4 }}>
              {/* Icon with Pop Effect */}
              <motion.div variants={iconVariants} initial="hidden" animate="visible" exit="exit">
                {tutorialSteps[activeStep].icon}
              </motion.div>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                sx={{
                  color: theme.palette.common.white,
                  mb: 2,
                  fontWeight: 600,
                  textShadow: '1px 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {tutorialSteps[activeStep].title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.common.white,
                  opacity: 0.9,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                {tutorialSteps[activeStep].description}
              </Typography>
            </Box>
          </motion.div>

          <Box sx={{ width: '100%', mt: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {tutorialSteps.map((step, index) => (
                <Step key={step.title}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: theme.palette.common.white,
                        opacity: activeStep === index ? 1 : 0.7,
                      },
                    }}
                  />
                </Step>
              ))}
            </Stepper>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
            {activeStep > 0 && (
              <Tooltip title="Previous">
                <IconButton onClick={handleBack} sx={{ color: theme.palette.common.white }}>
                  <NavigateBeforeIcon />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={activeStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}>
              <IconButton onClick={handleNext} sx={{ color: theme.palette.common.white }}>
                {activeStep === tutorialSteps.length - 1 ? <CheckCircleIcon /> : <NavigateNextIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </StyledBox>
    </AnimatePresence>
  );
};

export default MeditationSplash;
