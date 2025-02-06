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
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
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
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'; // NEW: Therapist icon
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo'; // NEW: Reels icon
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

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
        photoUrl:
          'images/navbar/aa.jpg',
      },
      {
        title: 'Activity Logging',
        path: '/activity-logging',
        icon: <ActivityIcon />,
        photoUrl:
          'images/navbar/ac.jpg',
      },
      {
        title: 'Sleep Tracker',
        path: '/sleep-tracker',
        icon: <HotelIcon />,
        photoUrl:
          'images/navbar/sleep.jpg',
      },
      {
        title: 'Reels',
        path: '/reels',
        icon: <OndemandVideoIcon />,
        photoUrl:
          'images/navbar/reel.jpg',
      },
      {
        title: 'Meditation',
        path: '/meditations',
        icon: <MeditationIcon />,
        photoUrl:
          'images/navbar/images.jpg',
      },
    ],
  },
  { title: 'Insights', path: '/insights', icon: <InsightsIcon /> },
  { title: 'Therapists', path: '/therapist-recommendations', icon: <LocalHospitalIcon /> },
  { title: 'Profile', path: '/profile', icon: <ProfileIcon /> },
];

const Navbar = ({ toggleTheme }) => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determine if we should hide the theme toggle (on login/signup pages)
  const hideToggle = location.pathname === '/login' || location.pathname === '/signup';

  // State for tracking scroll direction for the desktop title
  const [showTitle, setShowTitle] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Set up scroll listener to hide/show the desktop title
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide title when scrolling down past 50px; show when scrolling up.
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

  // Check if the current mobile route is the reels page.
  const isReelsPageOnMobile = isMobile && location.pathname === '/reels';

  // Define a mobile-specific background gradient.
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
  const [activePhoto, setActivePhoto] = useState(
    navLinks.find((link) => link.title === 'Features')?.children[0]?.photoUrl || ''
  );

  useEffect(() => {
    const featuresLink = navLinks.find((link) => link.title === 'Features');
    if (featuresLink && featuresLink.children) {
      featuresLink.children.forEach((child) => {
        const img = new Image();
        img.src = child.photoUrl;
      });
    }
  }, []);

  // Hide the Navbar on mobile when on the '/chat' route.
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
    hidden: { y: '-120%', opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 170, damping: 26 },
    },
  };

  const toggleButtonVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { type: 'spring', stiffness: 200, damping: 20 },
    },
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, type: 'spring', stiffness: 100, damping: 15 },
    }),
  };

  const submenuItemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, type: 'spring', stiffness: 100, damping: 15 },
    }),
  };

  const commonButtonSx = {
    transition: 'color 0s ease-in-out, background-color 0s ease-in-out',
  };

  const activeLinkSx = {
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -2,
      left: 0,
      right: 0,
      height: '2px',
      backgroundColor: theme.palette.primary.main,
      borderRadius: '1px',
    },
  };

  // Updated renderDropdown function with custom scrollbar styling
  const renderDropdown = (item) => (
    <AnimatePresence>
      {submenuOpen === item.title && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          onMouseLeave={() => setSubmenuOpen(null)}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '350px',
            height: '200px',
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[5],
            borderRadius: '8px',
            overflow: 'hidden',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <Box
            sx={{
              width: '70%',
              p: 1,
              overflowY: 'auto',
              // Custom scrollbar styling for Webkit browsers:
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: theme.palette.background.paper,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.primary.main,
                borderRadius: '4px',
              },
              // For Firefox
              scrollbarWidth: 'thin',
              scrollbarColor: `${theme.palette.primary.main} ${theme.palette.background.paper}`,
            }}
          >
            <List sx={{ p: 0 }}>
              {item.children.map((child, i) => (
                <motion.div
                  key={child.title}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={submenuItemVariants}
                >
                  <ListItem disablePadding>
                    <ListItemButton
                      component={child.path.startsWith('http') ? 'a' : Link}
                      to={child.path.startsWith('http') ? undefined : child.path}
                      href={child.path.startsWith('http') ? child.path : undefined}
                      target={child.path.startsWith('http') ? '_blank' : '_self'}
                      onMouseEnter={() => setActivePhoto(child.photoUrl)}
                      onClick={() => setSubmenuOpen(null)}
                      sx={{ pl: 2, borderRadius: '8px' }}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.title} />
                    </ListItemButton>
                  </ListItem>
                </motion.div>
              ))}
            </List>
          </Box>
          <Box sx={{ width: '30%', height: '100%' }}>
            <AnimatePresence exitBeforeEnter>
              <motion.div
                key={activePhoto}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${activePhoto})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </AnimatePresence>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Mobile Navbar Container with Themed Gradient Background */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.drawer + 3,
            background: mobileNavbarBg,
            borderBottomLeftRadius: '24px',
            borderBottomRightRadius: '24px',
            overflow: 'hidden',
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button component={Link} to="/" sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Roboto", sans-serif',
                fontWeight: 700,
                color: mobileTextColor,
                textShadow: mobileTextShadow,
              }}
            >
              MindEase AI™
            </Typography>
          </Button>
          {/* Show theme toggle on mobile if not on login/signup */}
          {!hideToggle && (
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
                  '&:hover': { backgroundColor: 'transparent' },
                  transition: 'color 0s ease-in-out',
                }}
              >
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </motion.div>
          )}
        </Box>
      )}

      {/* Desktop Title */}
      {!isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: theme.spacing(2),
            left: theme.spacing(3),
            zIndex: theme.zIndex.drawer + 2,
            opacity: showTitle ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          <Button component={Link} to="/" sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Roboto", sans-serif',
                fontWeight: 700,
                color: theme.palette.text.primary,
                // Increased text shadow for better contrast on desktop
                textShadow: '4px 4px 8px rgba(0,0,0,0.8)',
                transition: 'color 0s ease-in-out',
              }}
            >
              MindEase AI™
            </Typography>
          </Button>
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
            <motion.div
              variants={navbarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{ pointerEvents: 'auto' }}
            >
              <AppBar
                position="static"
                color="transparent"
                elevation={0}
                sx={{
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 4px 16px 0 rgba(255, 255, 255, 0.1)'
                      : '0 8px 16px 0 rgba(0, 0, 0, 0.2)',
                  background: theme.palette.background.gradient,
                  px: theme.spacing(3),
                  height: '64px',
                  width: 'fit-content',
                  border:
                    theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.05)'
                      : '1px solid rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.05s ease-in-out',
                }}
              >
                <Toolbar sx={{ justifyContent: 'center', p: 0, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isAuthenticated &&
                      navLinks.map((link, index) =>
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
                                sx={{
                                  ...commonButtonSx,
                                  position: 'relative',
                                  ...(isActiveLink(link) && activeLinkSx),
                                }}
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
                              sx={{
                                ...commonButtonSx,
                                position: 'relative',
                                ...(isActiveLink(link) && activeLinkSx),
                              }}
                            >
                              {link.title}
                            </Button>
                          </motion.div>
                        )
                      )}

                    {!isAuthenticated && (
                      <>
                        <motion.div initial="hidden" animate="visible" variants={navItemVariants}>
                          <Button
                            color="inherit"
                            component={Link}
                            to="/signup"
                            sx={{
                              ...commonButtonSx,
                              position: 'relative',
                              ...(location.pathname === '/signup' && activeLinkSx),
                            }}
                          >
                            Sign Up
                          </Button>
                        </motion.div>
                        <motion.div initial="hidden" animate="visible" variants={navItemVariants}>
                          <Button
                            color="inherit"
                            component={Link}
                            to="/login"
                            sx={{
                              ...commonButtonSx,
                              position: 'relative',
                              ...(location.pathname === '/login' && activeLinkSx),
                            }}
                          >
                            Login
                          </Button>
                        </motion.div>
                      </>
                    )}

                    {isAuthenticated && (
                      <>
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
                            sx={{
                              ...commonButtonSx,
                              position: 'relative',
                              ...(isActiveLink({ path: '/logout' }) && activeLinkSx),
                            }}
                          >
                            Logout
                          </Button>
                        </motion.div>
                      </>
                    )}
                    
                    {/* Show theme toggle button if not on login/signup */}
                    {!hideToggle && (
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
                            '&:hover': { backgroundColor: 'transparent' },
                            transition: 'color 0s ease-in-out',
                          }}
                        >
                          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                      </motion.div>
                    )}
                  </Box>
                </Toolbar>
              </AppBar>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      {/* Desktop Navbar Toggle Button (authenticated users only) */}
      <AnimatePresence>
        {isAuthenticated && !isNavbarVisible && !isMobile && (
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
