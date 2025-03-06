import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { styled } from '@mui/material/styles';

// Styled component for a more modern snackbar alert
const ModernAlert = styled(Alert)(({ theme, severity }) => ({
  borderRadius: 12,
  backdropFilter: 'blur(10px)',
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(18, 18, 18, 0.9)' 
    : 'rgba(255, 255, 255, 0.9)',
  '& .MuiAlert-icon': {
    color: severity === 'error' 
      ? theme.palette.error.main
      : theme.palette.success.main
  },
  '& .MuiAlert-message': {
    color: severity === 'error'
      ? theme.palette.error.main
      : theme.palette.success.main,
    fontWeight: 500
  }
}));

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  useEffect(() => {
    if (!isNativeAndroid) return;

    let networkStatusSubscription;

    const initializeNetworkStatus = async () => {
      try {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        if (!status.connected) {
          setShowSnackbar(true);
        }

        networkStatusSubscription = Network.addListener('networkStatusChange', status => {
          setIsOnline(status.connected);
          setShowSnackbar(true);
          
          // If coming back online, auto-hide the snackbar after 2 seconds
          if (status.connected) {
            setTimeout(() => {
              setShowSnackbar(false);
            }, 2000);
          }
        });
      } catch (error) {
        console.error('Error initializing network status:', error);
      }
    };

    initializeNetworkStatus();

    return () => {
      if (networkStatusSubscription) {
        networkStatusSubscription.remove();
      }
    };
  }, [isNativeAndroid]);

  // If not on native Android, don't render anything
  if (!isNativeAndroid) return null;

  return (
    <Snackbar
      open={showSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      onClose={() => isOnline && setShowSnackbar(false)}
      sx={{
        bottom: { xs: 80, sm: 24 }, // Account for bottom navigation on mobile
      }}
    >
      <ModernAlert
        severity={isOnline ? "success" : "error"}
        onClose={() => isOnline && setShowSnackbar(false)}
        sx={{
          minWidth: '200px',
          transition: 'all 0.3s ease-in-out',
          '& .MuiAlert-icon': {
            fontSize: '1.5rem'
          }
        }}
      >
        {isOnline ? "Back Online" : "You're Offline"}
      </ModernAlert>
    </Snackbar>
  );
};

export default NetworkStatus; 