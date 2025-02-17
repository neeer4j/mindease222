// src/components/Footer.js

import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  IconButton,
  Link as MuiLink,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        width: '100%',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        padding: theme.spacing(6, 0), // Increased padding for better visual spacing
        boxShadow: theme.shadows[2], // Slightly reduced shadow for a softer look
        borderTop: `1px solid ${theme.palette.divider}`, // Added a subtle top border
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Branding & About */}
          <Grid item xs={12} md={4} lg={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}>
              <Link 
                to="/" 
                style={{ 
                  textDecoration: 'none',
                  display: 'flex',
                  height: '100px', // Reduced from 140px
                  overflow: 'visible',
                  alignItems: 'flex-start',
                  position: 'relative',
                  marginLeft: '-20px' // Adjusted from 0px
                }}
              >
                <img
                  src="/navbar/title/mindwasess.png"
                  alt="MindEase AI"
                  style={{
                    height: '400px', // Reduced from 500px
                    width: 'auto',
                    filter: theme.palette.mode === 'dark' ? 'brightness(1.5)' : 'none',
                    transition: 'all 0.3s ease',
                    marginLeft: '-35px', // Adjusted from -25px
                    marginTop: '-150px', // Adjusted from -180px
                    marginBottom: '-150px', // Adjusted from -180px
                    objectFit: 'contain',
                    transform: 'translateX(-25px) scale(1.1)' // Adjusted translateX from -15px
                  }}
                />
              </Link>
              <Box sx={{ ml: 3, mt: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Your mental wellness companion, leveraging AI to support your journey to a balanced and happier life.
                </Typography>
              </Box>
            </Box>
            <Box sx={{ ml: 3 }}>
              <Typography variant="caption" color="textSecondary">
                © {new Date().getFullYear()} MindEase AI. All rights reserved.
              </Typography>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={6} md={3} lg={2}> {/* Adjusted Grid sizes */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 2 }}>
              Explore
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}> {/* Increased gap for better readability */}
              <MuiLink
                component={Link}
                to="/dashboard" // Direct link to Dashboard as a primary quick link
                underline="none"
                color="textSecondary"
                sx={{
                  '&:hover': { color: theme.palette.primary.main },
                  transition: 'color 0.3s ease',
                }}
              >
                Dashboard
              </MuiLink>
              <MuiLink
                component={Link}
                to="/mood-tracker" // Direct link to Mood Tracker
                underline="none"
                color="textSecondary"
                sx={{
                  '&:hover': { color: theme.palette.primary.main },
                  transition: 'color 0.3s ease',
                }}
              >
                Mood Tracker
              </MuiLink>
              <MuiLink
                component={Link}
                to="/meditations" // Direct link to Meditations
                underline="none"
                color="textSecondary"
                sx={{
                  '&:hover': { color: theme.palette.primary.main },
                  transition: 'color 0.3s ease',
                }}
              >
                Meditations
              </MuiLink>
               <MuiLink
                component={Link}
                to="/insights" // Direct link to Insights
                underline="none"
                color="textSecondary"
                sx={{
                  '&:hover': { color: theme.palette.primary.main },
                  transition: 'color 0.3s ease',
                }}
              >
                Insights
              </MuiLink>
            </Box>
          </Grid>

          {/* Legal & Company */}
          <Grid item xs={6} md={3} lg={2}> {/* Adjusted Grid sizes */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 2 }}>
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}> {/* Increased gap for better readability */}
              <MuiLink
                component={Link}
                to="/about"
                underline="none"
                color="textSecondary"
                sx={{
                  '&:hover': { color: theme.palette.primary.main },
                  transition: 'color 0.3s ease',
                }}
              >
                About Us
              </MuiLink>
              <MuiLink
                component={Link}
                to="/contact"
                underline="none"
                color="textSecondary"
                sx={{
                  '&:hover': { color: theme.palette.primary.main },
                  transition: 'color 0.3s ease',
                }}
              >
                Contact
              </MuiLink>
              <MuiLink
                component={Link}
                to="/terms-of-service"
                underline="none"
                color="textSecondary"
                sx={{
                  '&:hover': { color: theme.palette.primary.main },
                  transition: 'color 0.3s ease',
                }}
              >
                Terms of Service
              </MuiLink>
              <MuiLink
                component={Link}
                to="/privacy-policy"
                underline="none"
                color="textSecondary"
                sx={{
                  '&:hover': { color: theme.palette.primary.main },
                  transition: 'color 0.3s ease',
                }}
              >
                Privacy Policy
              </MuiLink>
            </Box>
          </Grid>


          {/* Social & Contact */}
          <Grid item xs={12} md={3} lg={3}> {/* Adjusted Grid sizes */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 2 }}>
              Connect
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="textSecondary">
                Stay up-to-date and join our community! Follow us on social media for tips, inspiration, and updates.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}> {/* Increased gap and added margin bottom */}
              <IconButton
                component="a"
                href="https://facebook.com" // Replace with your actual Facebook link
                target="_blank"
                rel="noopener"
                aria-label="Facebook"
                sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } }} // Hover effect
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://twitter.com" // Replace with your actual Twitter link
                target="_blank"
                rel="noopener"
                aria-label="Twitter"
                sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } }} // Hover effect
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://instagram.com" // Replace with your actual Instagram link
                target="_blank"
                rel="noopener"
                aria-label="Instagram"
                sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } }} // Hover effect
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://linkedin.com" // Replace with your actual LinkedIn link
                target="_blank"
                rel="noopener"
                aria-label="LinkedIn"
                sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.primary.main } }} // Hover effect
              >
                <LinkedInIcon />
              </IconButton>
            </Box>
             <Typography variant="body2" color="textSecondary">
              Email: <MuiLink href="mailto:info@mindeaseai.com" color="inherit" underline="hover">info@mindeaseai.com</MuiLink><br />
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </motion.div>
  );
};

export default Footer;