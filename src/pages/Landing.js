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
  Fade,
  Container,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  EmojiEmotions as EmojiEmotionsIcon,
  Chat as ChatIcon,
  Assignment as AssignmentIcon,
  SelfImprovement as SelfImprovementIcon,
  SettingsBrightness as SettingsBrightnessIcon,
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

// Mobile Feature Carousel Container
const MobileFeatureCarousel = styled(Box)(({ theme }) => ({
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(1),
  marginBottom: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  '& .MuiCard-root': {
    width: '100%',
    maxWidth: '340px',
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '90%',
      margin: '0 auto',
    },
    [theme.breakpoints.down(360)]: {
      maxWidth: '95%',
      margin: '0 auto',
    },
  },
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
        "MindEase has been a game changer for me. Tracking my mood has helped me identify patterns I never noticed before.",
      author: "Jennifer C Fernandez",
      avatarUrl: "images/pp.jpg",
      imageUrl: "images/pp.jpg",
      alt: "Happy person smiling",
      rating: 4.8
    },
    {
      quote:
        "The AI chat feature is like having a supportive friend available 24/7. It's incredibly helpful in managing daily stress.",
      author: "Vivek Vinod",
      avatarUrl: "images/p2.jpg",
      imageUrl: "images/p2.jpg",
      alt: "Person using laptop in calm environment",
      rating: 4.5
    },
    {
      quote:
        "I love how easy it is to log my activities and see how they impact my mood. It's really helped me prioritize self-care.",
      author: "Nandana N Kumar",
      avatarUrl: "images/p3.jpg",
      imageUrl: "images/p3.jpg",
      alt: "Person journaling in a serene setting",
      rating: 5.0
    },
    {
      quote:
        "Since I started using MindEase, I feel more in control of my emotions. The insights are eye-opening.",
      author: "Arathi Das",
      avatarUrl: "images/p4.jpg",
      imageUrl: "images/p4.jpg",
      alt: "Smiling person looking inspired",
      rating: 4.7
    },
    {
      quote:
        "The guided meditations have truly transformed my approach to stress. I feel more relaxed every day.",
      author: "Aliya Fathima",
      avatarUrl: "images/p5.jpg",
      imageUrl: "images/p5.jpg",
      alt: "Person meditating peacefully",
      rating: 4.9
    },
    {
      quote:
        "MindEase not only helps me track my mood but also gives actionable insights. Highly recommended!",
      author: "B. Joniyal",
      avatarUrl: "images/p6.jpg",
      imageUrl: "images/p6.jpg",
      alt: "Person with thoughtful expression",
      rating: 4.6
    }
  ];

  const heroImageUrl = 'images/ab.jpg';

  // --- Testimonial Slider Logic ---
  const testimonialsPerSlide = isMobile ? 1 : 3;
  const slideCount = Math.ceil(testimonials.length / testimonialsPerSlide);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState('right');

  // Removed auto-scrolling timer

  // Touch handling logic for features
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [featureTouchStart, setFeatureTouchStart] = useState(0);
  const [featureTouchEnd, setFeatureTouchEnd] = useState(0);
  const [isFeatureDragging, setIsFeatureDragging] = useState(false);
  const [featureDragDistance, setFeatureDragDistance] = useState(0);

  const handleFeatureCardClick = (action) => {
    action();
  };

  const handleFeatureTouchStart = (e) => {
    setFeatureTouchStart(e.touches[0].clientX);
    setIsFeatureDragging(true);
    setFeatureDragDistance(0);
  };

  const handleFeatureTouchMove = (e) => {
    if (isFeatureDragging) {
      const currentTouch = e.touches[0].clientX;
      const distance = currentTouch - featureTouchStart;
      setFeatureDragDistance(distance);
      setFeatureTouchEnd(currentTouch);
    }
  };

  const handleFeatureTouchEnd = () => {
    setIsFeatureDragging(false);
    const minSwipeDistance = 50;
    
    if (Math.abs(featureTouchStart - featureTouchEnd) >= minSwipeDistance) {
      if (featureTouchStart - featureTouchEnd > 0) {
        // Swiped left
        setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
      } else {
        // Swiped right
        setCurrentFeatureIndex((prev) => (prev - 1 + features.length) % features.length);
      }
    }
    setFeatureDragDistance(0);
  };

  const handleDesktopFeatureClick = (action) => {
    action();
  };

  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  const optimizeImageLoading = (index) => ({
    loading: index === currentFeatureIndex ? 'eager' : 'lazy',
    fetchpriority: index === currentFeatureIndex ? 'high' : 'low',
  });

  // Testimonials components
  const TestimonialScroll = () => {
    const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials, ...testimonials, ...testimonials];
    const containerRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Removed continuous scroll animation

    return (
      <Box 
        sx={{ 
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100px',
            height: '100%',
            background: `linear-gradient(to right, ${theme.palette.background.default}, transparent)`,
            zIndex: 3
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: 0,
            width: '100px',
            height: '100%',
            background: `linear-gradient(to left, ${theme.palette.background.default}, transparent)`,
            zIndex: 3
          }
        }}
      >
        <motion.div
          ref={containerRef}
          style={{ 
            display: 'flex', 
            gap: '2rem', 
            padding: '2rem', 
            width: 'fit-content',
            willChange: 'transform',
            x: `${scrollPosition}%`,
            transform: 'translate3d(0,0,0)' // Force GPU acceleration
          }}
          onHoverStart={() => setIsPaused(true)}
          onHoverEnd={() => setIsPaused(false)}
          drag="x"
          dragConstraints={containerRef}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_, info) => {
            setIsDragging(false);
            // Adjust scroll position after drag to prevent jumping
            if (info.offset.x !== 0) {
              setScrollPosition(prev => prev + (info.offset.x / containerRef.current.offsetWidth) * 100);
            }
          }}
          dragElastic={0.2}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          transition={{
            type: 'tween',
            ease: 'linear',
            duration: 0.1
          }}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.author}-${index}`}
              style={{ flex: '0 0 auto' }}
              whileHover={{ scale: 1.02, y: -8, transition: { duration: 0.4, ease: "easeOut" } }}
            >
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '24px',
                  boxShadow: `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.2)}`,
                  padding: theme.spacing(3),
                  width: { xs: '280px', sm: '300px', md: '320px' },
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: `0 16px 40px -8px ${alpha(theme.palette.primary.main, 0.3)}`,
                    transform: 'translateY(-8px)',
                    '& .quote-bg': { opacity: 0.15 }
                  }
                }}
              >
                <Box
                  className="quote-bg"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url(${testimonial.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: isDarkMode ? 0.08 : 0.05,
                    filter: 'blur(8px)',
                    transition: 'opacity 0.3s ease'
                  }}
                />
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                  <Typography variant="h2" sx={{ fontSize: '4rem', color: theme.palette.primary.main, opacity: 0.3, mb: -6, ml: -2 }}>
                    "
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.7, fontStyle: 'italic', color: theme.palette.text.primary, mb: 4 }}>
                    {testimonial.quote}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 2 }}>
                  <Avatar
                    alt={testimonial.author}
                    src={testimonial.avatarUrl}
                    sx={{ width: 64, height: 64, border: `3px solid ${theme.palette.background.paper}`, boxShadow: theme.shadows[2] }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                      {testimonial.author}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                      MindEase User
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Box>
    );
  };

  const MobileTestimonialSection = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragDistance, setDragDistance] = useState(0);

    const handleTouchStart = (e) => {
      setTouchStart(e.touches[0].clientX);
      setIsDragging(true);
      setDragDistance(0);
    };

    const handleTouchMove = (e) => {
      if (isDragging) {
        const currentTouch = e.touches[0].clientX;
        const distance = currentTouch - touchStart;
        setDragDistance(distance);
        setTouchEnd(currentTouch);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      const minSwipeDistance = 50;
      
      if (Math.abs(touchStart - touchEnd) >= minSwipeDistance) {
        if (touchStart - touchEnd > 0) {
          // Swiped left
          setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        } else {
          // Swiped right
          setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
        }
      }
      setDragDistance(0);
    };

    return (
      <Box sx={{ position: 'relative', overflow: 'hidden', px: 2 }}>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: dragDistance }}
            animate={{ opacity: 1, x: dragDistance }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              width: '100%',
              touchAction: 'pan-y pinch-zoom',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Card
              sx={{
                background: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : '#fff',
                borderRadius: '24px',
                p: 4,
                boxShadow: `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.2)}`,
                transform: isDragging ? 'scale(0.98)' : 'scale(1)',
                transition: 'transform 0.3s ease',
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar
                    src={testimonials[currentIndex].avatarUrl}
                    alt={testimonials[currentIndex].author}
                    sx={{
                      width: 64,
                      height: 64,
                      border: `3px solid ${theme.palette.background.paper}`,
                      boxShadow: theme.shadows[2],
                    }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {testimonials[currentIndex].author}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                      }}
                    >
                      Verified User
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.1rem',
                    lineHeight: 1.7,
                    mb: 3,
                    color: alpha(theme.palette.text.primary, 0.87),
                    position: 'relative',
                    pl: 3,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      borderRadius: '4px',
                      background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.3)})`,
                    }
                  }}
                >
                  "{testimonials[currentIndex].quote}"
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.5, color: theme.palette.warning.main }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const rating = testimonials[currentIndex].rating;
                    const filled = star <= Math.floor(rating);
                    const partial = !filled && star === Math.ceil(rating);
                    const fillPercentage = partial ? ((rating % 1) * 100) : 0;
                    
                    return (
                      <Box 
                        key={star} 
                        sx={{ 
                          fontSize: '1.25rem',
                          position: 'relative',
                          display: 'inline-block'
                        }}
                      >
                        {partial ? (
                          <>
                            <Box component="span" sx={{ 
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: `${fillPercentage}%`,
                              overflow: 'hidden',
                              color: theme.palette.warning.main
                            }}>★</Box>
                            <Box component="span" sx={{ color: alpha(theme.palette.warning.main, 0.3) }}>★</Box>
                          </>
                        ) : (
                          <Box component="span" sx={{ 
                            color: filled ? theme.palette.warning.main : alpha(theme.palette.warning.main, 0.3)
                          }}>★</Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Card>
          </motion.div>
        </AnimatePresence>
        {/* Navigation Dots */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 3,
          }}
        >
          {testimonials.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: currentIndex === index 
                  ? theme.palette.primary.main 
                  : alpha(theme.palette.primary.main, 0.3),
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.2)',
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
          ))}
        </Box>

        {/* Swipe Hint */}
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 2,
            color: alpha(theme.palette.text.secondary, 0.7),
            fontSize: '0.875rem',
          }}
        >
          Swipe to see more testimonials
        </Typography>
      </Box>
    );
  };

  const ContinuousTestimonialsSection = () => (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 12 } }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              component="span"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.875rem',
                mb: 2,
                display: 'inline-block',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '6px 14px',
                borderRadius: '100px',
                background: alpha(theme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              }}
            >
              Testimonials
            </Typography>
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              sx={{
                fontWeight: 800,
                color: theme.palette.text.primary,
                mt: 2,
                mb: 3,
                fontSize: isMobile ? '2.5rem' : '3.5rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              What Our Users Say
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: alpha(theme.palette.text.secondary, 0.8),
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
                fontSize: '1.1rem'
              }}
            >
              Join thousands of users who have found peace and clarity with MindEase
            </Typography>
          </motion.div>
        </Box>

        {/* Testimonials Section - Conditional Rendering */}
        {isMobile ? (
          <MobileTestimonialSection />
        ) : (
          <Grid container spacing={3}>
            {testimonials.map((testimonial, index) => (
              <Grid 
                item 
                xs={12} 
                md={6} 
                lg={4} 
                key={index}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.2 }}
                >
                  <Box
                    sx={{
                      background: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.paper, 0.8)
                        : '#fff',
                      borderRadius: '24px',
                      p: { xs: 3.5, md: 4 },
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      boxShadow: theme.palette.mode === 'dark'
                        ? `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`
                        : '0 4px 20px rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? `0 20px 40px ${alpha(theme.palette.common.black, 0.2)}`
                          : '0 20px 40px rgba(0, 0, 0, 0.1)',
                        '& .quote-icon': {
                          transform: 'scale(1.1) rotate(-4deg)',
                          opacity: 0.15,
                        },
                        '& .avatar-wrapper': {
                          transform: 'scale(1.05)',
                          '& .avatar-glow': {
                            opacity: 0.5,
                          }
                        }
                      }
                    }}
                  >
                    {/* Quote Icon */}
                    <Box
                      className="quote-icon"
                      sx={{
                        position: 'absolute',
                        top: 28,
                        right: 28,
                        width: '32px',
                        height: '32px',
                        opacity: 0.1,
                        transition: 'all 0.3s ease',
                        color: theme.palette.primary.main
                      }}
                    >
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                        <path d="M9.583 17.321C8.553 16.227 8 15 8 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C18.553 16.227 18 15 18 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
                      </svg>
                    </Box>

                    {/* Author Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Box 
                        className="avatar-wrapper"
                        sx={{ 
                          position: 'relative',
                          transition: 'transform 0.3s ease'
                        }}
                      >
                        <Box
                          className="avatar-glow"
                          sx={{
                            position: 'absolute',
                            inset: -3,
                            borderRadius: '50%',
                            background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.2)}, transparent 70%)`,
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                          }}
                        />
                        <Avatar
                          alt={testimonial.author}
                          src={testimonial.avatarUrl}
                          sx={{
                            width: 56,
                            height: 56,
                            border: `3px solid ${theme.palette.background.paper}`,
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            fontSize: '1.1rem',
                            lineHeight: 1.3,
                            letterSpacing: '-0.01em'
                          }}
                        >
                          {testimonial.author}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.primary.main,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            mt: 0.5,
                            opacity: 0.85
                          }}
                        >
                          Verified User
                        </Typography>
                      </Box>
                    </Box>

                    {/* Quote Text */}
                    <Typography
                      variant="body1"
                      sx={{
                        fontSize: '1.125rem',
                        lineHeight: 1.7,
                        color: alpha(theme.palette.text.primary, 0.87),
                        mb: 3,
                        flex: 1,
                        fontWeight: 450,
                        letterSpacing: '-0.01em',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -16,
                          left: -20,
                          width: 3,
                          height: '90%',
                          background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.1)})`,
                          borderRadius: '4px'
                        }
                      }}
                    >
                      {testimonial.quote}
                    </Typography>

                    {/* Rating */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 0.5,
                        color: theme.palette.warning.main
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const rating = testimonial.rating;
                        const filled = star <= Math.floor(rating);
                        const partial = !filled && star === Math.ceil(rating);
                        const fillPercentage = partial ? ((rating % 1) * 100) : 0;
                        
                        return (
                          <Box 
                            key={star} 
                            sx={{ 
                              fontSize: '1.25rem',
                              position: 'relative',
                              display: 'inline-block'
                            }}
                          >
                            {partial ? (
                              <>
                                <Box component="span" sx={{ 
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  width: `${fillPercentage}%`,
                                  overflow: 'hidden',
                                  color: theme.palette.warning.main
                                }}>★</Box>
                                <Box component="span" sx={{ color: alpha(theme.palette.warning.main, 0.3) }}>★</Box>
                              </>
                            ) : (
                              <Box component="span" sx={{ 
                                color: filled ? theme.palette.warning.main : alpha(theme.palette.warning.main, 0.3)
                              }}>★</Box>
                            )}
                          </Box>
                        );
                      })}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          ml: 1,
                          color: theme.palette.text.secondary,
                          fontSize: '0.9rem',
                          fontWeight: 500
                        }}
                      >
                        {testimonial.rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </motion.section>
  );

  // Final Return with all sections
  return (
    <PageLayout>
      <VideoPopup />
      <motion.div>
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            <Grid
              container
              spacing={isMobile ? 2 : 6}
              alignItems="center"
              justifyContent="center"
              sx={{
                minHeight: isMobile ? '60vh' : '85vh',
                padding: isMobile ? theme.spacing(2) : theme.spacing(6),
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Animated background elements */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  overflow: 'hidden',
                  zIndex: 0,
                  opacity: 0.5,
                }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '5%',
                    width: '40%',
                    height: '40%',
                    borderRadius: '50%',
                    background: `radial-gradient(circle at center, ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}, transparent)`,
                  }}
                />
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '10%',
                    width: '35%',
                    height: '35%',
                    borderRadius: '50%',
                    background: `radial-gradient(circle at center, ${alpha(
                      theme.palette.secondary.main,
                      0.1
                    )}, transparent)`,
                  }}
                />
              </Box>

              {isMobile ? (
                <>
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20, duration: 0.7 }}
                    >
                      <Box
                        ref={heroRef}
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: '300px',
                          borderRadius: '32px',
                          overflow: 'hidden',
                          marginBottom: theme.spacing(4),
                          boxShadow: `0 20px 40px -20px ${alpha(theme.palette.primary.main, 0.3)}`,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(180deg, transparent 0%, ${alpha(
                              theme.palette.background.default,
                              0.3
                            )} 100%)`,
                            zIndex: 1,
                          },
                        }}
                      >
                        <motion.img
                          src={heroImageUrl}
                          alt="Mental Wellness Illustration"
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.7 }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: heroInView ? 1 : 0,
                            transition: 'all 0.5s ease-in-out',
                            filter: isDarkMode ? 'brightness(0.8)' : 'brightness(1.05)',
                          }}
                          loading="eager"
                        />
                      </Box>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sx={{ px: 3 }}>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }}>
                      <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                          fontWeight: 900,
                          color: theme.palette.text.primary,
                          textAlign: 'left',
                          lineHeight: 1.2,
                          mb: 3,
                          fontSize: '2.5rem',
                        }}
                      >
                        Find Your <span style={{ color: theme.palette.primary.main }}>Peace</span> with MindEase
                      </Typography>
                      <Typography
                        variant="h6"
                        color="textSecondary"
                        sx={{
                          fontSize: '1.1rem',
                          lineHeight: 1.6,
                          mb: 4,
                          textAlign: 'left',
                          position: 'relative',
                          pl: 3,
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '10%',
                            bottom: '10%',
                            width: 4,
                            borderRadius: '4px',
                            background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                          },
                        }}
                      >
                        Your personalized mental wellness companion. Track your mood, chat with AI, and discover tools to cultivate a balanced and joyful life.
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' }, 
                        gap: 2, 
                        mb: 4,
                        ml: { xs: 0, sm: '22px' },
                        justifyContent: 'flex-start',
                        alignItems: { xs: 'stretch', sm: 'flex-start' },
                        width: { xs: '100%', sm: 'auto' }
                      }}>
                        {isAuthenticated ? (
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <GradientButton 
                              variant="contained" 
                              onClick={() => navigate('/dashboard')} 
                              sx={{ 
                                py: 1.5,
                                px: 3,
                                minWidth: '160px',
                                borderRadius: '12px', 
                                fontSize: '1rem',
                                boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.3)}`,
                              }}
                            >
                              Go to Dashboard
                            </GradientButton>
                          </motion.div>
                        ) : (
                          <>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <GradientButton 
                                variant="contained" 
                                onClick={() => navigate('/signup')} 
                                sx={{ 
                                  py: 1.5,
                                  px: 3,
                                  minWidth: '160px',
                                  borderRadius: '12px', 
                                  fontSize: '1rem',
                                  boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.3)}`,
                                  width: { xs: '100%', sm: 'auto' }
                                }}
                              >
                                Get Started
                              </GradientButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => navigate('/login')}
                                sx={{
                                  py: 1.5,
                                  px: 3,
                                  minWidth: '160px',
                                  borderRadius: '12px',
                                  fontSize: '1rem',
                                  borderWidth: 2,
                                  borderColor: alpha(theme.palette.primary.main, 0.5),
                                  color: theme.palette.primary.main,
                                  width: { xs: '100%', sm: 'auto' },
                                  '&:hover': {
                                    borderWidth: 2,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
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
                <>
                  <Grid item xs={12} md={6}>
                    <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Typography
                          variant="h1"
                          component="h1"
                          sx={{
                            fontWeight: 900,
                            color: theme.palette.text.primary,
                            textAlign: 'left',
                            lineHeight: 1.1,
                            fontSize: { md: '3.5rem', lg: '4rem' },
                            mb: 3,
                            position: 'relative',
                          }}
                        >
                          Find Your <span style={{ color: theme.palette.primary.main }}>Peace</span> with MindEase
                        </Typography>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }}>
                          <Typography
                            variant="h5"
                            color="textSecondary"
                            paragraph
                            sx={{
                              lineHeight: 1.6,
                              mb: 4,
                              fontSize: '1.25rem',
                              position: 'relative',
                              marginLeft: '22px',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: -20,
                                top: 0,
                                bottom: 0,
                                width: 4,
                                borderRadius: '4px',
                                background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                              },
                            }}
                          >
                            Your personalized mental wellness companion. Track your mood, chat with AI, and discover tools to cultivate a balanced and joyful life.
                          </Typography>
                        </motion.div>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' }, 
                          gap: 2, 
                          mb: 4,
                          ml: { xs: 0, sm: '22px' },
                          justifyContent: 'flex-start',
                          alignItems: { xs: 'stretch', sm: 'flex-start' },
                          width: { xs: '100%', sm: 'auto' }
                        }}>
                          {isAuthenticated ? (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <GradientButton 
                                variant="contained" 
                                onClick={() => navigate('/dashboard')} 
                                sx={{ 
                                  py: 1.5,
                                  px: 3,
                                  minWidth: '160px',
                                  borderRadius: '12px', 
                                  fontSize: '1rem',
                                  boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.3)}`,
                                }}
                              >
                                Go to Dashboard
                              </GradientButton>
                            </motion.div>
                          ) : (
                            <>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <GradientButton 
                                  variant="contained" 
                                  onClick={() => navigate('/signup')} 
                                  sx={{ 
                                    py: 1.5,
                                    px: 3,
                                    minWidth: '160px',
                                    borderRadius: '12px', 
                                    fontSize: '1rem',
                                    boxShadow: `0 8px 16px -4px ${alpha(theme.palette.primary.main, 0.3)}`,
                                    width: { xs: '100%', sm: 'auto' }
                                  }}
                                >
                                  Get Started
                                </GradientButton>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => navigate('/login')}
                                  sx={{
                                    py: 1.5,
                                    px: 3,
                                    minWidth: '160px',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    borderWidth: 2,
                                    borderColor: alpha(theme.palette.primary.main, 0.5),
                                    color: theme.palette.primary.main,
                                    width: { xs: '100%', sm: 'auto' },
                                    '&:hover': {
                                      borderWidth: 2,
                                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    },
                                  }}
                                >
                                  Login
                                </Button>
                              </motion.div>
                            </>
                          )}
                        </Box>
                      </Box>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.4 }}>
                      <Box
                        sx={{
                          position: 'relative',
                          width: '80%',
                          height: '500px',
                          borderRadius: '32px',
                          overflow: 'hidden',
                          boxShadow: `0 24px 48px -12px ${alpha(theme.palette.primary.main, 0.25)}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
                          marginLeft: '8%',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(165deg, ${alpha(theme.palette.background.paper, 0)} 0%, ${alpha(theme.palette.background.paper, 0.2)} 100%)`,
                            zIndex: 2,
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                          },
                          '&:hover::before': {
                            opacity: 1,
                          },
                        }}
                      >
                        <motion.img
                          src={heroImageUrl}
                          alt="Mental Wellness Illustration"
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.7 }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: isDarkMode ? 'brightness(0.85)' : 'brightness(1.05)',
                            transition: 'all 0.5s ease-in-out',
                          }}
                          loading="eager"
                        />
                      </Box>
                    </motion.div>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </motion.section>

        {/* Modified Features Section */}
        <motion.section>
          {isMobile ? (
            <>
              <Box sx={{ textAlign: 'left', mb: 6, px: 3 }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800, 
                    color: theme.palette.text.primary, 
                    lineHeight: 1.3, 
                    mb: 2,
                    fontSize: '2rem',
                    position: 'relative',
                  }}
                >
                  Explore Our Key Features
                </Typography>
                <Typography 
                  variant="body1" 
                  color="textSecondary" 
                  sx={{ 
                    fontSize: '1.05rem', 
                    fontWeight: 400,
                    maxWidth: '90%',
                  }}
                >
                  Empowering tools designed to support your mental well-being and personal growth.
                </Typography>
              </Box>
              <MobileFeatureCarousel
                sx={{ 
                  px: 0, 
                  py: 1, 
                  mb: 4,
                  touchAction: 'pan-y pinch-zoom',
                  width: '100%',
                  '& .MuiCard-root': {
                    mx: 'auto',
                    borderRadius: '24px',
                    boxShadow: `0 20px 40px -20px ${alpha(theme.palette.primary.main, 0.25)}`,
                  }
                }}
              >
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={currentFeatureIndex}
                    initial={{ opacity: 0, x: featureTouchStart - featureTouchEnd > 0 ? 100 : -100 }}
                    animate={{ opacity: 1, x: featureDragDistance }}
                    exit={{ opacity: 0, x: featureTouchStart - featureTouchEnd > 0 ? -100 : 100 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                      width: '100%',
                      touchAction: 'pan-y pinch-zoom',
                    }}
                    onTouchStart={handleFeatureTouchStart}
                    onTouchMove={handleFeatureTouchMove}
                    onTouchEnd={handleFeatureTouchEnd}
                  >
                    <Card
                      sx={{
                        margin: '0 auto',
                        width: '100%',
                        maxWidth: '340px',
                        borderRadius: '20px',
                        background: theme.palette.mode === 'dark'
                          ? `linear-gradient(165deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`
                          : `linear-gradient(165deg, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#ffffff', 0.85)} 100%)`,
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                        boxShadow: `0 15px 30px -10px ${alpha(theme.palette.primary.main, 0.2)},
                                  0 0 0 1px ${alpha(theme.palette.primary.main, 0.05)}`,
                        overflow: 'visible',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        transform: isFeatureDragging ? 'scale(0.98)' : 'scale(1)',
                        px: { xs: 2, sm: 3 },
                        py: { xs: 3, sm: 4 },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `radial-gradient(circle at 50% 0%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
                          opacity: 0.5,
                          borderRadius: 'inherit',
                          zIndex: 0,
                        },
                      }}
                    >
                      {/* Card Content */}
                      <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: 'transparent',
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 20%, ${theme.palette.primary.light} 80%)`,
                              width: 70,
                              height: 70,
                              margin: '0 auto',
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              boxShadow: `0 12px 24px -8px ${alpha(theme.palette.primary.main, 0.4)}`,
                              border: `3px solid ${alpha(theme.palette.background.paper, 0.9)}`,
                              '& svg': {
                                fontSize: '2rem',
                                color: 'white',
                                transition: 'transform 0.3s ease',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                              },
                            }}
                          >
                            {features[currentFeatureIndex].icon}
                          </Avatar>
                        </motion.div>
                      </Box>

                      <CardContent sx={{ position: 'relative', zIndex: 2, p: 2, flex: 1 }}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            textAlign: 'center',
                            mt: 2,
                            mb: 2,
                            fontSize: '1.5rem',
                            letterSpacing: '-0.02em',
                            background: `linear-gradient(135deg, ${theme.palette.text.primary} 30%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {features[currentFeatureIndex].title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            textAlign: 'center',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            color: alpha(theme.palette.text.secondary, 0.9),
                            px: 1,
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              left: '50%',
                              top: -8,
                              width: 40,
                              height: 2,
                              borderRadius: '2px',
                              background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.3)}, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.3)})`,
                              transform: 'translateX(-50%)',
                            }
                          }}
                        >
                          {features[currentFeatureIndex].description}
                        </Typography>
                      </CardContent>

                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: '160px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          mb: 3,
                          mt: 2,
                          zIndex: 2,
                          boxShadow: `0 12px 24px -12px ${alpha(theme.palette.common.black, 0.3)}`,
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(180deg, transparent 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
                            opacity: 0.6,
                          },
                        }}
                      >
                        <motion.img
                          src={features[currentFeatureIndex].imageUrl}
                          alt={features[currentFeatureIndex].alt}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          {...optimizeImageLoading(currentFeatureIndex)}
                          animate={{ scale: isFeatureDragging ? 1.05 : 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      </Box>

                      <CardActions sx={{ justifyContent: 'center', position: 'relative', zIndex: 2, p: 2, pt: 0 }}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ width: '100%' }}>
                          <GradientButton
                            onClick={() => handleFeatureCardClick(features[currentFeatureIndex].action)}
                            fullWidth
                            variant="contained"
                            sx={{
                              py: 1.75,
                              fontSize: '1.1rem',
                              borderRadius: '14px',
                              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                              transition: 'all 0.3s ease',
                              boxShadow: `0 10px 20px -8px ${alpha(theme.palette.primary.main, 0.5)}`,
                              fontWeight: 600,
                              letterSpacing: '0.5px',
                              '&:hover': {
                                boxShadow: `0 12px 24px -10px ${alpha(theme.palette.primary.main, 0.6)}`,
                              }
                            }}
                          >
                            Learn More
                          </GradientButton>
                        </motion.div>
                      </CardActions>
                    </Card>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Dots */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1,
                    mt: 3,
                  }}
                >
                  {features.map((_, index) => (
                    <Box
                      key={index}
                      onClick={() => setCurrentFeatureIndex(index)}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: currentFeatureIndex === index 
                          ? theme.palette.primary.main 
                          : alpha(theme.palette.primary.main, 0.3),
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.2)',
                          backgroundColor: theme.palette.primary.main,
                        },
                      }}
                    />
                  ))}
                </Box>

                {/* Swipe Hint */}
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'center',
                    mt: 2,
                    color: alpha(theme.palette.text.secondary, 0.7),
                    fontSize: '0.875rem',
                  }}
                >
                  Swipe to explore more features
                </Typography>
              </MobileFeatureCarousel>
            </>
          ) : (
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, delay: 0.1, staggerChildren: 0.2 }}
            >
              <Box mt={12} mb={isMobile ? 8 : 5}>
                <Typography variant={isMobile ? 'h4' : 'h3'} align="center" gutterBottom sx={{ fontWeight: 800, color: theme.palette.text.primary, paddingX: isMobile ? theme.spacing(2) : 0, textShadow: `1px 1px 1px ${theme.palette.grey[300]}`, lineHeight: 1.3 }}>
                  Explore Our Key Features
                </Typography>
                <Typography variant="h6" align="center" color="textSecondary" gutterBottom sx={{ paddingX: isMobile ? theme.spacing(3) : 0, maxWidth: 750, margin: '0 auto', fontSize: '1.05rem', fontWeight: 400 }}>
                  Empowering tools designed to support your mental well-being and personal growth, seamlessly integrated for your daily life.
                </Typography>
                <Grid container spacing={isMobile ? 4 : 5} mt={5} justifyContent="center">
                  {features.map((feature, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 50 }}
                        whileInView={{ scale: 1, opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                        whileHover={{ scale: 1.03, rotateY: 5, translateY: -10, transition: { duration: 0.4, ease: 'easeOut' } }}
                      >
                        <Card
                          sx={{
                            background: `linear-gradient(165deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 50%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            borderRadius: '32px',
                            boxShadow: `0 10px 30px -10px ${alpha(theme.palette.primary.main, 0.2)}, inset 0 0 0 1px ${alpha(theme.palette.primary.light, 0.1)}`,
                            overflow: 'visible',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: theme.spacing(3),
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 60%)`,
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              borderRadius: 'inherit',
                              zIndex: 0,
                            },
                            '&:hover': {
                              boxShadow: `0 20px 40px -20px ${alpha(theme.palette.common.black, 0.12)},
                              0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`,
                              '&::before': { opacity: 1 },
                              '& .floating-shapes': { transform: 'translateY(-10px) rotate(10deg)' },
                              '& .floating-shapes-2': { transform: 'translateY(10px) rotate(-5deg)' },
                              '& .feature-icon': { transform: 'translateY(-12px) scale(1.1)', boxShadow: `0 20px 40px -15px ${alpha(theme.palette.primary.main, 0.5)}, 0 0 20px ${alpha(theme.palette.primary.light, 0.3)}` },
                              '& .feature-image': { transform: 'scale(1.1)', filter: 'brightness(110%)' },
                              '& .card-content': { transform: 'translateY(-5px)' },
                            },
                            minHeight: 500,
                          }}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                            e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
                            e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
                          }}
                        >
                          <Box
                            className="floating-shapes"
                            sx={{
                              position: 'absolute',
                              top: -15,
                              right: -15,
                              width: 80,
                              height: 80,
                              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                              borderRadius: '24px',
                              transform: 'rotate(15deg)',
                              transition: 'transform 0.5s ease',
                              zIndex: 0,
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 'inherit',
                                background: 'radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.2) 100%)',
                                opacity: 0.5,
                              },
                            }}
                          />
                          <Box
                            className="floating-shapes-2"
                            sx={{
                              position: 'absolute',
                              bottom: -10,
                              left: -10,
                              width: 60,
                              height: 60,
                              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                              borderRadius: '18px',
                              transform: 'rotate(-10deg)',
                              transition: 'transform 0.5s ease',
                              zIndex: 0,
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 'inherit',
                                background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 70%)',
                                opacity: 0.5,
                              },
                            }}
                          />
                          <motion.div className="card-content-wrapper" initial={false} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 2, mb: 3 }}>
                              <motion.div whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }} transition={{ duration: 0.6 }}>
                                <Avatar
                                  className="feature-icon"
                                  sx={{
                                    bgcolor: 'transparent',
                                    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                                    width: 90,
                                    height: 90,
                                    margin: '0 auto',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: `0 12px 25px -8px ${alpha(theme.palette.primary.main, 0.5)}, inset 0 0 0 1px ${alpha(theme.palette.primary.light, 0.2)}`,
                                    border: `4px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                                    '& svg': {
                                      fontSize: '2.5rem',
                                      color: 'white',
                                      transition: 'transform 0.3s ease',
                                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                                    },
                                    '&:hover svg': {
                                      transform: 'scale(1.2) rotate(5deg)',
                                    },
                                  }}
                                >
                                  {feature.icon}
                                </Avatar>
                              </motion.div>
                            </Box>
                            <CardContent className="card-content" sx={{ position: 'relative', zIndex: 2, padding: theme.spacing(2), flex: 1, transition: 'transform 0.4s ease' }}>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 700,
                                  color: theme.palette.text.primary,
                                  textAlign: 'center',
                                  marginBottom: theme.spacing(2),
                                  position: 'relative',
                                }}
                              >
                                {feature.title}
                              </Typography>
                              <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', fontSize: '1rem', lineHeight: 1.6, mt: 2 }}>
                                {feature.description}
                              </Typography>
                            </CardContent>
                          </motion.div>
                          <Box
                            sx={{
                              position: 'relative',
                              width: '100%',
                              height: '180px',
                              borderRadius: '20px',
                              overflow: 'hidden',
                              mb: 3,
                              zIndex: 2,
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0)} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
                                opacity: 0,
                                transition: 'opacity 0.3s ease',
                              },
                            }}
                          >
                            <motion.img
                              className="feature-image"
                              src={feature.imageUrl}
                              alt={feature.alt}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                              {...optimizeImageLoading(index)}
                              animate={{ scale: isFeatureDragging ? 1.05 : 1 }}
                              transition={{ duration: 0.3 }}
                            />
                          </Box>
                          <CardActions sx={{ justifyContent: 'center', position: 'relative', zIndex: 2, p: 2 }}>
                            <Tooltip title={`Learn more about ${feature.title}`} arrow placement="top" TransitionComponent={Fade} TransitionProps={{ timeout: 600 }}>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ width: '100%' }}>
                                <GradientButton
                                  onClick={() => handleDesktopFeatureClick(feature.action)}
                                  fullWidth
                                  variant="contained"
                                  sx={{
                                    py: 2,
                                    fontSize: '1.1rem',
                                    borderRadius: '16px',
                                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                    transition: 'all 0.3s ease',
                                    boxShadow: `0 8px 20px -8px ${alpha(theme.palette.primary.main, 0.5)}`,
                                  }}
                                >
                                  Learn More
                                </GradientButton>
                              </motion.div>
                            </Tooltip>
                          </CardActions>
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
        {ContinuousTestimonialsSection()}

        {/* Call to Action Section */}
        <Box
          mt={8}
          sx={{
            position: 'relative',
            borderRadius: '32px',
            overflow: 'hidden',
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          {/* Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.4,
              background: `radial-gradient(circle at 20% 150%, ${alpha(theme.palette.primary.main, 0.4)} 0%, transparent 50%),
                          radial-gradient(circle at 80% -50%, ${alpha(theme.palette.secondary.main, 0.3)} 0%, transparent 50%)`,
              zIndex: 0,
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid 
              container 
              spacing={4} 
              alignItems="center" 
              justifyContent="center"
              sx={{ py: { xs: 6, md: 8 }, px: { xs: 2, md: 4 } }}
            >
              <Grid item xs={12}>
                <Box>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        mb: 2,
                        display: 'inline-block',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        padding: '6px 14px',
                        borderRadius: '100px',
                        background: alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                      }}
                    >
                      Start Today
                    </Typography>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Typography
                      variant={isMobile ? 'h3' : 'h2'}
                      sx={{
                        fontWeight: 800,
                        color: theme.palette.text.primary,
                        mt: 2,
                        mb: 3,
                        fontSize: { xs: '2rem', md: '3rem' },
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                      }}
                    >
                      Begin Your Journey to a{' '}
                      <Box
                        component="span"
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          display: 'inline-block',
                        }}
                      >
                        Calmer Mind
                      </Box>
                    </Typography>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        color: alpha(theme.palette.text.secondary, 0.8),
                        maxWidth: '600px',
                        lineHeight: 1.6,
                        fontWeight: 400,
                        fontSize: '1.1rem',
                        mb: 4,
                      }}
                    >
                      Transform your mental well-being with MindEase. Join thousands of users who have discovered their path to inner peace and emotional balance.
                    </Typography>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <GradientButton
                          variant="contained"
                          size="large"
                          onClick={() => navigate('/signup')}
                          sx={{
                            py: 2,
                            px: 4,
                            borderRadius: '16px',
                            fontSize: '1.1rem',
                            boxShadow: `0 8px 20px -6px ${alpha(theme.palette.primary.main, 0.4)}`,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          }}
                        >
                          Get Started Free
                        </GradientButton>
                      </motion.div>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { xs: 0, sm: 2 } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            position: 'relative',
                          }}
                        >
                          {[1, 2, 3].map((i) => (
                            <Avatar
                              key={i}
                              src={`images/p${i}.jpg`}
                              alt={`User ${i}`}
                              sx={{
                                width: 32,
                                height: 32,
                                border: `2px solid ${theme.palette.background.paper}`,
                                marginLeft: i === 1 ? 0 : -1.5,
                                transition: 'transform 0.2s ease',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  zIndex: 2,
                                },
                              }}
                            />
                          ))}
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                          }}
                        >
                          Joined by 10K+ users
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
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

