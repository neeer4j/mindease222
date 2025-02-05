// src/components/ThemeToggle.js

import React from 'react';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = ({ toggleTheme, currentTheme }) => {
  return (
    <IconButton
      onClick={toggleTheme}
      color="inherit"
      aria-label="Toggle light and dark mode"
      component={motion.div}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      initial={false}
      animate={{ rotate: currentTheme === 'dark' ? 180 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      sx={{
        position: 'relative',
        width: 48,
        height: 48,
        padding: 0,
      }}
    >
      <AnimatePresence exitBeforeEnter initial={false}>
        {currentTheme === 'dark' ? (
          <motion.div
            key="light"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute' }}
          >
            <Brightness7 fontSize="large" />
          </motion.div>
        ) : (
          <motion.div
            key="dark"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute' }}
          >
            <Brightness4 fontSize="large" />
          </motion.div>
        )}
      </AnimatePresence>
    </IconButton>
  );
};

export default React.memo(ThemeToggle);