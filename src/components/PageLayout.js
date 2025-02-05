// src/components/PageLayout.jsx

import React from 'react';
import { Box, useTheme, useMediaQuery, Toolbar } from '@mui/material';
import PropTypes from 'prop-types';

const PageLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        minHeight: '100vh', // Ensure the layout takes at least the full viewport height
        background: theme.palette.background.gradient, // Apply the background gradient
        paddingTop: isMobile ? theme.spacing(6) : theme.spacing(8), // Increased padding for mobile
        paddingBottom: isMobile ? theme.spacing(6) : theme.spacing(10), // Adjusted padding for mobile
        paddingX: theme.spacing(isMobile ? 2 : 3), // Responsive horizontal padding
        boxSizing: 'border-box', // Ensure padding is included in the total width and height
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Conditionally add spacer only for mobile to offset the fixed navbar */}
      {isMobile && <Toolbar />}

      {children}
    </Box>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageLayout;
