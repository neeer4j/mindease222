// src/components/WelcomeAnimation.js
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography } from '@mui/material';

const WelcomeAnimation = ({ user, from, onComplete }) => {
  // Set the welcome message based on whether the user logged in or signed up.
  const message =
    from === 'signup'
      ? `Welcome to MindEase, ${user.name}!`
      : `Welcome back, ${user.name}!`;

  // Automatically remove the overlay after 3 seconds.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'black',
          zIndex: 9999, // Make sure the overlay is above all other content
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <Typography variant="h2" sx={{ color: 'white', textAlign: 'center' }}>
            {message}
          </Typography>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeAnimation;
