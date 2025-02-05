// src/pages/Unauthorized.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          textAlign: 'center',
          padding: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          403 - Unauthorized Access
        </Typography>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          You do not have the necessary permissions to view this page.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/')}
          sx={{ mt: 4 }}
        >
          Go to Home
        </Button>
      </Box>
    </motion.div>
  );
};

export default Unauthorized;
