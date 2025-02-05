// src/components/LoadingSpinner.jsx

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = 'Loading ' }) => {
  return (
    <Box textAlign="center" mb={6}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {message}
        </Typography>
      </motion.div>
    </Box>
  );
};

export default LoadingSpinner;
