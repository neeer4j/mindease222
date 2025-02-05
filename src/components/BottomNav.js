// src/components/BottomNav.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Menu,
  MenuItem,
  useMediaQuery,
} from '@mui/material';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';

// Import icons for full navigation
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChatIcon from '@mui/icons-material/Chat';
import MoodIcon from '@mui/icons-material/Mood';
import InsightsIcon from '@mui/icons-material/Insights';
import ProfileIcon from '@mui/icons-material/Person';

// Import icons for authentication actions
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';

// Import icon for Therapist Recommendations
import PsychologyIcon from '@mui/icons-material/Psychology';

// Import icons for Features submenu
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import HotelIcon from '@mui/icons-material/Hotel';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';

// Import the AuthContext to get the auth state
import { AuthContext } from '../contexts/AuthContext';

const BottomNav = () => {
  // Get the global theme and current mode.
  const globalTheme = useTheme();
  const currentMode = globalTheme.palette.mode; // 'dark' or 'light'

  // Create a dedicated theme for the BottomNav.
  // In light mode, force unselected icons and text to black.
  const bottomNavTheme = createTheme({
    palette: {
      mode: currentMode,
      primary: {
        main: '#007BFF', // Blue for active items.
      },
      background: {
        paper: 'transparent',
      },
      text: {
        primary: currentMode === 'light' ? '#000' : '#fff',
        secondary: currentMode === 'light' ? '#444' : '#b3b3b3',
      },
    },
    typography: {
      fontSize: 12,
    },
  });

  // Use a dark transparent background gradient for the bottom nav.
  const navBgGradient =
    'linear-gradient(to top, rgba(0, 0, 0, 0.9) 40%, transparent 90%)';

  // Change the menu background to a strong dark transparent look.
  const menuBg = 'rgba(0, 0, 0, 0.85)';

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);

  // Check for mobile screens.
  const isMobile = useMediaQuery(globalTheme.breakpoints.down('sm'));

  // State for navigation selection.
  const [value, setValue] = useState(() => {
    const path = location.pathname;
    if (
      path === '/mood-tracker' ||
      path === '/activity-logging' ||
      path === '/sleep-tracker' ||
      path === '/meditations' ||
      path === '/therapist-recommendations' ||
      path === '/reels'
    ) {
      return 'features';
    }
    return path;
  });

  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const path = location.pathname;
    if (
      path === '/mood-tracker' ||
      path === '/activity-logging' ||
      path === '/sleep-tracker' ||
      path === '/meditations' ||
      path === '/therapist-recommendations' ||
      path === '/reels'
    ) {
      setValue('features');
    } else {
      setValue(path);
    }
  }, [location.pathname]);

  // Handle navigation changes.
  const handleChange = (event, newValue) => {
    if (newValue === 'features') {
      setAnchorEl(event.currentTarget);
      return;
    }
    setValue(newValue);
    navigate(newValue);
  };

  const handleCloseFeatures = (path) => {
    setAnchorEl(null);
    if (path) {
      setValue('features');
      navigate(path);
    }
  };

  // Styling for the modern drop-up (features) menu.
  const menuSx = {
    '& .MuiMenuItem-root': {
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      paddingY: 1,
      paddingX: 2,
    },
  };

  const menuPaperProps = {
    sx: {
      backgroundColor: menuBg,
      borderRadius: '12px',
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'visible',
      mt: 1,
    },
  };

  // For unauthenticated mobile users: show only Sign Up and Login.
  if (!isAuthenticated && isMobile) {
    return (
      <ThemeProvider theme={bottomNavTheme}>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: navBgGradient,
            boxShadow: 'none',
            border: 'none',
          }}
          elevation={0}
        >
          <BottomNavigation
            onChange={(event, newValue) => navigate(newValue)}
            showLabels
            sx={{
              backgroundColor: 'transparent',
              border: 'none',
              '& .MuiBottomNavigationAction-root': {
                minWidth: '50px',
                color: currentMode === 'light' ? '#000' : 'inherit',
              },
              '& .MuiBottomNavigationAction-root.Mui-selected': {
                color: bottomNavTheme.palette.primary.main,
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
              },
            }}
          >
            <BottomNavigationAction
              label="Sign Up"
              value="/signup"
              icon={<PersonAddIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
            />
            <BottomNavigationAction
              label="Login"
              value="/login"
              icon={<LoginIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />}
            />
          </BottomNavigation>
        </Paper>
      </ThemeProvider>
    );
  }

  // For authenticated users or on non-mobile devices.
  return (
    <ThemeProvider theme={bottomNavTheme}>
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: navBgGradient,
          boxShadow: 'none',
          border: 'none',
        }}
        elevation={0}
      >
        <BottomNavigation
          value={value}
          onChange={handleChange}
          showLabels
          sx={{
            backgroundColor: 'transparent',
            border: 'none',
            p: { xs: 0.5, sm: 1 },
            '& .MuiBottomNavigationAction-root': {
              color: currentMode === 'light' ? '#000' : 'text.secondary',
              minWidth: '50px',
            },
            '& .Mui-selected': {
              color: bottomNavTheme.palette.primary.main,
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            },
          }}
        >
          <BottomNavigationAction
            label="Dashboard"
            value="/dashboard"
            icon={<DashboardIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />}
          />
          <BottomNavigationAction
            label="Chat"
            value="/chat"
            icon={<ChatIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />}
          />
          <BottomNavigationAction
            label="Features"
            value="features"
            icon={<MoodIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />}
          />
          <BottomNavigationAction
            label="Insights"
            value="/insights"
            icon={<InsightsIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />}
          />
          <BottomNavigationAction
            label="Profile"
            value="/profile"
            icon={<ProfileIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />}
          />
        </BottomNavigation>
      </Paper>

      {/* Updated drop-up menu for the "Features" button */}
      <Menu
        id="features-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleCloseFeatures(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={menuSx}
        PaperProps={menuPaperProps}
      >
        <MenuItem onClick={() => handleCloseFeatures('/reels')}>
          <OndemandVideoIcon sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Reels
        </MenuItem>
        <MenuItem onClick={() => handleCloseFeatures('/mood-tracker')}>
          <MoodIcon sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Mood Tracker
        </MenuItem>
        <MenuItem onClick={() => handleCloseFeatures('/activity-logging')}>
          <LocalActivityIcon sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Activity Logging
        </MenuItem>
        <MenuItem onClick={() => handleCloseFeatures('/sleep-tracker')}>
          <HotelIcon sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Sleep Tracker
        </MenuItem>
        <MenuItem onClick={() => handleCloseFeatures('/meditations')}>
          <SelfImprovementIcon sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Meditation
        </MenuItem>
        <MenuItem onClick={() => handleCloseFeatures('/therapist-recommendations')}>
          <PsychologyIcon sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Therapist Recommendations
        </MenuItem>
      </Menu>
    </ThemeProvider>
  );
};

export default BottomNav;
