import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from '../firebase';

class FirestoreErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      isRetrying: false 
    };
  }

  static getDerivedStateFromError(error) {
    const isFirestoreError = error.message?.includes('INTERNAL ASSERTION FAILED');
    return { 
      hasError: isFirestoreError,
      error: isFirestoreError ? error : null,
      isRetrying: false
    };
  }

  componentDidCatch(error, errorInfo) {
    if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
      console.error('Firestore Error:', error);
      console.error('Error Info:', errorInfo);
    }
  }

  handleRetry = async () => {
    if (this.state.isRetrying) return;

    this.setState({ isRetrying: true });
    
    try {
      // Add a small delay before network operations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Disable network first
      await disableNetwork(db);
      
      // Add a small delay between operations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Enable network
      await enableNetwork(db);
      
      // Reset state
      this.setState({ 
        hasError: false, 
        error: null,
        isRetrying: false 
      });
    } catch (err) {
      console.error('Error during retry:', err);
      this.setState({ 
        isRetrying: false,
        error: err
      });
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
            disabled={this.state.isRetrying}
            sx={{ mt: 2 }}
          >
            {this.state.isRetrying ? 'Retrying...' : 'Retry Connection'}
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default FirestoreErrorBoundary;