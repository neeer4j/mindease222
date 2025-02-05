// src/components/NotificationSnackbar.jsx

import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { motion } from 'framer-motion';

const NotificationSnackbar = ({ open, type, message, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={motion.div}
      transition={{ duration: 0.5 }}
    >
      <Alert
        onClose={onClose}
        severity={type}
        sx={{ width: '100%' }}
        elevation={6}
        variant="filled"
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
