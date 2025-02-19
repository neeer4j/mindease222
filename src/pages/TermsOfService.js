import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  useTheme,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';

const TermsOfService = () => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        background: theme.palette.background.gradient,
        paddingTop: theme.spacing(16), // Increased from 12 to 16
        paddingBottom: theme.spacing(8),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: theme.shadows[4],
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
            Terms of Service
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              1. Acceptance of Terms
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              By accessing and using MindEase AI's services, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              2. Description of Service
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              MindEase AI provides mental wellness and self-improvement services through our web-based platform. 
              Our services include mood tracking, meditation guides, and AI-powered wellness recommendations.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              3. User Responsibilities
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Users are responsible for maintaining the confidentiality of their account information and for all 
              activities that occur under their account. Users must provide accurate and current information 
              during registration.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              4. Account Security
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              You are responsible for safeguarding your account credentials and for any activities or actions under your account. You must immediately notify MindEase AI of any unauthorized uses of your account or any other breaches of security. MindEase AI will not be liable for any acts or omissions by you, including any damages of any kind incurred as a result of such acts or omissions.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              5. Intellectual Property Rights
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              The Service and its original content, features, and functionality are owned by MindEase AI and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws. You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service without express written permission from us.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              6. User Content
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              By posting, uploading, or sharing any content through our Service, you grant MindEase AI a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content for the purpose of providing our services. You represent and warrant that you own or have the necessary rights to such content, and that it does not violate any third party rights or applicable laws.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              7. Prohibited Activities
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Users are prohibited from engaging in any activities that:
              • Violate any laws or regulations
              • Infringe on the rights of others
              • Are harmful, fraudulent, or deceptive
              • Attempt to interfere with the proper functioning of our Service
              • Harvest or collect user data without permission
              • Use our Service for any unauthorized commercial purposes
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              8. Service Availability and Support
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              While we strive to provide uninterrupted service, MindEase AI does not guarantee that the service will be available at all times. We may experience hardware, software, or other problems resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Service at any time without notice.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              9. Disclaimer of Warranties
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              The Service is provided "as is" and "as available" without any warranties of any kind, either express or implied. MindEase AI does not warrant that the Service will be uninterrupted or error-free, that defects will be corrected, or that the Service is free of viruses or other harmful components.
            </Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                color: theme.palette.primary.main,
                fontWeight: 700,
                mb: 2,
              }}
            >
              10. Dispute Resolution
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Any dispute arising from these Terms shall be governed by the laws of [Your Jurisdiction]. You agree to first attempt to resolve any disputes informally by contacting us. If a dispute cannot be resolved informally, both parties agree to submit to the exclusive jurisdiction of the courts in [Your Jurisdiction].
            </Typography>
          </Box>
        </Paper>
      </Container>
    </motion.div>
  );
};

export default TermsOfService;