// src/theme.js

import { createTheme } from '@mui/material/styles';

// Change this color to whatever you like.
// In VS Code, highlight this hex value and open the Color Picker from the Command Palette
// to visually select a new color.
const cardColor = '#2d3e50';

const getTheme = (mode) =>
  createTheme({
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
        // Feel free to tweak these as you wish:
        default: mode === 'light' ? '#f4f6f8' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1c2b3c',
        gradient:
          mode === 'light'
            ? 'linear-gradient(135deg, #d0eaff 0%, #ffffff 100%)'
            : 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
      },
      text: {
        primary: mode === 'light' ? '#333333' : '#ffffff',
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
      borderRadius: 8,
    },
    // Example of custom shadows in both light/dark modes:
    shadows: [
      'none',
      ...Array.from({ length: 24 }, (_, index) =>
        mode === 'light'
          ? `rgba(0, 0, 0, 0.${index + 1}) 0px ${index + 1}px ${
              index + 2
            }px`
          : `hsla(220, 25%, 10%, 0.08) 0px ${index + 1}px ${index + 2}px`
      ),
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.5s ease',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            // Apply our custom card color here
            backgroundColor: cardColor,
            transition: 'background-color 0.5s ease, box-shadow 0.3s ease',
            borderRadius: 8,
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
