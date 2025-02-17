import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from '../firebase';

class FirestoreErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a Firestore internal assertion error
    const isFirestoreError = error.message?.includes('INTERNAL ASSERTION FAILED');
    return { 
      hasError: isFirestoreError,
      error: isFirestoreError ? error : null
    };
  }

  componentDidCatch(error, errorInfo) {
    if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
      console.error('Firestore Error:', error);
      console.error('Error Info:', errorInfo);
    }
  }

  handleRetry = async () => {
    try {
      // Reset the connection
      await disableNetwork(db);
      await enableNetwork(db);
      
      // Clear error state
      this.setState({ hasError: false, error: null });
      
      // Force a reload only if needed
      if (this.state.error?.message?.includes('INTERNAL ASSERTION FAILED')) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error during retry:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="200px"
          p={3}
          textAlign="center"
        >
          <Typography variant="h6" color="error" gutterBottom>
            Connection Error
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            We encountered an issue with the database connection. Please try again.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleRetry}
            sx={{ mt: 2 }}
          >
            Retry Connection
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default FirestoreErrorBoundary;