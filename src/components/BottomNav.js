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
import { alpha } from '@mui/material/styles';

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

// Import additional icons for new menu items
import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';

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
      ? 'rgba(236, 246, 255, 0.85)' // Light frosted blue for light mode
      : 'rgba(13, 71, 161, 0.1)'; // Dark frosted blue for dark mode

  const menuItemHoverBg =
    currentMode === 'light'
      ? 'rgba(33, 150, 243, 0.08)' // Light blue tint for hover in light mode
      : 'rgba(33, 150, 243, 0.15)'; // Slightly lighter blue for hover in dark mode

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

  // Define additional menu items
  const menuItems = [
    {
      title: 'Profile',
      path: '/profile',
      icon: <ProfileIcon />
    },
    {
      title: 'About Us',
      path: '/about',
      icon: <InfoIcon />
    },
    {
      title: 'Contact Us',
      path: '/contact',
      icon: <ContactSupportIcon />
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

  // Handle navigation changes with proper menu handling
  const handleChange = (event, newValue) => {
    if (newValue === 'features' || newValue === 'more') {
      // Get the button element that was clicked
      const button = event.currentTarget.querySelector(`[value="${newValue}"]`);
      setAnchorEl(button);
      setValue(newValue);
      return;
    }
    setValue(newValue);
    navigate(newValue);
  };

  const handleCloseMenu = (path) => {
    setAnchorEl(null);
    if (path) {
      setValue(path);
      navigate(path);
    }
  };

  const handleButtonClick = (event, type) => {
    setAnchorEl(event.currentTarget);
    setValue(type);
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
            zIndex: 1100,
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
            background: isChatPage ? bottomNavTheme.palette.background.paper : navBgGradient,
            boxShadow: 'none',
            border: isChatPage ? 'none' : undefined,
            paddingBottom: 'env(safe-area-inset-bottom)',
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
          zIndex: 1100,
          borderTopLeftRadius: isChatPage ? 0 : '20px',
          borderTopRightRadius: isChatPage ? 0 : '20px',
          background: isChatPage 
            ? globalTheme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(18, 18, 18, 0.8)'
            : navBgGradient,
          backdropFilter: 'blur(10px)',
          borderTop: isChatPage 
            ? `1px solid ${alpha(globalTheme.palette.divider, 0.1)}`
            : 'none',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          height: isChatPage ? 56 : 'auto',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        elevation={0}
      >
        <BottomNavigation
          value={value}
          onChange={(event, newValue) => {
            if (!['features', 'more'].includes(newValue)) {
              setValue(newValue);
              navigate(newValue);
            }
          }}
          showLabels
          sx={{
            backgroundColor: 'transparent',
            border: 'none',
            height: isChatPage ? '56px' : 'auto',
            p: isChatPage ? 0 : { xs: 0.5, sm: 1 },
            '& .MuiBottomNavigationAction-root': {
              color: isChatPage
                ? globalTheme.palette.mode === 'light'
                  ? alpha(globalTheme.palette.text.primary, 0.7)
                  : alpha(globalTheme.palette.text.primary, 0.6)
                : globalTheme.palette.mode === 'light'
                  ? bottomNavTheme.palette.text.primary
                  : 'text.secondary',
              minWidth: '50px',
              transition: 'all 0.2s ease',
              py: isChatPage ? 1 : 0.5,
              '& .MuiSvgIcon-root': {
                transition: 'transform 0.2s ease',
                fontSize: { xs: 24, sm: 28 },
              },
              '&:hover': {
                color: isChatPage
                  ? globalTheme.palette.primary.main
                  : bottomNavTheme.palette.primary.main,
                '& .MuiSvgIcon-root': {
                  transform: 'scale(1.1)',
                },
              },
            },
            '& .Mui-selected': {
              color: isChatPage
                ? globalTheme.palette.primary.main
                : bottomNavTheme.palette.primary.main,
              '& .MuiSvgIcon-root': {
                transform: 'scale(1.1)',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              transition: 'font-size 0.2s ease',
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
            label="Insights"
            value="/insights"
            icon={<InsightsIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />}
          />
          <BottomNavigationAction
            label="Features"
            value="features"
            onClick={(e) => handleButtonClick(e, 'features')}
            icon={<MoodIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />}
          />
          <BottomNavigationAction
            label="More"
            value="more"
            onClick={(e) => handleButtonClick(e, 'more')}
            icon={<HelpIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />}
          />
        </BottomNavigation>
      </Paper>

      {/* Features Menu */}
      <Menu
        id="features-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && value === 'features'}
        onClose={() => handleCloseMenu(null)}
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
            boxShadow: currentMode === 'light' 
              ? '0px 4px 20px rgba(33, 150, 243, 0.15)'
              : '0px 4px 20px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: currentMode === 'light'
              ? '1px solid rgba(33, 150, 243, 0.1)'
              : '1px solid rgba(33, 150, 243, 0.05)',
            maxHeight: 'none',
            display: 'flex',
            width: { xs: '300px', sm: '400px' },
            height: { xs: '400px', sm: '500px' },
            overflow: 'hidden',
            '& .MuiList-root': {
              padding: 0,
              backgroundColor: 'transparent',
              maxHeight: '100%'
            },
            background: currentMode === 'light'
              ? 'linear-gradient(135deg, rgba(236, 246, 255, 0.85) 0%, rgba(230, 244, 255, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(13, 71, 161, 0.1) 0%, rgba(25, 118, 210, 0.15) 100%)',
          }
        }}
      >
        <Box sx={{ 
          width: { xs: '100%', sm: '60%' }, 
          p: { xs: 1.5, sm: 2 },
          overflowY: 'auto',
          backgroundColor: 'transparent',
          height: '100%',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: currentMode === 'light'
              ? 'rgba(33, 150, 243, 0.3)'
              : 'rgba(33, 150, 243, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          }
        }}>
          {features.map((feature) => (
            <MenuItem 
              key={feature.path}
              onClick={() => handleCloseMenu(feature.path)}
              onMouseEnter={() => setActivePhoto(feature.photoUrl)}
              sx={{
                borderRadius: '8px',
                mb: 1.5,
                py: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: currentMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#fff',
                backdropFilter: 'blur(5px)',
                '&:last-child': { mb: 0 },
                '&:hover': {
                  backgroundColor: menuItemHoverBg,
                  transition: 'all 0.2s ease',
                  transform: 'translateX(4px)'
                }
              }}
            >
              {React.cloneElement(feature.icon, { 
                sx: { 
                  mr: 2, 
                  fontSize: { xs: 18, sm: 24 },
                  color: currentMode === 'light' 
                    ? bottomNavTheme.palette.primary.main
                    : bottomNavTheme.palette.primary.light
                } 
              })}
              {feature.title}
            </MenuItem>
          ))}
        </Box>
        <Box 
          sx={{ 
            display: { xs: 'none', sm: 'block' },
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

      {/* More Menu */}
      <Menu
        id="more-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && value === 'more'}
        onClose={() => handleCloseMenu(null)}
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
            boxShadow: currentMode === 'light' 
              ? '0px 4px 20px rgba(33, 150, 243, 0.15)'
              : '0px 4px 20px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            border: currentMode === 'light'
              ? '1px solid rgba(33, 150, 243, 0.1)'
              : '1px solid rgba(33, 150, 243, 0.05)',
            mt: 1,
            minWidth: '200px',
            maxWidth: '250px',
            overflow: 'hidden',
            '& .MuiList-root': {
              padding: 0,
              backgroundColor: 'transparent',
              maxHeight: '100%'
            },
            background: currentMode === 'light'
              ? 'linear-gradient(135deg, rgba(236, 246, 255, 0.85) 0%, rgba(230, 244, 255, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(13, 71, 161, 0.1) 0%, rgba(25, 118, 210, 0.15) 100%)',
          }
        }}
      >
        <Box sx={{ 
          p: { xs: 1.5, sm: 2 },
          overflowY: 'auto',
          backgroundColor: 'transparent',
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: currentMode === 'light'
              ? 'rgba(33, 150, 243, 0.3)'
              : 'rgba(33, 150, 243, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          }
        }}>
          {menuItems.map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => handleCloseMenu(item.path)}
              sx={{
                borderRadius: '8px',
                mb: 1.5,
                py: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: currentMode === 'light' ? 'rgba(0, 0, 0, 0.87)' : '#fff',
                backdropFilter: 'blur(5px)',
                '&:last-child': { mb: 0 },
                '&:hover': {
                  backgroundColor: menuItemHoverBg,
                  transition: 'all 0.2s ease',
                  transform: 'translateX(4px)'
                }
              }}
            >
              {React.cloneElement(item.icon, { 
                sx: { 
                  mr: 2, 
                  fontSize: { xs: 18, sm: 24 },
                  color: currentMode === 'light' 
                    ? bottomNavTheme.palette.primary.main
                    : bottomNavTheme.palette.primary.light
                } 
              })}
              {item.title}
            </MenuItem>
          ))}
        </Box>
      </Menu>
    </ThemeProvider>
  );
};

export default BottomNav;