// src/components/LoadingSpinner.jsx

import React from 'react';
import { Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import 'ldrs';

const LoadingSpinner = () => {
  const theme = useTheme();

  React.useEffect(() => {
    // Dynamically import and register the custom element
    import('ldrs').then(({ lineWobble }) => {
      lineWobble.register();
    });
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: (theme) => theme.palette.background.default,
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src="/images/mindeaselogo.png"
            alt="MindEase"
            style={{
              height: '100px',
              width: 'auto',
              filter: (theme) =>
                theme.palette.mode === 'dark' ? 'brightness(1.5)' : 'none',
            }}
          />
        </motion.div>

        <Box sx={{ marginTop: '0.5rem' }}>
          <l-line-wobble
            size="120"
            stroke="6"
            bg-opacity="0.1"
            speed="1.75"
            color="currentColor"
          ></l-line-wobble>
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingSpinner;
