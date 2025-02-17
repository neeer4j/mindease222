// src/components/BottomNav.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Menu,
  MenuItem,
  useMediaQuery,
  Box,
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
  // In light mode, we choose colours that enhance readability and contrast.
  const bottomNavTheme = createTheme({
    palette: {
      mode: currentMode,
      primary: {
        // Use a deep blue in light mode and your preferred blue in dark mode.
        main: currentMode === 'light' ? '#1976d2' : '#007BFF',
      },
      background: {
        // Use a solid white background for light mode.
        paper: currentMode === 'light' ? '#fff' : globalTheme.palette.background.paper,
      },
      text: {
        // Darker text in light mode for better contrast.
        primary: currentMode === 'light' ? '#333' : '#fff',
        secondary: currentMode === 'light' ? '#666' : '#b3b3b3',
      },
    },
    typography: {
      fontSize: 12,
    },
  });

  // For light mode, use a subtle white gradient; for dark mode, keep the darker gradient.
  const navBgGradient =
    currentMode === 'light'
      ? 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 50%, transparent 100%)'
      : 'linear-gradient(to top, rgba(0, 0, 0, 0.9) 40%, transparent 90%)';

  // Update the drop-up menu background based on the current mode.
  const menuBg =
    currentMode === 'light'
      ? 'rgba(255, 255, 255, 0.95)' // Light background for light mode.
      : 'rgba(0, 0, 0, 0.85)'; // Dark background for dark mode.

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);

  // Check for mobile screens.
  const isMobile = useMediaQuery(globalTheme.breakpoints.down('sm'));
  // Determine if we are on the Chat page on mobile.
  const isChatPage = isMobile && location.pathname === '/chat';

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

  // Add state for active photo
  const [activePhoto, setActivePhoto] = useState('/images/navbar/aa.jpg');

  // Define features data with images
  const features = [
    {
      path: '/reels',
      icon: <OndemandVideoIcon />,
      title: 'Reels',
      photoUrl: '/images/navbar/reel.jpg'
    },
    {
      path: '/mood-tracker',
      icon: <MoodIcon />,
      title: 'Mood Tracker',
      photoUrl: '/images/navbar/aa.jpg'
    },
    {
      path: '/activity-logging',
      icon: <LocalActivityIcon />,
      title: 'Activity Logging',
      photoUrl: '/images/navbar/ac.jpg'
    },
    {
      path: '/sleep-tracker',
      icon: <HotelIcon />,
      title: 'Sleep Tracker',
      photoUrl: '/images/navbar/sleep.jpg'
    },
    {
      path: '/meditations',
      icon: <SelfImprovementIcon />,
      title: 'Meditation',
      photoUrl: '/images/navbar/images.jpg'
    },
    {
      path: '/therapist-recommendations',
      icon: <PsychologyIcon />,
      title: 'Therapist Recommendations',
      photoUrl: '/images/navbar/tt.jpg'
    }
  ];

  // Preload images
  useEffect(() => {
    features.forEach(feature => {
      const img = new Image();
      img.src = feature.photoUrl;
    });
  }, []);

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
  // Here we also update the text colour for light mode.
  const menuSx = {
    '& .MuiMenuItem-root': {
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      paddingY: 1,
      paddingX: 2,
      // Set the text colour based on the mode.
      color: currentMode === 'light' ? bottomNavTheme.palette.text.primary : '#fff',
    },
  };

  const menuPaperProps = {
    sx: {
      backgroundColor: menuBg,
      borderRadius: '12px',
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      border: currentMode === 'light'
        ? '1px solid rgba(0, 0, 0, 0.1)'
        : '1px solid rgba(255, 255, 255, 0.1)',
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
            // For unauthenticated users on mobile (and also on chat, if needed),
            // use a solid background without gradient fade.
            background: isChatPage ? bottomNavTheme.palette.background.paper : navBgGradient,
            boxShadow: 'none',
            border: isChatPage ? 'none' : undefined,
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
                color: currentMode === 'light'
                  ? bottomNavTheme.palette.text.primary
                  : 'inherit',
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
          // When on the chat page on mobile, remove the fade and use a solid background with minimal borders.
          background: isChatPage ? bottomNavTheme.palette.background.paper : navBgGradient,
          boxShadow: 'none',
          border: isChatPage ? 'none' : undefined,
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
              // Use the updated text colour for unselected items in light mode.
              color: currentMode === 'light'
                ? bottomNavTheme.palette.text.primary
                : 'text.secondary',
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
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: menuBg,
            borderRadius: '12px',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            border: currentMode === 'light'
              ? '1px solid rgba(0, 0, 0, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            maxHeight: 'none',
            display: 'flex',
            width: '500px',
            height: '400px',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ width: '60%', p: 2 }}>
          {features.map((feature) => (
            <MenuItem 
              key={feature.path}
              onClick={() => handleCloseFeatures(feature.path)}
              onMouseEnter={() => setActivePhoto(feature.photoUrl)}
              sx={{
                borderRadius: '8px',
                mb: 1,
                py: 1.5,
                '&:last-child': { mb: 0 },
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              {React.cloneElement(feature.icon, { sx: { mr: 2, fontSize: { xs: 20, sm: 24 } } })}
              {feature.title}
            </MenuItem>
          ))}
        </Box>
        <Box 
          sx={{ 
            width: '40%',
            position: 'relative',
            bgcolor: 'background.default'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${activePhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'all 0.3s ease'
            }}
          />
        </Box>
      </Menu>
    </ThemeProvider>
  );
};

export default BottomNav;