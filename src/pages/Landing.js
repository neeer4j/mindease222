// src/pages/Landing.jsx

import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  Typography,
  Button,
  Grid,
  Box,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Tooltip,
} from '@mui/material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  EmojiEmotions as EmojiEmotionsIcon,
  Chat as ChatIcon,
  Assignment as AssignmentIcon,
  SelfImprovement as SelfImprovementIcon,
  SettingsBrightness as SettingsBrightnessIcon,
  InsertChartOutlined as InsertChartOutlinedIcon,
  VerifiedUser as VerifiedUserIcon,
  Security as SecurityIcon,
  SupportAgent as SupportAgentIcon,
  ArrowBackIos,
  ArrowForwardIos,
  Insights as InsightsIcon,
  OndemandVideo as OndemandVideoIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import PageLayout from '../components/PageLayout';
import VideoPopup from '../components/VideoPopup';
import { useInView } from 'react-intersection-observer';

// Styled Gradient Button using MUI's styled API
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: '12px',
  padding: '10px 22px',
  boxShadow: theme.shadows[4],
  transition: 'background 0.5s, box-shadow 0.3s, transform 0.3s',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
    boxShadow: theme.shadows[6],
    transform: 'scale(1.03)',
  },
}));

const MobileFeatureCarousel = styled(Box)(({ theme }) => ({
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(4)
}));

const Landing = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useContext(AuthContext);

  const features = [
    {
      icon: <EmojiEmotionsIcon fontSize="large" color="inherit" />,
      title: 'Mood Tracker',
      description:
        'Track and analyze your daily moods to uncover patterns and triggers in your emotional well-being.',
      action: () => navigate('/mood-tracker'),
      imageUrl: 'images/bc.jpg',
    },
    {
      icon: <ChatIcon fontSize="large" color="inherit" />,
      title: 'AI Chat',
      description:
        'Engage with our AI therapist for supportive conversations and guidance. Get personalized advice and support anytime you need it.',
      action: () => navigate('/chat'),
      imageUrl: 'images/cd.jpg',
      alt: 'Person chatting with AI on laptop',
    },
    {
      icon: <AssignmentIcon fontSize="large" color="inherit" />,
      title: 'Activity Logging',
      description:
        'Keep track of your activities and reflect on your personal growth. Discover how your daily routines impact your mood and overall wellness.',
      action: () => navigate('/activity-logging'),
      imageUrl: 'images/ActivityLog.png',
      alt: 'Person logging activities on tablet',
    },
    {
      icon: <SelfImprovementIcon fontSize="large" color="inherit" />,
      title: 'Guided Meditations',
      description:
        'Access a library of guided meditations to help reduce stress and improve focus. Perfect for beginners and experienced meditators alike.',
      action: () => navigate('/meditations'),
      imageUrl: 'images/df.jpg',
      alt: 'Person meditating in serene environment',
    },
    {
      icon: <SettingsBrightnessIcon fontSize="large" color="inherit" />,
      title: 'Sleep Quality Monitor',
      description:
        'Track your sleep patterns and understand factors affecting your sleep quality. Improve your rest and wake up feeling refreshed.',
      action: () => navigate('/sleep-tracker'),
      imageUrl: 'images/hi.jpg',
      alt: 'Person sleeping peacefully',
    },
    {
      icon: <InsightsIcon fontSize="large" color="inherit" />,
      title: 'Insights',
      description: 'Gain deeper understanding of your mood patterns with personalized insights.',
      action: () => navigate('/insights'),
      imageUrl: 'images/insights.jpg',
      alt: 'Visual representation of user insights',
    },
    {
      icon: <OndemandVideoIcon fontSize="large" color="inherit" />,
      title: 'Reels',
      description: 'Explore quick, engaging reels for mental wellness tips and guidance.',
      action: () => navigate('/reels'),
      imageUrl: 'images/reels.jpg',
      alt: 'Video reel widget',
    },
  ];

  const testimonials = [
    {
      quote:
        'MindEase has been a game changer for me. Tracking my mood has helped me identify patterns I never noticed before.',
      author: 'Jennifer C Fernandez',
      avatarUrl: 'images/pp.jpg',
      imageUrl: 'images/pp.jpg',
      alt: 'Happy person smiling',
    },
    {
      quote:
        "The AI chat feature is like having a supportive friend available 24/7. It's incredibly helpful in managing daily stress.",
      author: 'Vivek Vinod',
      avatarUrl: 'images/p2.jpg',
      imageUrl: 'images/p2.jpg',
      alt: 'Person using laptop in calm environment',
    },
    {
      quote:
        'I love how easy it is to log my activities and see how they impact my mood. It’s really helped me prioritize self-care.',
      author: 'Nandana N Kumar',
      avatarUrl: 'images/p3.jpg',
      imageUrl: 'images/p3.jpg',
      alt: 'Person journaling in a serene setting',
    },
    {
      quote:
        'Since I started using MindEase, I feel more in control of my emotions. The insights are eye-opening.',
      author: 'Arathi Das',
      avatarUrl: 'images/p4.jpg',
      imageUrl: 'images/p4.jpg',
      alt: 'Smiling person looking inspired',
    },
    {
      quote:
        'The guided meditations have truly transformed my approach to stress. I feel more relaxed every day.',
      author: 'Aliya Fathima',
      avatarUrl: 'images/p5.jpg',
      imageUrl: 'images/p5.jpg',
      alt: 'Person meditating peacefully',
    },
    {
      quote:
        'MindEase not only helps me track my mood but also gives actionable insights. Highly recommended!',
      author: 'B. Joniyal',
      avatarUrl: 'images/p6.jpg',
      imageUrl: 'images/p6.jpg',
      alt: 'Person with thoughtful expression',
    },
  ];

  const heroImageUrl = 'images/ab.jpg';

  // --- Testimonial Slider Logic ---
  const testimonialsPerSlide = isMobile ? 1 : 3;
  const slideCount = Math.ceil(testimonials.length / testimonialsPerSlide);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slide every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 10000);
    return () => clearInterval(timer);
  }, [slideCount]);

  // Manual control handlers
  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slideCount);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const startIndex = currentSlide * testimonialsPerSlide;
  const currentTestimonials = testimonials.slice(startIndex, startIndex + testimonialsPerSlide);

  // Modified slide variants with direction-based animations
  const slideVariants = {
    enterFromRight: {
      x: '100%',
      opacity: 0
    },
    enterFromLeft: {
      x: '-100%',
      opacity: 0
    },
    center: {
      x: 0,
      opacity: 1
    },
    exitToRight: {
      x: '100%',
      opacity: 0
    },
    exitToLeft: {
      x: '-100%',
      opacity: 0
    }
  };

  // Add new mobile-specific state and refs
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const testimonialRef = useRef(null);
  const featureRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState('right');

  // Simplified touch handling
  const touchRef = useRef({ x: 0, time: 0 });

  const handleTouchStart = (e) => {
    touchRef.current = {
      x: e.touches[0].clientX,
      time: Date.now()
    };
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => setTouchEnd(e.touches[0].clientX);

  // Modified touch handling logic with haptic feedback
  const handleTouchEnd = (section) => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const time = Date.now() - touchRef.current.time;
    const velocity = Math.abs(distance) / time;
    
    // Lower threshold if swipe is faster
    const threshold = velocity > 0.5 ? 30 : 40;
    
    if (Math.abs(distance) > threshold) {
      const isLeftSwipe = distance > 0;
      
      // Provide haptic feedback if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // Short vibration for feedback
      }
      
      if (section === 'features') {
        setCurrentFeatureIndex(prev => {
          if (isLeftSwipe) {
            // Always set direction based on the swipe direction
            setSwipeDirection('left');
            return prev === features.length - 1 ? 0 : prev + 1;
          } else {
            setSwipeDirection('right');
            return prev === 0 ? features.length - 1 : prev - 1;
          }
        });
      } else if (section === 'testimonials') {
        setCurrentSlide(prev => {
          if (isLeftSwipe) {
            setSwipeDirection('left');
            return prev === slideCount - 1 ? 0 : prev + 1;
          } else {
            setSwipeDirection('right');
            return prev === 0 ? slideCount - 1 : prev - 1;
          }
        });
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Add image loading optimization hooks
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  // Add lazy loading for feature images
  const optimizeImageLoading = (index) => ({
    loading: index === currentFeatureIndex ? 'eager' : 'lazy',
    fetchPriority: index === currentFeatureIndex ? 'high' : 'low'
  });

  // Optimize re-renders for mobile
  const debouncedHandleSwipe = React.useCallback(
    debounce((section) => handleTouchEnd(section), 100),
    [handleTouchEnd]
  );

  return (
    <PageLayout>
      <VideoPopup />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          background: theme.palette.background.gradient,
        }}
      >
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <Grid
            container
            spacing={isMobile ? 2 : 6}
            alignItems="center"
            justifyContent="center"
            style={{ 
              minHeight: isMobile ? '60vh' : '70vh',
              padding: isMobile ? theme.spacing(2) : theme.spacing(6)
            }}
          >
            {isMobile ? (
              // Mobile Hero Layout
              <>
                <Grid item xs={12}>
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                  >
                    <Box
                      ref={heroRef}
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '200px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        marginBottom: theme.spacing(3)
                      }}
                    >
                      <img
                        src={heroImageUrl}
                        alt="Mental Wellness Illustration"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: heroInView ? 1 : 0,
                          transition: 'opacity 0.3s ease-in'
                        }}
                        {...(isMobile ? {
                          loading: 'eager',
                          fetchPriority: 'high',
                          width: '100%',
                          height: 'auto',
                          srcSet: `${heroImageUrl} 1x, ${heroImageUrl} 2x`
                        } : {})}
                        loading="eager"
                      />
                    </Box>
                  </motion.div>
                </Grid>
                <Grid item xs={12}>
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                  >
                    <Typography
                      variant={isMobile ? 'h3' : 'h2'}
                      component="h1"
                      gutterBottom
                      sx={{
                        fontWeight: 900,
                        color: theme.palette.text.primary,
                        textShadow: `2px 2px 3px ${theme.palette.grey[300]}`,
                        textAlign: isMobile ? 'center' : 'left',
                        lineHeight: 1.2,
                      }}
                    >
                      Find Your Peace with MindEase
                    </Typography>
                    <Typography
                      variant="h6"
                      color="textSecondary"
                      paragraph
                      sx={{
                        maxWidth: 650,
                        margin: isMobile ? '0 auto' : '0',
                        textAlign: isMobile ? 'center' : 'left',
                        paddingX: isMobile ? theme.spacing(2) : 0,
                        fontSize: '1.1rem',
                        fontWeight: 400,
                      }}
                    >
                      Your personalized mental wellness companion. Track your mood,
                      chat with AI, and discover tools to cultivate a balanced and
                      joyful life. Start your journey to inner peace today.
                    </Typography>

                    <Box
                      mt={5}
                      display="flex"
                      gap={3}
                      flexDirection={isMobile ? 'column' : 'row'}
                      justifyContent={isMobile ? 'center' : 'flex-start'}
                    >
                      {isAuthenticated ? (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <GradientButton
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/dashboard')}
                            sx={{
                              paddingX: isMobile ? 3 : 4,
                              paddingY: isMobile ? 1.5 : 1.8,
                              borderRadius: '14px',
                              boxShadow: theme.shadows[5],
                              width: isMobile ? '100%' : 'auto',
                              fontSize: '1.1rem',
                            }}
                          >
                            Go to Dashboard
                          </GradientButton>
                        </motion.div>
                      ) : (
                        <>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <GradientButton
                              variant="contained"
                              size="large"
                              onClick={() => navigate('/signup')}
                              sx={{
                                paddingX: isMobile ? 3 : 4,
                                paddingY: isMobile ? 1.5 : 1.8,
                                borderRadius: '14px',
                                boxShadow: theme.shadows[5],
                                width: isMobile ? '100%' : 'auto',
                                fontSize: '1.1rem',
                              }}
                            >
                              Get Started
                            </GradientButton>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="large"
                              onClick={() => navigate('/login')}
                              sx={{
                                paddingX: isMobile ? 3 : 4,
                                paddingY: isMobile ? 1.5 : 1.8,
                                borderRadius: '14px',
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                width: isMobile ? '100%' : 'auto',
                                fontSize: '1.1rem',
                                transition:
                                  'transform 0.3s ease, background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
                                '&:hover': {
                                  backgroundColor: theme.palette.primary.main,
                                  color: theme.palette.primary.contrastText,
                                  borderColor: theme.palette.primary.dark,
                                },
                              }}
                            >
                              Login
                            </Button>
                          </motion.div>
                        </>
                      )}
                    </Box>
                  </motion.div>
                </Grid>
              </>
            ) : (
              // Keep existing desktop layout
              <>
                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                  >
                    <Typography
                      variant={isMobile ? 'h3' : 'h2'}
                      component="h1"
                      gutterBottom
                      sx={{
                        fontWeight: 900,
                        color: theme.palette.text.primary,
                        textShadow: `2px 2px 3px ${theme.palette.grey[300]}`,
                        textAlign: isMobile ? 'center' : 'left',
                        lineHeight: 1.2,
                      }}
                    >
                      Find Your Peace with MindEase
                    </Typography>
                    <Typography
                      variant="h6"
                      color="textSecondary"
                      paragraph
                      sx={{
                        maxWidth: 650,
                        margin: isMobile ? '0 auto' : '0',
                        textAlign: isMobile ? 'center' : 'left',
                        paddingX: isMobile ? theme.spacing(2) : 0,
                        fontSize: '1.1rem',
                        fontWeight: 400,
                      }}
                    >
                      Your personalized mental wellness companion. Track your mood,
                      chat with AI, and discover tools to cultivate a balanced and
                      joyful life. Start your journey to inner peace today.
                    </Typography>

                    <Box
                      mt={5}
                      display="flex"
                      gap={3}
                      flexDirection={isMobile ? 'column' : 'row'}
                      justifyContent={isMobile ? 'center' : 'flex-start'}
                    >
                      {isAuthenticated ? (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <GradientButton
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/dashboard')}
                            sx={{
                              paddingX: isMobile ? 3 : 4,
                              paddingY: isMobile ? 1.5 : 1.8,
                              borderRadius: '14px',
                              boxShadow: theme.shadows[5],
                              width: isMobile ? '100%' : 'auto',
                              fontSize: '1.1rem',
                            }}
                          >
                            Go to Dashboard
                          </GradientButton>
                        </motion.div>
                      ) : (
                        <>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <GradientButton
                              variant="contained"
                              size="large"
                              onClick={() => navigate('/signup')}
                              sx={{
                                paddingX: isMobile ? 3 : 4,
                                paddingY: isMobile ? 1.5 : 1.8,
                                borderRadius: '14px',
                                boxShadow: theme.shadows[5],
                                width: isMobile ? '100%' : 'auto',
                                fontSize: '1.1rem',
                              }}
                            >
                              Get Started
                            </GradientButton>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="large"
                              onClick={() => navigate('/login')}
                              sx={{
                                paddingX: isMobile ? 3 : 4,
                                paddingY: isMobile ? 1.5 : 1.8,
                                borderRadius: '14px',
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                width: isMobile ? '100%' : 'auto',
                                fontSize: '1.1rem',
                                transition:
                                  'transform 0.3s ease, background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
                                '&:hover': {
                                  backgroundColor: theme.palette.primary.main,
                                  color: theme.palette.primary.contrastText,
                                  borderColor: theme.palette.primary.dark,
                                },
                              }}
                            >
                              Login
                            </Button>
                          </motion.div>
                        </>
                      )}
                    </Box>
                  </motion.div>
                </Grid>
                <Grid item xs={12} md={6}>
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    style={{ textAlign: isMobile ? 'center' : 'right' }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: { xs: '100%', md: '90%' },
                        maxWidth: '500px',
                        height: { xs: '250px', md: '400px' },
                        borderRadius: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: theme.shadows[4],
                        overflow: 'hidden',
                        margin: '0 auto',
                      }}
                    >
                      <img
                        src={heroImageUrl}
                        alt="Mental Wellness Illustration"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: isDarkMode ? 'none' : 'brightness(100%)',
                          transition: 'filter 0.3s ease',
                        }}
                        loading="lazy"
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'rgba(0, 0, 0, 0.2)',
                        }}
                      ></Box>
                    </Box>
                  </motion.div>
                </Grid>
              </>
            )}
          </Grid>
        </motion.section>

        {/* Modified Features Section */}
        <motion.section>
          {isMobile ? (
            <MobileFeatureCarousel
              ref={featureRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd('features')}
            >
              <AnimatePresence initial={false} mode="wait" custom={swipeDirection}>
                <motion.div
                  key={currentFeatureIndex}
                  custom={swipeDirection}
                  variants={{
                    enterFromLeft: {
                      x: '-100%',
                      opacity: 0
                    },
                    enterFromRight: {
                      x: '100%',
                      opacity: 0
                    },
                    center: {
                      x: 0,
                      opacity: 1
                    },
                    exitToLeft: {
                      x: '-100%',
                      opacity: 0
                    },
                    exitToRight: {
                      x: '100%',
                      opacity: 0
                    }
                  }}
                  initial={swipeDirection === 'left' ? 'enterFromRight' : 'enterFromLeft'}
                  animate="center"
                  exit={swipeDirection === 'left' ? 'exitToLeft' : 'exitToRight'}
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                >
                  <Card
                    sx={{
                      margin: '0 auto',
                      maxWidth: '90%',
                      height: '450px',
                      borderRadius: '20px',
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(
                        theme.palette.background.paper,
                        0.9
                      )} 100%)`,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: theme.shadows[3],
                      overflow: 'hidden',
                      transition: 'all 0.3s ease-in-out',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: theme.spacing(3),
                      '&:hover': {
                        boxShadow: theme.shadows[8],
                        transform: 'translateY(-6px)',
                      },
                    }}
                  >
                    <Box sx={{ textAlign: 'center', paddingTop: theme.spacing(3) }}>
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.primary.light,
                          width: isMobile ? 70 : 90,
                          height: isMobile ? 70 : 90,
                          margin: '0 auto',
                          boxShadow: theme.shadows[3],
                        }}
                      >
                        {features[currentFeatureIndex].icon}
                      </Avatar>
                    </Box>
                    <CardContent sx={{ padding: theme.spacing(3) }}>
                      <Typography
                        variant={isMobile ? 'h6' : 'h5'}
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          textAlign: 'center',
                          marginTop: theme.spacing(3),
                          marginBottom: theme.spacing(2),
                          textShadow: `1px 1px 1px ${theme.palette.grey[200]}`,
                        }}
                        gutterBottom
                      >
                        {features[currentFeatureIndex].title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          textAlign: 'center',
                          fontSize: '1rem',
                          lineHeight: 1.6,
                        }}
                      >
                        {features[currentFeatureIndex].description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', padding: theme.spacing(3) }}>
                      <Tooltip title={`Learn more about ${features[currentFeatureIndex].title}`}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ width: '100%' }}
                        >
                          <GradientButton
                            onClick={features[currentFeatureIndex].action}
                            fullWidth
                            variant="contained"
                            sx={{
                              paddingY: isMobile ? 1.2 : 1.6,
                              fontSize: '1rem',
                              borderRadius: '14px',
                            }}
                          >
                            Learn More
                          </GradientButton>
                        </motion.div>
                      </Tooltip>
                    </CardActions>
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: '150px',
                        mt: 2,
                        borderRadius: '20px',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={features[currentFeatureIndex].imageUrl}
                        alt={features[currentFeatureIndex].alt}
                        {...optimizeImageLoading(currentFeatureIndex)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: isDarkMode ? 'none' : 'brightness(110%)',
                          transition: 'filter 0.3s ease',
                        }}
                        loading="lazy"
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'rgba(0, 0, 0, 0.3)',
                        }}
                      ></Box>
                    </Box>
                  </Card>
                </motion.div>
              </AnimatePresence>
              {/* Feature navigation dots */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 2,
                  gap: 1
                }}
              >
                {features.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: currentFeatureIndex === index
                        ? theme.palette.primary.main
                        : theme.palette.grey[400],
                      transition: 'background-color 0.3s'
                    }}
                    onClick={() => setCurrentFeatureIndex(index)}
                  />
                ))}
              </Box>
            </MobileFeatureCarousel>
          ) : (
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, delay: 0.1, staggerChildren: 0.2 }}
            >
              <Box mt={12} mb={isMobile ? 8 : 5}>
                <Typography
                  variant={isMobile ? 'h4' : 'h3'}
                  align="center"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    paddingX: isMobile ? theme.spacing(2) : 0,
                    textShadow: `1px 1px 1px ${theme.palette.grey[300]}`,
                    lineHeight: 1.3,
                  }}
                >
                  Explore Our Key Features
                </Typography>
                <Typography
                  variant="h6"
                  align="center"
                  color="textSecondary"
                  gutterBottom
                  sx={{
                    paddingX: isMobile ? theme.spacing(3) : 0,
                    maxWidth: 750,
                    margin: '0 auto',
                    fontSize: '1.05rem',
                    fontWeight: 400,
                  }}
                >
                  Empowering tools designed to support your mental well-being and
                  personal growth, seamlessly integrated for your daily life.
                </Typography>
                <Grid container spacing={isMobile ? 4 : 5} mt={5} justifyContent="center">
                  {features.map((feature, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 50 }}
                        whileInView={{ scale: 1, opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Card
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(
                              theme.palette.background.paper,
                              0.9
                            )} 100%)`,
                            // Removed heavy backdropFilter for performance
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            borderRadius: '24px',
                            boxShadow: theme.shadows[3],
                            overflow: 'hidden',
                            transition: 'all 0.3s ease-in-out',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: theme.spacing(3),
                            '&:hover': {
                              boxShadow: theme.shadows[8],
                              transform: 'translateY(-6px)',
                            },
                            minHeight: 450,
                          }}
                        >
                          <Box sx={{ textAlign: 'center', paddingTop: theme.spacing(3) }}>
                            <Avatar
                              sx={{
                                bgcolor: theme.palette.primary.light,
                                width: isMobile ? 70 : 90,
                                height: isMobile ? 70 : 90,
                                margin: '0 auto',
                                boxShadow: theme.shadows[3],
                              }}
                            >
                              {feature.icon}
                            </Avatar>
                          </Box>
                          <CardContent sx={{ padding: theme.spacing(3) }}>
                            <Typography
                              variant={isMobile ? 'h6' : 'h5'}
                              sx={{
                                fontWeight: 700,
                                color: theme.palette.text.primary,
                                textAlign: 'center',
                                marginTop: theme.spacing(3),
                                marginBottom: theme.spacing(2),
                                textShadow: `1px 1px 1px ${theme.palette.grey[200]}`,
                              }}
                              gutterBottom
                            >
                              {feature.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{
                                textAlign: 'center',
                                fontSize: '1rem',
                                lineHeight: 1.6,
                              }}
                            >
                              {feature.description}
                            </Typography>
                          </CardContent>
                          <CardActions sx={{ justifyContent: 'center', padding: theme.spacing(3) }}>
                            <Tooltip title={`Learn more about ${feature.title}`}>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{ width: '100%' }}
                              >
                                <GradientButton
                                  onClick={feature.action}
                                  fullWidth
                                  variant="contained"
                                  sx={{
                                    paddingY: isMobile ? 1.2 : 1.6,
                                    fontSize: '1rem',
                                    borderRadius: '14px',
                                  }}
                                >
                                  Learn More
                                </GradientButton>
                              </motion.div>
                            </Tooltip>
                          </CardActions>
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              height: '150px',
                              mt: 2,
                              borderRadius: '20px',
                              overflow: 'hidden',
                            }}
                          >
                            <img
                              src={feature.imageUrl}
                              alt={feature.alt}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                filter: isDarkMode ? 'none' : 'brightness(110%)',
                                transition: 'filter 0.3s ease',
                              }}
                              loading="lazy"
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0, 0, 0, 0.3)',
                              }}
                            ></Box>
                          </Box>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </motion.section>
          )}
        </motion.section>

        {/* Modified Testimonials Section */}
        <motion.section>
          {isMobile ? (
            <>
              <Box sx={{ 
                mt: 6, 
                mb: 4, 
                px: 2,
                position: 'relative',
                zIndex: 1
              }}>
                <Typography
                  variant="h4"
                  align="center"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    textShadow: `1px 1px 1px ${theme.palette.grey[300]}`,
                    lineHeight: 1.3,
                  }}
                >
                  What Our Users Say
                </Typography>
                <Typography
                  variant="body1"
                  align="center"
                  color="textSecondary"
                  sx={{
                    maxWidth: 600,
                    margin: '0 auto',
                    mb: 2
                  }}
                >
                  Real stories from people who found peace and growth with MindEase
                </Typography>
              </Box>
              <Box
                ref={testimonialRef}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: theme.spacing(2),
                  marginBottom: theme.spacing(8),
                  zIndex: 1,
                  '& .MuiCard-root': {
                    position: 'relative',
                    zIndex: 1
                  }
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => debouncedHandleSwipe('testimonials')}
              >
                <AnimatePresence initial={false} mode="wait" custom={swipeDirection}>
                  <motion.div
                    key={currentSlide}
                    custom={swipeDirection}
                    variants={{
                      enterFromLeft: {
                        x: '-100%',
                        opacity: 0
                      },
                      enterFromRight: {
                        x: '100%',
                        opacity: 0
                      },
                      center: {
                        x: 0,
                        opacity: 1
                      },
                      exitToLeft: {
                        x: '-100%',
                        opacity: 0
                      },
                      exitToRight: {
                        x: '100%',
                        opacity: 0
                      }
                    }}
                    initial={swipeDirection === 'left' ? 'enterFromRight' : 'enterFromLeft'}
                    animate="center"
                    exit={swipeDirection === 'left' ? 'exitToLeft' : 'exitToRight'}
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                  >
                    <Card
                      sx={{
                        margin: '0 auto',
                        maxWidth: '90%',
                        borderRadius: '20px',
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(
                          theme.palette.background.paper,
                          0.9
                        )} 100%)`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: theme.shadows[3],
                        padding: theme.spacing(4),
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-6px)',
                        },
                        position: 'relative',
                        zIndex: 2,
                      }}
                    >
                      {/* Single testimonial content */}
                      <CardContent>
                        <Typography
                          variant="body1"
                          fontStyle="italic"
                          align="center"
                          gutterBottom
                          sx={{
                            fontSize: '1.1rem',
                            lineHeight: 1.7,
                          }}
                        >
                          " {currentTestimonials[0].quote} "
                        </Typography>
                      </CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          flexDirection: 'column',
                          mb: 3,
                        }}
                      >
                        <Avatar
                          alt={currentTestimonials[0].author}
                          src={currentTestimonials[0].avatarUrl}
                          sx={{
                            width: 64,
                            height: 64,
                            mb: 2,
                            boxShadow: theme.shadows[2],
                          }}
                          loading="lazy"
                        />
                        <Typography
                          variant="subtitle1"
                          color="textPrimary"
                          sx={{ fontWeight: 600 }}
                        >
                          {currentTestimonials[0].author}
                        </Typography>
                      </Box>
                    </Card>
                  </motion.div>
                </AnimatePresence>
                {/* Testimonial navigation dots */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 2,
                    gap: 1
                  }}
                >
                  {[...Array(testimonials.length)].map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: currentSlide === index
                          ? theme.palette.primary.main
                          : theme.palette.grey[400],
                        transition: 'background-color 0.3s'
                      }}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </Box>
              </Box>
            </>
          ) : (
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, delay: 0.1, staggerChildren: 0.3 }}
            >
              <Box
                mt={14}
                mb={isMobile ? 10 : 14}
                sx={{
                  backgroundColor: theme.palette.background.default,
                  paddingY: 8,
                  borderRadius: '25px',
                  border: `1px solid ${theme.palette.grey[400]}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Faded Background Image */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: isDarkMode ? 0.15 : 0.1,
                    filter: 'blur(8px)',
                    zIndex: 1,
                  }}
                ></Box>
                <Typography
                  variant={isMobile ? 'h4' : 'h3'}
                  align="center"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    paddingX: isMobile ? theme.spacing(2) : 0,
                    textShadow: `1px 1px 1px ${theme.palette.grey[300]}`,
                    lineHeight: 1.3,
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  Hear From Our Community...
                </Typography>
                <Typography
                  variant="h6"
                  align="center"
                  color="textSecondary"
                  gutterBottom
                  sx={{
                    paddingX: isMobile ? theme.spacing(3) : 0,
                    maxWidth: 750,
                    margin: '0 auto',
                    fontSize: '1.05rem',
                    fontWeight: 400,
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  Real stories from real users who have found peace and growth with MindEase.
                </Typography>

                {/* Slider Container */}
                <Box
                  sx={{
                    position: 'relative',
                    height: isMobile ? 350 : 400,
                    mt: 6,
                    overflow: 'hidden',
                  }}
                >
                  <AnimatePresence exitBeforeEnter>
                    <motion.div
                      key={currentSlide}
                      custom={swipeDirection}
                      variants={{
                        enterFromLeft: {
                          x: '-100%',
                          opacity: 0
                        },
                        enterFromRight: {
                          x: '100%',
                          opacity: 0
                        },
                        center: {
                          x: 0,
                          opacity: 1
                        },
                        exitToLeft: {
                          x: '-100%',
                          opacity: 0
                        },
                        exitToRight: {
                          x: '100%',
                          opacity: 0
                        }
                      }}
                      initial={swipeDirection === 'left' ? 'enterFromRight' : 'enterFromLeft'}
                      animate="center"
                      exit={swipeDirection === 'left' ? 'exitToLeft' : 'exitToRight'}
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      style={{ position: 'absolute', width: '100%' }}
                    >
                      <Grid container spacing={isMobile ? 4 : 6} justifyContent="center">
                        {currentTestimonials.map((testimonial, index) => (
                          <Grid item xs={12} md={isMobile ? 12 : 4} key={index}>
                            <Card
                              sx={{
                                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(
                                  theme.palette.background.paper,
                                  0.9
                                )} 100%)`,
                                // Removed heavy backdropFilter for smoother performance
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                borderRadius: '24px',
                                boxShadow: theme.shadows[3],
                                padding: theme.spacing(4),
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  boxShadow: theme.shadows[8],
                                  transform: 'translateY(-6px)',
                                },
                                position: 'relative',
                                zIndex: 2,
                              }}
                            >
                              {/* Faded Testimonial Background Image */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  backgroundImage: `url(${testimonial.imageUrl})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  opacity: isDarkMode ? 0.1 : 0.05,
                                  filter: 'blur(4px)',
                                  borderRadius: '28px',
                                  zIndex: -1,
                                }}
                              ></Box>
                              <CardContent>
                                <Typography
                                  variant="body1"
                                  fontStyle="italic"
                                  align="center"
                                  gutterBottom
                                  sx={{
                                    fontSize: '1.1rem',
                                    lineHeight: 1.7,
                                  }}
                                >
                                  " {testimonial.quote} "
                                </Typography>
                              </CardContent>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexDirection: 'column',
                                  mb: 3,
                                }}
                              >
                                <Avatar
                                  alt={testimonial.author}
                                  src={testimonial.avatarUrl}
                                  sx={{
                                    width: 64,
                                    height: 64,
                                    mb: 2,
                                    boxShadow: theme.shadows[2],
                                  }}
                                  loading="lazy"
                                />
                                <Typography
                                  variant="subtitle1"
                                  color="textPrimary"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {testimonial.author}
                                </Typography>
                              </Box>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </motion.div>
                  </AnimatePresence>

                  {/* Manual Navigation Controls */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: 10,
                      transform: 'translateY(-50%)',
                      zIndex: 3,
                      cursor: 'pointer',
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: '50%',
                      p: 0.5,
                    }}
                    onClick={handlePrev}
                  >
                    <ArrowBackIos fontSize="small" />
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      right: 10,
                      transform: 'translateY(-50%)',
                      zIndex: 3,
                      cursor: 'pointer',
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: '50%',
                      p: 0.5,
                    }}
                    onClick={handleNext}
                  >
                    <ArrowForwardIos fontSize="small" />
                  </Box>
                </Box>
              </Box>
            </motion.section>
          )}
        </motion.section>

        {/* Call to Action Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Box
            mt={16}
            textAlign="center"
            paddingY={8}
            sx={{
              background: `url('/images/banner.png') no-repeat center center`,
              backgroundSize: 'cover',
              boxShadow: 'none',
              borderRadius: '25px',
              border: `1px solid ${theme.palette.grey[400]}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                zIndex: 1,
              }}
            ></Box>
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              sx={{
                fontWeight: 900,
                color: theme.palette.text.primary,
                mb: 4,
                textShadow: `2px 2px 3px ${theme.palette.grey[300]}`,
                position: 'relative',
                zIndex: 2,
              }}
            >
              Begin Your Journey to a Calmer Mind
            </Typography>
            <Typography
              variant="h6"
              color="textSecondary"
              sx={{
                maxWidth: 800,
                margin: '0 auto',
                mb: 5,
                fontSize: '1.1rem',
                position: 'relative',
                zIndex: 2,
              }}
            >
              Unlock the power of MindEase and transform your mental well-being
              today. Sign up for free and explore our comprehensive suite of
              features designed to guide you towards a happier, healthier you.
            </Typography>
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              style={{ position: 'relative', zIndex: 2 }}
            >
              <GradientButton
                variant="contained"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{
                  paddingX: 5,
                  paddingY: 2,
                  borderRadius: '16px',
                  fontSize: '1.2rem',
                  boxShadow: theme.shadows[6],
                }}
              >
                Start for Free - It's Quick & Easy!
              </GradientButton>
            </motion.div>
          </Box>
        </motion.section>
      </motion.div>
    </PageLayout>
  );
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default React.memo(Landing);
