// src/pages/Landing.jsx

import React, { useContext } from 'react';
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
import { motion } from 'framer-motion';
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
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { AuthContext } from '../contexts/AuthContext';
import PageLayout from '../components/PageLayout'; // Import PageLayout

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

const Landing = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark'; // <-- Handy shortcut
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated } = useContext(AuthContext);

  const features = [
    {
      icon: <EmojiEmotionsIcon fontSize="large" color="inherit" />,
      title: 'Mood Tracker',
      description:
        'Monitor and log your daily moods to gain insights into your emotional patterns. Understand triggers and trends in your emotional well-being over time.',
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
      icon: <InsertChartOutlinedIcon fontSize="large" color="inherit" />,
      title: 'Progress Reports',
      description:
        'Visualize your emotional journey with detailed progress reports and charts. See your improvements and stay motivated on your wellness path.',
      action: () => navigate('/progress-reports'),
      imageUrl: 'images/rt.jpg',
      alt: 'Graph showing progress over time',
    },
  ];

  const whyChooseUsPoints = [
    {
      icon: <VerifiedUserIcon color="primary" fontSize="large" />,
      title: 'Personalized Experience',
      description:
        'Tailored tools and insights to meet your unique mental wellness needs.',
      imageUrl: 'images/fe.jpg',
      alt: 'Personalized experience illustration',
    },
    {
      icon: <SecurityIcon color="primary" fontSize="large" />,
      title: 'Privacy and Security',
      description:
        'Your data is encrypted and kept confidential, ensuring your peace of mind.',
      imageUrl: 'images/tt.jpg',
      alt: 'Secure data encryption illustration',
    },
    {
      icon: <SupportAgentIcon color="primary" fontSize="large" />,
      title: '24/7 Support',
      description:
        'Access our resources and AI support anytime, anywhere you need assistance.',
      imageUrl: 'images/tf.jpg',
      alt: 'Support agent providing assistance',
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
  ];

  const developers = [
    {
      name: 'Muhammed Nayif',
      role: 'Lead Developer & Project Head',
      avatarSrc: '/images/developers/nayif.jpeg', // Path to Nayif's avatar
    },
    {
      name: 'Neeraj Venu',
      role: ' UI/UX Expert',
      avatarSrc:'images/developers/neeraj.jpg', // Path to Neeraj's avatar
    },
    {
      name: 'Alan Dibu',
      role: 'Backend Architect & Data Scientist',
      avatarSrc:'images/developers/alan.jpg', // Path to Alan's avatar in public/images/developers
    },
    {
      name: 'Gautham Suresh',
      role: 'Frontend Developer & Accessibility Specialist',
      avatarSrc: '/images/developers/gautham.jpg', // Path to Gautham's avatar
    },
    
  ];

  const heroImageUrl = 'images/ab.jpg';

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          // Removed paddingTop and paddingBottom as PageLayout handles it
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
            spacing={isMobile ? 4 : 6}
            alignItems="center"
            justifyContent="center"
            style={{ minHeight: '70vh' }}
          >
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
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
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
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
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
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
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
              {/* Decorative Image with Faded Style */}
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
                  {/* Background Image with Faded Overlay */}
                  <img
                    src={heroImageUrl}
                    alt="Mental Wellness Illustration"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      // Make hero image brighter in dark mode
                      filter: isDarkMode ? 'none' : 'brightness(100%)',
                      transition: 'filter 0.3s ease',
                    }}
                    loading="lazy"
                  />
                  {/* Optional Overlay for Additional Faded Effect */}
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
          </Grid>
        </motion.section>

        {/* Features Section */}
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
                        background: theme.palette.background.paper,
                        backdropFilter: 'blur(8px)',
                        borderRadius: '28px',
                        boxShadow: theme.shadows[3],
                        overflow: 'hidden',
                        transition:
                          'transform 0.3s ease, boxShadow 0.3s ease, backdropFilter 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: theme.spacing(3),
                        border: `1px solid ${theme.palette.divider}`,
                        '&:hover': {
                          transform: 'translateY(-7px)',
                          boxShadow: theme.shadows[7],
                          backdropFilter: 'none',
                          border: `1px solid ${theme.palette.primary.light}`,
                        },
                        minHeight: 450,
                      }}
                    >
                      <Box
                        sx={{ textAlign: 'center', paddingTop: theme.spacing(3) }}
                      >
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
                      <CardActions
                        sx={{
                          justifyContent: 'center',
                          padding: theme.spacing(3),
                        }}
                      >
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
                      {/* Feature Image with Faded Style */}
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
                            // Brighter in dark mode, dimmer in light
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

        {/* Why Choose Us Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.1, staggerChildren: 0.2 }}
        >
          <Box mt={14} mb={isMobile ? 8 : 10}>
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
              Why Choose MindEase?
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
              We are committed to providing a secure, personalized, and
              supportive environment for your mental wellness journey. Discover
              the MindEase difference.
            </Typography>
            <Grid container spacing={isMobile ? 4 : 6} mt={5} justifyContent="center">
              {whyChooseUsPoints.map((point, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.2 }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <Card
                      sx={{
                        background: theme.palette.background.paper,
                        borderRadius: '24px',
                        boxShadow: theme.shadows[2],
                        padding: theme.spacing(4),
                        textAlign: 'center',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: `1px solid transparent`,
                        transition:
                          'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease',
                        '&:hover': {
                          boxShadow: theme.shadows[5],
                          border: `1px solid ${theme.palette.primary.main}`,
                          transform: 'translateY(-5px)',
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          m: 2,
                          bgcolor: theme.palette.secondary.main,
                          width: 60,
                          height: 60,
                        }}
                      >
                        {point.icon}
                      </Avatar>
                      <CardContent sx={{ padding: 0 }}>
                        <Typography
                          variant="h6"
                          component="div"
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.text.primary,
                            mb: 2,
                          }}
                        >
                          {point.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontSize: '1rem', lineHeight: 1.6 }}
                        >
                          {point.description}
                        </Typography>
                      </CardContent>
                      {/* Why Choose Us Image with Faded Style */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: '100px',
                          mt: 3,
                          borderRadius: '20px',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={point.imageUrl}
                          alt={point.alt}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            // Make it brighter in dark mode
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
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.section>

        {/* Testimonials Section */}
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
            {/* Background Image with Faded Style */}
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
                opacity: isDarkMode ? 0.15 : 0.1, // slightly higher in dark mode
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
              Real stories from real users who have found peace and growth with
              MindEase.
            </Typography>
            <Grid container spacing={isMobile ? 4 : 6} mt={6} justifyContent="center">
              {testimonials.map((testimonial, index) => (
                <Grid item xs={12} md={4} lg={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.4 + index * 0.25,
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      sx={{
                        background: theme.palette.background.paper,
                        borderRadius: '28px',
                        boxShadow: theme.shadows[3],
                        padding: theme.spacing(4),
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition:
                          'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease',
                        '&:hover': {
                          boxShadow: theme.shadows[5],
                          transform: 'scale(1.03)',
                        },
                        position: 'relative',
                        zIndex: 2,
                      }}
                    >
                      {/* Testimonial Background Image with Faded Style */}
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
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
        </motion.section>

        {/* Developers Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, delay: 0.1, staggerChildren: 0.3 }}
        >
          <Box mt={14} mb={isMobile ? 10 : 14}>
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
              MEET OUR DEVELOPERS
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
              THE TEAM BEHIND MINDEASE, PASSIONATE ABOUT MENTAL WELLNESS AND
              TECHNOLOGY.
            </Typography>
            <Grid container spacing={isMobile ? 4 : 6} mt={6} justifyContent="center">
              {developers.map((developer, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.4 + index * 0.25,
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      sx={{
                        background: theme.palette.background.paper,
                        borderRadius: '28px',
                        boxShadow: theme.shadows[3],
                        padding: theme.spacing(4),
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition:
                          'box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease',
                        '&:hover': {
                          boxShadow: theme.shadows[5],
                          transform: 'scale(1.03)',
                        },
                        position: 'relative',
                        zIndex: 2,
                      }}
                    >
                      {/* Developer Avatar  */}
                      <Avatar
                        alt={developer.name}
                        src={developer.avatarSrc} // Use src prop and avatarSrc from developer object
                        sx={{
                          width: 100,
                          height: 100,
                          mb: 2,
                          boxShadow: theme.shadows[2],
                        }}
                        loading="lazy"
                      />
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="h6"
                          component="div"
                          sx={{
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                            mb: 1,
                          }}
                        >
                          {developer.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{ fontSize: '0.9rem' }}
                        >
                          {developer.role}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>
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
              background: theme.palette.background.gradient,
              boxShadow: 'none',
              borderRadius: '25px',
              border: `1px solid ${theme.palette.grey[400]}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background Image with Faded Style */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: isDarkMode ? 0.1 : 0.05,
                filter: 'blur(8px)',
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

export default React.memo(Landing);