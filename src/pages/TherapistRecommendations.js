// src/pages/TherapistRecommendations.js

import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Snackbar,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/system';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { TherapistFindContext } from '../contexts/TherapistFindContext';

// -----------------------
// Styled Components
// -----------------------

// Dashboard container with smooth scrolling styles
const DashboardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
  '& > *': {
    overflowY: 'auto',
    scrollBehavior: 'smooth',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: alpha(theme.palette.background.paper, 0.1),
      borderRadius: '8px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
      borderRadius: '8px',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.3),
      },
    },
  },
}));

// Updated WidgetCard: Retains the old gradient & border but removes backdropFilter
const WidgetCard = styled(Card)(({ theme }) => ({
  borderRadius: '20px',
  boxShadow: 'none',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: 320,
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.95)} 0%,
    ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
  position: 'relative',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main} 0%,
      ${theme.palette.secondary.main} 100%)`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px -12px ${alpha(theme.palette.primary.main, 0.2)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
    '&:before': {
      opacity: 1,
    },
  },
}));

const WidgetContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(3),
  flexGrow: 1,
  overflowY: 'auto',
  scrollBehavior: 'smooth',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.primary.main, 0.2),
    borderRadius: '4px',
  },
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const WidgetHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  backgroundColor: 'transparent',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  '& .MuiTypography-subtitle2': {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    letterSpacing: '0.5px',
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
  },
}));

// HeroSection for the header area (unchanged if desired)
const HeroSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: theme.spacing(6, 4),
  borderRadius: '32px',
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.08)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  boxShadow: `0 20px 40px -12px ${alpha(theme.palette.primary.main, 0.1)}`,
  color: theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at top right, 
      ${alpha(theme.palette.primary.main, 0.1)} 0%, 
      transparent 70%)`,
    zIndex: 0,
  },
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: `0 24px 48px -12px ${alpha(theme.palette.primary.main, 0.15)}`,
  },
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    textAlign: 'center',
    padding: theme.spacing(4, 2),
  },
}));

const HeroTextContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  textAlign: 'left',
  [theme.breakpoints.down('sm')]: {
    textAlign: 'center',
  },
}));

const HeroTextH4 = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  color: 'inherit',
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  },
}));

const GlobalStyles = styled('div')(() => ({
  '@keyframes rotate': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  '.refreshing': {
    animation: 'rotate 1s linear infinite',
  },
}));

// -----------------------
// Motion Variants
// -----------------------

const mainContentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

const widgetVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delayChildren: 0.1, staggerChildren: 0.05 } },
};

const widgetItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// -----------------------
// TherapistWidget Component
// -----------------------

const TherapistWidget = ({ therapist, handleDetailsClick }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${therapist.id}`;

  return (
    <motion.div 
      variants={widgetItemVariants} 
      style={{ height: '100%' }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <WidgetCard>
        <WidgetHeader>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <PersonIcon sx={{ fontSize: '1.75rem', color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 0.5 
                }}
              >
                {`Dr. ${therapist.name}`}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500 
                }}
              >
                Healthcare Professional
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.1),
              padding: '6px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <StarIcon sx={{ color: 'warning.main', fontSize: '1rem' }} />
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                color: 'warning.main'
              }}
            >
              {therapist.rating}
            </Typography>
          </Box>
        </WidgetHeader>
        <WidgetContent ref={contentRef}>
          <Box 
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
              borderRadius: '12px',
              padding: 2,
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                color: 'primary.main',
                letterSpacing: '0.5px'
              }}
            >
              {`Specializes in ${therapist.specialty}`}
            </Typography>
          </Box>
          
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              backgroundColor: (theme) => alpha(theme.palette.background.default, 0.4),
              borderRadius: '12px',
              padding: 2
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <LocationOnIcon color="primary" sx={{ fontSize: '1.2rem' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  Practice Location
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {therapist.address}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1.5}>
              <PhoneIcon color="primary" sx={{ fontSize: '1.2rem' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                  Contact Number
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {therapist.phone}
                </Typography>
              </Box>
            </Box>
          </Box>
        </WidgetContent>
        
        <CardActions sx={{
          padding: 2,
          gap: 1.5,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.6),
          '& .MuiButton-root': {
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            flex: 1,
            padding: '10px 16px',
            fontSize: '0.9rem',
            letterSpacing: '0.5px'
          }
        }}>
          <Button
            variant="contained"
            onClick={() => handleDetailsClick(therapist)}
            startIcon={<VisibilityIcon />}
            size="large"
          >
            Full Profile
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="large"
          >
            Directions
          </Button>
        </CardActions>
      </WidgetCard>
    </motion.div>
  );
};

// -----------------------
// TherapistDetailsContent Component
// -----------------------

const TherapistDetailsContent = ({ therapist, onClose }) => {
  const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${therapist.id}`;
  return (
    <>
      <DialogTitle>{therapist.name}</DialogTitle>
      <DialogContent sx={{ padding: { xs: 2, sm: 3 } }}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="flex" alignItems="center">
            <LocationOnIcon fontSize="medium" color="primary" sx={{ mr: 1 }} />
            <Typography variant="body1">{therapist.address}</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <StarIcon fontSize="medium" color="warning" sx={{ mr: 1 }} />
            <Typography variant="body1">{therapist.rating} / 5</Typography>
          </Box>
          <Box display="flex" alignItems="center">
            <PhoneIcon fontSize="medium" color="primary" sx={{ mr: 1 }} />
            <Typography variant="body1">{therapist.phone}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              <strong>Specialty:</strong> {therapist.specialty}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          size="small"
          color="secondary"
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Maps
        </Button>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </>
  );
};

// -----------------------
// Main Component: TherapistRecommendations
// -----------------------

const TherapistRecommendations = () => {
  const {
    therapists,
    loading,
    error,
    fetchTherapists,
    clearTherapists,
  } = useContext(TherapistFindContext);
  const [locationError, setLocationError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * fetchData: Gets user's current location and uses the context's fetchTherapists
   * method to fetch therapist recommendations.
   */
  const fetchData = (force = false) => {
    setLocationError(null);
    setIsRefreshing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`User location: ${latitude}, ${longitude}`);
          // Pass force=true to always fetch fresh data.
          fetchTherapists(latitude, longitude, force);
          setIsRefreshing(false);
        },
        (err) => {
          console.error("Error obtaining location:", err);
          setLocationError(
            "Unable to access your location. Please ensure location services are enabled for your browser and this site."
          );
          setSnackbarMessage("Location access denied.");
          setSnackbarSeverity("warning");
          setSnackbarOpen(true);
          setIsRefreshing(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      setSnackbarMessage("Geolocation not supported.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setIsRefreshing(false);
    }
  };

  // On mount, if no cached data exists, fetch data.
  useEffect(() => {
    if (therapists.length === 0) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  }, [error]);

  // Handle manual refresh: clear cached data and force a new fetch.
  const handleRefresh = () => {
    clearTherapists();
    fetchData(true);
    setSnackbarMessage("Therapist recommendations refreshed.");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // Open details dialog for the selected therapist.
  const handleDetailsClick = (therapist) => {
    setSelectedTherapist(therapist);
    setDialogOpen(true);
  };

  // Close the details dialog.
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTherapist(null);
  };

  return (
    <GlobalStyles>
      <DashboardContainer>
        <PageLayout>
          <motion.main variants={mainContentVariants} initial="hidden" animate="visible">
            <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
              <HeroSection>
                <HeroTextContainer>
                  <HeroTextH4 variant="h4">
                    Your Path to Well-being Starts Here
                  </HeroTextH4>
                  <Typography variant="subtitle1" color="inherit">
                    {locationError
                      ? locationError
                      : "Discover compassionate therapists ready to support you."}
                  </Typography>
                </HeroTextContainer>
                {/* Refresh Button */}
                <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                  <IconButton
                    onClick={handleRefresh}
                    color="primary"
                    disabled={isRefreshing}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,1)' },
                    }}
                  >
                    <RefreshIcon className={isRefreshing ? 'refreshing' : ''} />
                  </IconButton>
                </Box>
              </HeroSection>

              <motion.div variants={widgetVariants} initial="hidden" animate="visible">
                <Grid container spacing={3}>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <WidgetCard>
                          <WidgetHeader>
                            <Skeleton variant="text" width="60%" />
                          </WidgetHeader>
                          <WidgetContent>
                            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: '8px' }} />
                          </WidgetContent>
                          <CardActions>
                            <Skeleton variant="text" width="40%" />
                          </CardActions>
                        </WidgetCard>
                      </Grid>
                    ))
                  ) : therapists.length > 0 ? (
                    therapists.map((therapist) => (
                      <Grid item xs={12} md={4} key={therapist.id}>
                        <TherapistWidget therapist={therapist} handleDetailsClick={handleDetailsClick} />
                      </Grid>
                    ))
                  ) : !loading && !locationError ? (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="textSecondary" align="center">
                        No therapists found in your area. Please try again later or refresh.
                      </Typography>
                    </Grid>
                  ) : null}
                </Grid>
              </motion.div>
            </Container>
          </motion.main>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>

          <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
            {selectedTherapist && (
              <TherapistDetailsContent therapist={selectedTherapist} onClose={handleDialogClose} />
            )}
          </Dialog>
        </PageLayout>
      </DashboardContainer>
    </GlobalStyles>
  );
};

export default TherapistRecommendations;