import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  useTheme,
  Grid,
  Avatar,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';

const AboutUs = () => {
  const theme = useTheme();

  const teamMembers = [
    {
      name: 'Muhammed Nayif',
      role: 'Lead Developer & Project Head',
      description: 'Leading the development and architecture of MindEase, ensuring the platform delivers innovative mental health solutions.',
      avatarSrc: '/images/developers/nayif.jpeg',
    },
    {
      name: 'Neeraj Venu',
      role: 'UI/UX Designer',
      description: 'Creating intuitive and accessible user experiences that make mental health support more approachable.',
      avatarSrc: 'images/developers/neeraj.jpg',
    },
    {
      name: 'Alan Dibu',
      role: 'Backend Architect & Data Scientist',
      description: 'Developing robust backend systems and implementing data-driven solutions for personalized mental health support.',
      avatarSrc: 'images/developers/alan.jpeg',
    },
    {
      name: 'Gautham Suresh',
      role: 'Frontend Developer & Accessibility Specialist',
      description: 'Ensuring MindEase is accessible to all users while implementing responsive and engaging frontend features.',
      avatarSrc: '/images/developers/gautham.jpg',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        background: theme.palette.background.gradient,
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6, mt: { xs: 8, sm: 9 } }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              mb: 4,
              fontWeight: 800,
              color: theme.palette.text.primary,
              fontSize: 'clamp(2rem, 5vw, 2.5rem)',
              lineHeight: 1.2,
            }}
          >
            About MindEase
          </Typography>

          <Box sx={{ mb: 6 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              Our Mission
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              At MindEase, we're committed to making mental health support accessible, 
              personalized, and effective for everyone. Through innovative technology 
              and evidence-based practices, we're transforming the way people approach 
              their mental well-being.
            </Typography>
          </Box>

          <Box sx={{ mb: 6 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              Our Vision
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              We envision a world where mental health support is readily available, 
              stigma-free, and tailored to each individual's unique needs. By combining 
              artificial intelligence with human expertise, we're building a future where 
              everyone has the tools they need to thrive mentally and emotionally.
            </Typography>
          </Box>

          <Box sx={{ mb: 6 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 3,
              }}
            >
              Our Team
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
              {teamMembers.map((member, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper
                    elevation={4}
                    sx={{
                      p: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                      borderRadius: '24px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: theme.shadows[8],
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                      },
                      '& > *': {
                        position: 'relative',
                        zIndex: 1
                      }
                    }}
                  >
                    <Avatar
                      src={member.avatarSrc}
                      alt={member.name}
                      sx={{
                        width: 120,
                        height: 120,
                        mb: 2,
                        border: `4px solid ${theme.palette.background.paper}`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.1)}`,
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05) rotate(5deg)'
                        }
                      }}
                    >
                      {!member.avatarSrc && member.name.charAt(0)}
                    </Avatar>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 1
                      }}
                    >
                      {member.name}
                    </Typography>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                        mb: 2,
                      }}
                    >
                      {member.role}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        fontSize: '0.95rem'
                      }}
                    >
                      {member.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              Our Approach
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                mb: 2,
              }}
            >
              We believe in a holistic approach to mental health that combines:
            </Typography>
            <Typography 
              component="ul" 
              sx={{ 
                pl: 4,
                color: theme.palette.text.secondary,
                '& li': {
                  mb: 1,
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                }
              }}
            >
              <li>Evidence-based therapeutic techniques</li>
              <li>Advanced AI technology for personalized support</li>
              <li>Regular progress tracking and insights</li>
              <li>Community support and resources</li>
              <li>Professional guidance when needed</li>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </motion.div>
  );
};

export default AboutUs;