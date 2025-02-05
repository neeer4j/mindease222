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
  Avatar,
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
import { styled } from '@mui/system';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { TherapistFindContext } from '../contexts/TherapistFindContext';

// -----------------------
// Styled Components
// -----------------------

const DashboardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
}));

const WidgetCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: theme.shadows[3],
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: 240,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[5],
  },
}));

const WidgetContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2),
  flexGrow: 1,
  overflowY: 'auto',
  '&::-webkit-scrollbar': { display: 'none' },
  '-ms-overflow-style': 'none',
  'scrollbar-width': 'none',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  '& .MuiTypography-body2': {
    fontSize: { xs: '0.9rem', sm: '1rem' },
  },
}));

const WidgetHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  '& .MuiTypography-subtitle2': {
    fontSize: { xs: '1rem', sm: '1.1rem' },
  },
}));

const HeroSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(4),
  borderRadius: '24px',
  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
  color: theme.palette.common.white,
  boxShadow: theme.shadows[4],
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    textAlign: 'center',
    padding: theme.spacing(3),
  },
}));

const HeroAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(10),
  height: theme.spacing(10),
  marginRight: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  border: `2px solid ${theme.palette.common.white}`,
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(2),
    marginRight: 0,
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
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delayChildren: 0.1, staggerChildren: 0.05 },
  },
};

const widgetItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// -----------------------
// TherapistWidget Component
// -----------------------

// Inside TherapistWidget component in src/pages/TherapistRecommendations.js

const TherapistWidget = ({ therapist, handleDetailsClick }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  // Construct direct Google Maps URL using place_id
  const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${therapist.id}`;

  return (
    <motion.div variants={widgetItemVariants} style={{ height: '100%' }}>
      <WidgetCard>
        <WidgetHeader>
          <Typography variant="subtitle2">{therapist.name}</Typography>
          <Avatar
            src={therapist.avatarUrl}
            alt={therapist.name}
            sx={{ width: 32, height: 32 }}
          />
        </WidgetHeader>
        <WidgetContent ref={contentRef}>
          <Box mb={1}>
            <Typography variant="body2" color="textSecondary">
              <strong>Specialty:</strong> {therapist.specialty}
            </Typography>
          </Box>
          <Box mb={1} display="flex" alignItems="center">
            <LocationOnIcon fontSize="medium" color="primary" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="textSecondary">
              {therapist.address}
            </Typography>
          </Box>
          {therapist.distance != null && (
            <Box mb={1} display="flex" alignItems="center">
              <Typography variant="caption" color="textSecondary">
                {therapist.distance.toFixed(1)} km away
              </Typography>
            </Box>
          )}
          <Box display="flex" alignItems="center">
            <StarIcon fontSize="medium" color="warning" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="textSecondary">
              {therapist.rating} / 5
            </Typography>
          </Box>
          <Box mt={1} display="flex" alignItems="center">
            <PhoneIcon fontSize="medium" color="primary" sx={{ mr: 0.5 }} />
            <Typography variant="body2" color="textSecondary">
              {therapist.phone}
            </Typography>
          </Box>
        </WidgetContent>
        <CardActions
          sx={{
            justifyContent: 'space-between',
            '& .MuiButton-root': {
              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' },
              padding: { xs: '4px 8px', sm: '6px 12px', md: '8px 16px' },
            },
          }}
        >
          <Button
            size="small"
            onClick={() => handleDetailsClick(therapist)}
            startIcon={<VisibilityIcon fontSize="small" />}
          >
            Details
          </Button>
          <Button
            size="small"
            color="secondary"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps
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
        {therapist.avatarUrl && (
          <Box mt={3} display="flex" justifyContent="center">
            <Avatar
              src={therapist.avatarUrl}
              alt={therapist.name}
              sx={{ width: 120, height: 120 }}
            />
          </Box>
        )}
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

  // New state to track when Google Maps API is loaded
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);

  // -----------------------
  // 1) Dynamically Load Google Maps JS API
  // -----------------------
  useEffect(() => {
    const googleApiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    if (!googleApiKey) {
      console.error(
        'Google API key is missing. Please set REACT_APP_GOOGLE_API_KEY in your .env file!'
      );
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    // Listen for the load event so we know the API is ready.
    script.addEventListener('load', () => {
      console.log('Google Maps API loaded successfully.');
      setGoogleApiLoaded(true);
    });

    script.addEventListener('error', () => {
      console.error('Failed to load Google Maps API.');
      // Optionally, you might want to update state to reflect this error.
      setGoogleApiLoaded(false);
    });

    document.head.appendChild(script);

    // Cleanup on unmount.
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // -----------------------
  // 2) Get User's Location and Fetch Therapists (only after API is loaded)
  // -----------------------
  const fetchData = (force = false) => {
    if (!force && therapists.length > 0) return;
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
          console.error('Error obtaining location:', err);
          setLocationError(
            'Unable to access your location. Please ensure location services are enabled for your browser and this site.'
          );
          setSnackbarMessage('Location access denied.');
          setSnackbarSeverity('warning');
          setSnackbarOpen(true);
          setIsRefreshing(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
      setSnackbarMessage('Geolocation not supported.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setIsRefreshing(false);
    }
  };

  // Trigger fetchData only after the Google API is loaded.
  useEffect(() => {
    if (googleApiLoaded && therapists.length === 0) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleApiLoaded]);

  // Also, if there's an error in fetching therapists, show it in the Snackbar.
  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [error]);

  // Manual refresh: clear data and force a new fetch.
  const handleRefresh = () => {
    clearTherapists(); // Clear cached data.
    fetchData(true); // Force a new API call.
    setSnackbarMessage('Therapist recommendations refreshed.');
    setSnackbarSeverity('info');
    setSnackbarOpen(true);
    setIsRefreshing(true);

    // Add a slight delay for the "spinning" icon.
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Close the Snackbar.
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // Show details for the selected therapist.
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
          <motion.main
            variants={mainContentVariants}
            initial="hidden"
            animate="visible"
          >
            <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
              <HeroSection>
                <HeroAvatar
                  src="https://therapybrands.com/wp-content/uploads/2023/04/Blog-Header-Images-6.jpg"
                  alt="Hero Avatar"
                  imgProps={{ referrerPolicy: 'no-referrer' }}
                />
                <HeroTextContainer>
                  <HeroTextH4 variant="h4">
                    Your Path to Well-being Starts Here
                  </HeroTextH4>
                  <Typography variant="subtitle1" color="inherit">
                    {locationError
                      ? locationError
                      : 'Discover compassionate therapists ready to support you.'}
                  </Typography>
                </HeroTextContainer>
                {/* Refresh button in the top-right corner */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 10,
                  }}
                >
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

              {/* Therapist Widgets or Loading Skeleton */}
              <motion.div
                variants={widgetVariants}
                initial="hidden"
                animate="visible"
              >
                <Grid container spacing={3}>
                  {loading ? (
                    // Show skeleton placeholders while loading.
                    Array.from({ length: 3 }).map((_, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <WidgetCard>
                          <WidgetHeader>
                            <Skeleton variant="text" width="60%" />
                          </WidgetHeader>
                          <WidgetContent>
                            <Skeleton
                              variant="rectangular"
                              height={100}
                              sx={{ borderRadius: '8px' }}
                            />
                          </WidgetContent>
                          <CardActions>
                            <Skeleton variant="text" width="40%" />
                          </CardActions>
                        </WidgetCard>
                      </Grid>
                    ))
                  ) : therapists.length > 0 ? (
                    // Show therapist widgets.
                    therapists.map((therapist) => (
                      <Grid item xs={12} md={4} key={therapist.id}>
                        <TherapistWidget
                          therapist={therapist}
                          handleDetailsClick={handleDetailsClick}
                        />
                      </Grid>
                    ))
                  ) : !loading && !locationError ? (
                    // No therapists found.
                    <Grid item xs={12}>
                      <Typography
                        variant="subtitle1"
                        color="textSecondary"
                        align="center"
                      >
                        No therapists found in your area. Please try again later or
                        refresh.
                      </Typography>
                    </Grid>
                  ) : null}
                </Grid>
              </motion.div>
            </Container>
          </motion.main>

          {/* Snackbar for alerts */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarSeverity}
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>

          {/* Dialog for therapist details */}
          <Dialog
            open={dialogOpen}
            onClose={handleDialogClose}
            fullWidth
            maxWidth="sm"
          >
            {selectedTherapist && (
              <TherapistDetailsContent
                therapist={selectedTherapist}
                onClose={handleDialogClose}
              />
            )}
          </Dialog>
        </PageLayout>
      </DashboardContainer>
    </GlobalStyles>
  );
};

export default TherapistRecommendations;
