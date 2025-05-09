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
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CreateIcon from '@mui/icons-material/Create';
import TimelineIcon from '@mui/icons-material/Timeline';
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
      ? 'linear-gradient(135deg, #141E30, #243B55)'
      : 'linear-gradient(135deg, #89f7fe, #66a6ff)',
  backdropFilter: 'blur(10px)',
  zIndex: 9999,
  overflow: 'hidden',
}));

// Improved container animation
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 20 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
};

// Improved step animation with subtle vertical motion
const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 15 },
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: { duration: 0.3 },
  },
};

// New icon animation for a pop effect
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

const tutorialSteps = [
  {
    title: 'Track Your Mood',
    description: "Choose from 5 different mood levels to record how you're feeling.",
    icon: <EmojiEmotionsIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Journal Your Thoughts',
    description:
      'Add notes about your day, thoughts, or feelings for better self-reflection.',
    icon: <CreateIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'View Your Progress',
    description:
      'Track your emotional journey with interactive charts and insights.',
    icon: <TimelineIcon sx={{ fontSize: 40 }} />,
  },
];

const MoodTrackerSplash = ({ onComplete }) => {
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

  // Enable keyboard navigation (Right arrow, Left arrow, Escape)
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

        {/* Background animations with rotation */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{
            scale: [0.9, 1, 0.9],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 360],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
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
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, -360],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
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

        {/* Tutorial content */}
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
          <motion.div
            key={activeStep}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
          >
            <Box sx={{ mb: 4 }}>
              {/* Icon with pop effect */}
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
                {activeStep === tutorialSteps.length - 1 ? (
                  <CheckCircleIcon />
                ) : (
                  <NavigateNextIcon />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </StyledBox>
    </AnimatePresence>
  );
};

export default MoodTrackerSplash;
