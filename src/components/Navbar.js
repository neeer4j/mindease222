// src/components/Navbar.js

import React, { useContext, useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  Typography,
  useTheme,
  Tooltip,
  Switch,
} from '@mui/material';
import { alpha } from '@mui/material/styles';  // Add this import
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext, useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

// Import required icons
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChatIcon from '@mui/icons-material/Chat';
import MoodIcon from '@mui/icons-material/Mood';
import ActivityIcon from '@mui/icons-material/LocalActivity';
import InsightsIcon from '@mui/icons-material/Insights';
import ProfileIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import HotelIcon from '@mui/icons-material/Hotel';
import MeditationIcon from '@mui/icons-material/SelfImprovement';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountBoxIcon from '@mui/icons-material/AccountBox';

const NavToolsStyling = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

// Update fixed admin toggle style to move it slightly upward
const FixedAdminToggleStyle = {
  position: 'fixed',
  right: '20px',
  top: '15px',  // Changed from 20px to 15px for better alignment
  zIndex: 2000,
  backgroundColor: 'background.paper',
  padding: 1,
  borderRadius: '20px',
  boxShadow: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const Navbar = ({ toggleTheme }) => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, isAdmin, isInAdminMode, toggleAdminMode } = useAuth();

  // Determine if we should hide the theme toggle (on login/signup pages)
  const hideToggle = location.pathname === '/login' || location.pathname === '/signup';

  // Determine if we should hide admin features
  const hideAdminFeatures = !isAuthenticated || !isAdmin || location.pathname === '/login' || location.pathname === '/signup';

  // State for tracking scroll direction for the desktop title
  const [showTitle, setShowTitle] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Set up scroll listener to hide/show the desktop title
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowTitle(false);
      } else {
        setShowTitle(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Define mobile-specific background gradient.
  const mobileNavbarBg =
    theme.palette.mode === 'light'
      ? 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 40%, transparent 90%)'
      : 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 40%, transparent 90%)';

  const mobileTextColor = theme.palette.mode === 'light' ? theme.palette.text.primary : '#fff';
  const mobileTextShadow =
    theme.palette.mode === 'light'
      ? '2px 2px 4px rgba(0,0,0,0.3)'
      : '2px 2px 4px rgba(0,0,0,0.7)';

  const [submenuOpen, setSubmenuOpen] = useState(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [activePhoto, setActivePhoto] = useState('');

  // Define handleFeatureClick inside Navbar so that navigate is available
  const handleFeatureClick = (path) => {
    // Check if user has seen the tutorial for this feature
    const tutorialFlags = {
      '/mood-tracker': 'moodTrackerTutorialSeen',
      '/activity-logging': 'activityLoggingTutorialSeen',
      '/meditations': 'meditationsTutorialSeen',
      '/sleep-tracker': 'sleepMonitorTutorialSeen',
    };

    const flag = tutorialFlags[path];
    if (flag) {
      const hasSeenTutorial = localStorage.getItem(flag);
      if (!hasSeenTutorial) {
        localStorage.removeItem(flag); // Reset the flag to ensure splash shows
      }
    }
    navigate(path);
  };

  // Define navLinks inside Navbar so that onClick can reference handleFeatureClick
  const navLinks = [
    { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { title: 'Chat', path: '/chat', icon: <ChatIcon /> },
    {
      title: 'Features',
      icon: <MoodIcon />,
      children: [
        {
          title: 'Mood Tracker',
          path: '/mood-tracker',
          icon: <MoodIcon />,
          photoUrl: '/images/navbar/aa.jpg',
          onClick: () => handleFeatureClick('/mood-tracker'),
        },
        {
          title: 'Activity Logging',
          path: '/activity-logging',
          icon: <ActivityIcon />,
          photoUrl: '/images/navbar/ac.jpg',
          onClick: () => handleFeatureClick('/activity-logging'),
        },
        {
          title: 'Sleep Tracker',
          path: '/sleep-tracker',
          icon: <HotelIcon />,
          photoUrl: '/images/navbar/sleep.jpg',
        },
        {
          title: 'Reels',
          path: '/reels',
          icon: <OndemandVideoIcon />,
          photoUrl: '/images/navbar/reel.jpg',
        },
        {
          title: 'Meditation',
          path: '/meditations',
          icon: <MeditationIcon />,
          photoUrl: '/images/navbar/images.jpg',
          onClick: () => handleFeatureClick('/meditations'),
        },
      ],
    },
    { title: 'Insights', path: '/insights', icon: <InsightsIcon /> },
    { title: 'Therapists', path: '/therapist-recommendations', icon: <LocalHospitalIcon /> },
    { title: 'Profile', path: '/profile', icon: <ProfileIcon /> },
    // Removed the "Contact Support" link from here.
  ];

  // Preload images and set initial active photo
  useEffect(() => {
    const featuresLink = navLinks.find((link) => link.title === 'Features');
    if (featuresLink && featuresLink.children) {
      // Preload all feature images
      featuresLink.children.forEach((child) => {
        if (child.photoUrl) {
          const img = new Image();
          img.src = child.photoUrl;
        }
      });
      // Set initial active photo
      if (featuresLink.children[0]?.photoUrl) {
        setActivePhoto(featuresLink.children[0].photoUrl);
      }
    }
  }, []);

  // Hide Navbar on mobile when on '/chat'
  if (isMobile && location.pathname === '/chat') {
    return null;
  }

  const isActiveLink = (link) => {
    if (link.path && location.pathname === link.path) return true;
    if (link.children) {
      return link.children.some((child) => location.pathname === child.path);
    }
    return false;
  };

  const handleLogout = () => {
    if (isAdmin && isInAdminMode) {
      toggleAdminMode(); // Turn off admin mode when logging out
    }
    logout();
    navigate('/login');
  };

  const handleSubmenuToggle = (title) => {
    setSubmenuOpen((prev) => (prev === title ? null : title));
  };

  const toggleNavbarVisibility = () => {
    setIsNavbarVisible((prev) => !prev);
  };

  const navbarVariants = {
    hidden: { 
      y: '-120%', 
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        duration: 0.4
      }
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 120, 
        damping: 22,
        duration: 0.4,
        mass: 1.2
      }
    }
  };

  const toggleButtonVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { 
        type: 'spring', 
        stiffness: 200, 
        damping: 20,
        duration: 0.3
      }
    }
  };

  const navItemVariants = {
    hidden: { 
      opacity: 0, 
      y: -10,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay: i * 0.06, 
        type: 'spring', 
        stiffness: 120, 
        damping: 14,
        mass: 1
      }
    })
  };

  const submenuItemVariants = {
    hidden: { 
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    visible: (i = 0) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: [0.48, 0.15, 0.25, 0.96]
      }
    }),
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
        ease: 'easeInOut'
      }
    }
  };

  const commonButtonSx = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    '&:hover': {
      backgroundColor: 'transparent',
      '& .MuiSvgIcon-root': {
        transform: 'scale(1.05)',
        color: theme.palette.primary.main,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '& .MuiButton-label': {
        color: theme.palette.primary.main,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -2,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '1px',
        transform: 'scaleX(1)',
        opacity: 0.5,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -2,
      left: 0,
      right: 0,
      height: '2px',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '1px',
      transform: 'scaleX(0)',
      opacity: 0,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }
  };

  const activeLinkSx = {
    position: 'relative',
    color: theme.palette.primary.main,
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.main,
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -2,
      left: 0,
      right: 0,
      height: '2px',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '1px',
      transform: 'scaleX(1)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  };

  // Dropdown for nav items with children
  const renderDropdown = (item) => (
    <AnimatePresence>
      {submenuOpen === item.title && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              type: 'spring',
              stiffness: 260,
              damping: 20
            }
          }}
          exit={{ 
            opacity: 0, 
            y: 10,
            transition: {
              duration: 0.2,
              ease: 'easeInOut'
            }
          }}
          onMouseLeave={() => setSubmenuOpen(null)}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '500px',
            backgroundColor: theme.palette.mode === 'light'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
            borderRadius: '16px',
            boxShadow: theme.palette.mode === 'dark'
              ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
              : `0 8px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
            border: `1px solid ${theme.palette.mode === 'light'
              ? alpha(theme.palette.primary.main, 0.2)
              : alpha(theme.palette.primary.main, 0.15)}`,
            zIndex: 1000,
            padding: 0,
            display: 'flex',
            overflow: 'hidden',
            transform: 'translateZ(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Box
            sx={{
              width: '60%',
              p: 2,
              background: theme.palette.background.paper,
              borderRight: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.1 : 0.15)}`,
              '&::-webkit-scrollbar': { 
                width: '6px',
                background: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': { 
                background: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                borderRadius: '6px',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)
                }
              },
              scrollbarWidth: 'thin',
              scrollbarColor: `${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)} transparent`
            }}
          >
            <List sx={{ p: 0 }}>
              {item.children.map((child, i) => (
                <motion.div 
                  key={child.title} 
                  custom={i} 
                  initial="hidden" 
                  animate="visible" 
                  exit="exit" 
                  variants={submenuItemVariants}
                >
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      component={child.path.startsWith('http') ? 'a' : Link}
                      to={child.path.startsWith('http') ? undefined : child.path}
                      href={child.path.startsWith('http') ? child.path : undefined}
                      target={child.path.startsWith('http') ? '_blank' : '_self'}
                      onMouseEnter={() => {
                        if (child.photoUrl) {
                          setActivePhoto(child.photoUrl);
                        }
                      }}
                      onClick={() => {
                        setSubmenuOpen(null);
                        if (child.onClick) {
                          child.onClick();
                        }
                      }}
                      sx={{ 
                        pl: 2,
                        py: 1.5,
                        borderRadius: '12px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.primary.main, 0.15)
                            : alpha(theme.palette.primary.main, 0.08),
                          transform: 'translateX(4px)',
                          '& .MuiListItemIcon-root': {
                            transform: 'scale(1.1)',
                            color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                          },
                          '& .MuiListItemText-primary': {
                            color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main
                          }
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
                          opacity: 0,
                          transition: 'opacity 0.3s ease-in-out',
                        },
                        '&:hover::before': {
                          opacity: 1,
                        }
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          minWidth: 40,
                          color: theme.palette.text.secondary,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: 'translateZ(0)',
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.5rem',
                          }
                        }}
                      >
                        {child.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={child.title}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontWeight: 500,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            color: theme.palette.text.primary
                          }
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </motion.div>
              ))}
            </List>
          </Box>
          <Box 
            sx={{ 
              width: '40%', 
              position: 'relative',
              background: theme.palette.background.paper,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {activePhoto && (
              <Box
                component="img"
                src={activePhoto}
                alt="Feature preview"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: theme.palette.mode === 'dark' ? 0.7 : 0.9,
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'translateZ(0)',
                  filter: theme.palette.mode === 'dark' ? 'brightness(0.8) contrast(1.2)' : 'none'
                }}
              />
            )}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Move Admin Toggle outside of navbar - Only show when authenticated and admin, and not on login/signup pages */}
      {isAdmin && isAuthenticated && !hideToggle && !isMobile && (
        <Box 
          sx={{
            ...FixedAdminToggleStyle,
            opacity: showTitle ? 1 : 0,
            transform: showTitle ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          }}
        >
          <Tooltip title={isInAdminMode ? 'Switch to User Mode' : 'Switch to Admin Mode'}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Switch
                checked={isInAdminMode}
                onChange={(e) => {
                  toggleAdminMode();
                  if (e.target.checked) {
                    navigate('/admin');
                  } else {
                    navigate('/dashboard');
                  }
                }}
                color="primary"
                size="small"
              />
              <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.7rem', textAlign: 'center' }}>
                {isInAdminMode ? 'Admin' : 'User'}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
      )}

      {/* Mobile Navbar */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: -9,
            right: 0,
            zIndex: theme.zIndex.drawer + 3,
            background: mobileNavbarBg,
            borderBottomLeftRadius: '24px',
            borderBottomRightRadius: '24px',
            overflow: 'visible',
            px: 2,
            py: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '65px',
            paddingTop: '26px',
            opacity: showTitle ? 1 : 0,
            transform: showTitle ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Link 
            to="/" 
            style={{ 
              display: 'flex', 
              textDecoration: 'none',
              position: 'relative',
              height: '70px', // Adjusted to match visible image height
              width: '140px', // Adjusted to match visible image width
              alignItems: 'center',
              overflow: 'hidden' // Added to clip the clickable area
            }}
          >
            <img
              src="/navbar/title/mindwasess.png"
              alt="MindEase AI"
              style={{
                height: '300px',
                width: 'auto',
                filter: theme.palette.mode === 'dark' ? 'brightness(1.5)' : 'none',
                transition: 'all 0.3s ease',
                marginLeft: '-40px',
                marginTop: '-110px', // Adjusted to center the visible portion
                marginBottom: '-120px', // Adjusted to center the visible portion
                objectFit: 'contain',
                transform: 'translateX(-25px)'
              }}
            />
          </Link>

          {/* Theme Toggle for Mobile */}
          {!hideToggle && (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: theme.palette.mode === 'dark' ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <IconButton
                  onClick={toggleTheme}
                  color="inherit"
                  aria-label="Toggle light and dark mode"
                  disableRipple
                  disableFocusRipple
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: 'transparent',
                      transform: 'scale(1.1)',
                    }, 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& svg': {
                      fontSize: '1.5rem',
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'rotate(180deg)'
                      }
                    }
                  }}
                >
                  {theme.palette.mode === 'dark' ? (
                    <Brightness7Icon sx={{ color: 'primary.light' }} />
                  ) : (
                    <Brightness4Icon sx={{ color: 'primary.main' }} />
                  )}
                </IconButton>
              </motion.div>
            </Box>
          )}
        </Box>
      )}

      {/* Desktop Title */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: theme.zIndex.drawer + 2,
            opacity: showTitle ? 1 : 0,
            transform: showTitle ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            height: '100px',
            display: 'flex',
            alignItems: 'flex-start'
          }}
        >
          <Link 
            to="/" 
            style={{ 
              display: 'flex', 
              textDecoration: 'none',
              position: 'relative',
              height: '100px', // Match visible height
              width: '200px', // Match visible width
              alignItems: 'flex-start', // Align from top
              overflow: 'hidden' // Added to clip the clickable area
            }}
          >
            <img
              src="/navbar/title/mindwasess.png"
              alt="MindEase AI"
              style={{
                height: '280px', // Further increased size
                width: 'auto',
                filter: theme.palette.mode === 'dark' ? 'brightness(1.5)' : 'none',
                transition: 'all 0.3s ease',
                marginLeft: '-25px', // Increased negative margin to move left
                marginTop: '-90px', // Adjusted to show more of the top portion
                marginBottom: '-90px',
                objectFit: 'contain',
                transform: 'translateX(-20px)' // Added translation to move left
              }}
            />
          </Link>
        </Box>
      )}

      {/* Desktop Navbar */}
      <AnimatePresence>
        {isNavbarVisible && !isMobile && (
          <Box
            sx={{
              position: 'fixed',
              top: theme.spacing(1),
              left: 0,
              right: 0,
              zIndex: theme.zIndex.drawer + 1,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <motion.div variants={navbarVariants} initial="hidden" animate="visible" exit="hidden" style={{ pointerEvents: 'auto' }}>
              <AppBar
                position="static"
                color="transparent"
                elevation={0}
                sx={{
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 4px 16px 0 rgba(255, 255, 255, 0.1)'
                    : '0 8px 16px 0 rgba(0, 0, 0, 0.2)',
                  background: theme.palette.background.gradient,
                  px: theme.spacing(3),
                  height: '64px',
                  width: 'fit-content',
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.05)'
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.05s ease-in-out',
                }}
              >
                <Toolbar sx={{ justifyContent: 'center', p: 0, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isAuthenticated ? (
                      (isAdmin && isInAdminMode) ? (
                        <motion.div initial="hidden" animate="visible" variants={navItemVariants}>
                          <Button color="inherit" startIcon={<AdminPanelSettingsIcon />} component={Link} to="/admin" sx={{ ...commonButtonSx, position: 'relative' }}>
                            Admin Dashboard
                          </Button>
                        </motion.div>
                      ) : (
                        <>
                          {navLinks.map((link, index) =>
                            link.children ? (
                              <Box key={link.title} sx={{ position: 'relative' }}>
                                <motion.div custom={index} initial="hidden" animate="visible" variants={navItemVariants}>
                                  <Button
                                    color="inherit"
                                    startIcon={link.icon}
                                    onClick={() => handleSubmenuToggle(link.title)}
                                    aria-controls={submenuOpen === link.title ? 'submenu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={submenuOpen === link.title ? 'true' : undefined}
                                    sx={{ ...commonButtonSx, position: 'relative', ...(isActiveLink(link) && activeLinkSx) }}
                                  >
                                    {link.title}
                                  </Button>
                                </motion.div>
                                {renderDropdown(link)}
                              </Box>
                            ) : (
                              <motion.div key={link.title} custom={index} initial="hidden" animate="visible" variants={navItemVariants}>
                                <Button
                                  color="inherit"
                                  startIcon={link.icon}
                                  component={Link}
                                  to={link.path}
                                  sx={{ ...commonButtonSx, position: 'relative', ...(isActiveLink(link) && activeLinkSx) }}
                                >
                                  {link.title}
                                </Button>
                              </motion.div>
                            )
                          )}
                          <motion.div whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
                            <IconButton onClick={toggleNavbarVisibility} color="inherit" aria-label="Toggle navbar" sx={{ ...commonButtonSx }}>
                              <CloseIcon />
                            </IconButton>
                          </motion.div>
                          <motion.div initial="hidden" animate="visible" variants={navItemVariants}>
                            <Button
                              color="inherit"
                              startIcon={<LogoutIcon />}
                              onClick={handleLogout}
                              sx={{ ...commonButtonSx, position: 'relative', ...(isActiveLink({ path: '/logout' }) && activeLinkSx) }}
                            >
                              Logout
                            </Button>
                          </motion.div>
                        </>
                      )
                    ) : (
                      <>
                        <motion.div initial="hidden" animate="visible" variants={navItemVariants}>
                          <Button
                            color="inherit"
                            component={Link}
                            to="/signup"
                            sx={{ ...commonButtonSx, position: 'relative', ...(location.pathname === '/signup' && activeLinkSx) }}
                          >
                            Sign Up
                          </Button>
                        </motion.div>
                        <motion.div initial="hidden" animate="visible" variants={navItemVariants}>
                          <Button
                            color="inherit"
                            component={Link}
                            to="/login"
                            sx={{ ...commonButtonSx, position: 'relative', ...(location.pathname === '/login' && activeLinkSx) }}
                          >
                            Login
                          </Button>
                        </motion.div>
                      </>
                    )}

                    {/* Keep Theme Toggle in navbar but remove Admin Toggle */}
                    <Box sx={{ ...NavToolsStyling, ml: 'auto' }}>
                      {!hideToggle && (
                        <>
                          <motion.div
                            whileTap={{ scale: 0.9 }}
                            animate={{ rotate: theme.palette.mode === 'dark' ? 180 : 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <IconButton
                              onClick={toggleTheme}
                              color="inherit"
                              aria-label="Toggle light and dark mode"
                              disableRipple
                              disableFocusRipple
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: 'transparent',
                                  transform: 'scale(1.1)',
                                }, 
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '& svg': {
                                  fontSize: '1.5rem',
                                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    transform: 'rotate(180deg)'
                                  }
                                }
                              }}
                            >
                              {theme.palette.mode === 'dark' ? (
                                <Brightness7Icon sx={{ color: 'primary.light' }} />
                              ) : (
                                <Brightness4Icon sx={{ color: 'primary.main' }} />
                              )}
                            </IconButton>
                          </motion.div>
                        </>
                      )}
                    </Box>
                  </Box>
                </Toolbar>
              </AppBar>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      {/* Desktop Navbar Toggle Button (only for non-admin mode) */}
      <AnimatePresence>
        {isAuthenticated && !(isAdmin && isInAdminMode) && !isNavbarVisible && !isMobile && (
          <motion.div
            variants={toggleButtonVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              position: 'fixed',
              top: theme.spacing(1),
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: theme.zIndex.appBar + 1,
              backgroundColor: theme.palette.background.paper,
              borderRadius: '50%',
              boxShadow: theme.shadows[4],
            }}
          >
            <IconButton onClick={toggleNavbarVisibility} color="inherit" aria-label="Show navbar">
              <MenuIcon />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
