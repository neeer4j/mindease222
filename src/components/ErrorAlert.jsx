// src/components/ErrorAlert.jsx

import React from 'react';
import { Alert, Box } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorAlert = ({ error }) => {
  if (!error) return null;

  return (
    <Box mb={6}>
      <AnimatePresence>
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Alert severity="error">{error}</Alert>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default ErrorAlert;
