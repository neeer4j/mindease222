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

const PrivacyPolicy = () => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
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
            Privacy Policy
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
              1. Information We Collect
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              We collect information you provide directly to us, including personal information such as your name, 
              email address, and any other information you choose to provide. We also automatically collect certain 
              information about your device when you use our services.
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
              2. How We Use Your Information
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              We use the information we collect to:
              • Provide, maintain, and improve our services
              • Process your requests and send you related information
              • Send you technical notices, updates, security alerts, and support messages
              • Respond to your comments, questions, and customer service requests
              • Monitor and analyze trends, usage, and activities in connection with our services
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
              3. Data Security
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              We implement appropriate technical and organizational security measures designed to protect your 
              personal information from accidental loss and unauthorized access, use, alteration, or disclosure.
              However, no security system is impenetrable, and we cannot guarantee the security of our systems.
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
              4. Data Retention
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              We retain personal information we collect from you for as long as necessary to fulfill the purposes 
              for which we collected it, including for the purposes of satisfying any legal, accounting, or 
              reporting requirements, or to provide our services.
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
              5. Your Rights and Choices
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              You have the right to:
              • Access your personal information
              • Correct inaccurate or incomplete information
              • Request deletion of your personal information
              • Object to our processing of your information
              • Request restrictions on our processing of your information
              • Request transfer of your information to another service
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
              6. Children's Privacy
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Our services are not directed to children under 13. We do not knowingly collect personal information 
              from children under 13. If we learn we have collected or received personal information from a child 
              under 13, we will delete that information.
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
              7. Cookies and Tracking Technologies
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              We use cookies and similar tracking technologies to track activity on our services and hold certain 
              information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
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
              8. Third-Party Services
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              Our services may contain links to third-party websites or services. We are not responsible for the 
              content or privacy practices of these third-party services. We encourage you to read the privacy 
              policies of any third-party service you visit.
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
              9. Changes to This Privacy Policy
            </Typography>
            <Typography 
              paragraph
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '1.1rem',
                lineHeight: 1.6,
              }}
            >
              We may update this privacy policy from time to time. We will notify you of any changes by posting 
              the new privacy policy on this page and updating the "Last updated" date below.
            </Typography>
          </Box>

          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 4,
                color: theme.palette.text.secondary,
                fontSize: '0.95rem'
              }}
            >
              Last updated: {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </motion.div>
  );
};

export default PrivacyPolicy;