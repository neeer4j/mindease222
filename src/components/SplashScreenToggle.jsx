import React from 'react';
import { IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const SplashScreenToggle = ({ onShowSplash }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Tooltip title="Show tutorial">
      <IconButton
        onClick={onShowSplash}
        sx={{
          position: 'fixed',
          bottom: isMobile ? 72 : 16, // Position above bottom nav on mobile
          right: 16,
          backgroundColor: (theme) => theme.palette.background.paper,
          boxShadow: (theme) => theme.shadows[4],
          zIndex: theme.zIndex.drawer + 1,
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: (theme) => theme.palette.action.hover,
            transform: 'scale(1.1)',
          },
        }}
      >
        <HelpOutlineIcon />
      </IconButton>
    </Tooltip>
  );
};

export default SplashScreenToggle;