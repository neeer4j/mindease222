import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const StyledBox = styled(Box)(({ theme }) => ({
  width: '100vw',
  height: '100vh',
  background: 'linear-gradient(135deg, #1a1a1a, #141414)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 9999,
  padding: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(1.5, 4),
  fontSize: '1.1rem',
  color: '#fff',
  borderRadius: '30px',
  backgroundColor: theme.palette.error.main,
  textTransform: 'none',
  boxShadow: theme.shadows[3],
  '&:hover': {
    backgroundColor: theme.palette.error.dark,
  },
}));

const textVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const iconVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const BannedUserScreen = () => {
  const theme = useTheme();

  const handleContact = () => {
    window.location.href = 'mailto:support@mindeaseai.com';
  };

  return (
    <StyledBox>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.3,
            },
          },
        }}
      >
        <motion.div
          variants={iconVariants}
          style={{ textAlign: 'center', marginBottom: theme.spacing(2) }}
        >
          <ErrorOutlineIcon
            sx={{ fontSize: { xs: 80, sm: 120 }, color: theme.palette.error.light }}
          />
        </motion.div>

        <motion.div variants={textVariants}>
          <Typography
            variant="h2"
            sx={{
              color: '#fff',
              textAlign: 'center',
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', sm: '3rem' },
            }}
          >
            Account Suspended
          </Typography>
        </motion.div>

        <motion.div variants={textVariants}>
          <Typography
            variant="h5"
            sx={{
              color: 'rgba(255,255,255,0.85)',
              textAlign: 'center',
              maxWidth: '600px',
              mx: 'auto',
              px: 2,
            }}
          >
            Your account has been suspended due to violations of our terms of service.
            Please contact our support team for more information.
          </Typography>
        </motion.div>

        <motion.div variants={textVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <StyledButton variant="contained" onClick={handleContact}>
              Contact Support
            </StyledButton>
          </Box>
        </motion.div>
      </motion.div>
    </StyledBox>
  );
};

export default BannedUserScreen;
