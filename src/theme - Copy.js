// theme.js

import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#1976d2',
      light: '#4791db',
      dark: '#115293',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0',
      dark: '#6a1b9a',
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'light' ? '#f4f6f8' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1c2b3c',
      gradient: mode === 'light' 
        ? 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))'
        : 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    },
    text: {
      primary: mode === 'light' ? '#333' : '#ffffff',
      secondary: mode === 'light' ? '#757575' : '#b0b0b0',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 4, // Reduced border radius for rectangular shapes
  },
  shadows: [
    'none',
    ...Array.from({ length: 24 }, (_, index) =>
      mode === 'light'
        ? `rgba(0, 0, 0, 0.${index + 1}) 0px ${index + 1}px ${index + 2}px`
        : `hsla(220, 25%, 10%, 0.08) 0px ${index + 1}px ${index + 2}px`
    ),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.3s ease, color 0.3s ease',
          borderRadius: 4, // Ensures buttons are not oval
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.5s ease',
          borderRadius: 4, // Ensures paper components are not oval
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.5s ease, box-shadow 0.3s ease',
          borderRadius: 4, // Ensures cards are not oval
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          transition: 'color 0.3s ease',
        },
      },
    },
  },
});

export default getTheme;
