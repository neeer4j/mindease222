import React from 'react';
import { styled, alpha } from '@mui/system';
import { Box, TextField, IconButton, Badge, Typography, Button, Dialog, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// Constants for calculations
export const BOTTOM_NAV_HEIGHT = 56;
export const CHAT_INPUT_HEIGHT = 52;
export const MOOD_PROMPT_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const GradientButton = motion(Button);

export const StyledChatContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'light' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.15)} 100%)`,
  borderRadius: '28px',
  boxShadow: theme.palette.mode === 'light'
    ? '0 10px 40px -10px rgba(0,0,0,0.1)'
    : '0 10px 40px -10px rgba(0,0,0,0.3)',
  backdropFilter: 'blur(12px)',
  border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.2)}`,
  overflow: 'hidden',
}));

export const MessageContainer = styled(Box)(({ theme, isBot }) => ({
  display: 'flex',
  justifyContent: isBot ? 'flex-start' : 'flex-end',
  marginBottom: theme.spacing(1.5),
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  '&:hover': {
    '& .message-actions': {
      opacity: 1,
      transform: 'translateX(0)',
    }
  }
}));

export const MessageBubble = styled(Box)(({ theme, isBot }) => ({
  background: isBot
    ? theme.palette.mode === 'light'
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`
    : theme.palette.mode === 'light'
      ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.12)} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
  borderRadius: '24px',
  padding: '12px 20px',
  maxWidth: '85%',
  wordWrap: 'break-word',
  boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
  border: `1px solid ${alpha(
    isBot ? theme.palette.primary.main : theme.palette.secondary.main,
    0.15
  )}`,
  position: 'relative',
  transition: 'all 0.2s ease',
  [theme.breakpoints.down('sm')]: {
    padding: '10px 16px',
    maxWidth: '80%',
    borderRadius: isBot ? '20px 20px 20px 8px' : '20px 20px 8px 20px',
    marginLeft: isBot ? 0 : 'auto',
    marginRight: isBot ? 'auto' : 0,
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
  }
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '24px',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(12px)',
    transition: 'all 0.3s ease',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.95),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.primary.main}`,
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    '& fieldset': {
      border: 'none',
    }
  },
  '& .MuiInputBase-input': {
    padding: '16px 24px',
    fontSize: '1rem',
    lineHeight: '1.5',
  }
}));

export const AnimatedButton = styled(motion(IconButton))(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  color: theme.palette.primary.contrastText,
  borderRadius: '50%',
  width: 52,
  height: 52,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
  },
  '&:disabled': {
    background: theme.palette.action.disabledBackground,
    boxShadow: 'none',
  }
}));

export const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    background: theme.palette.mode === 'light'
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
  },
}));

export const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  fontSize: '1.5rem',
  padding: theme.spacing(1, 3),
  transition: 'all 0.2s ease',
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.1),
  },
}));

export const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '12px 24px',
  maxWidth: 'fit-content',
  background: theme.palette.mode === 'light'
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
  borderRadius: '24px',
  marginLeft: theme.spacing(1),
  marginBottom: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
}));

export const TypingDot = styled(motion.div)(({ theme }) => ({
  width: '10px',
  height: '10px',
  backgroundColor: theme.palette.primary.main,
  borderRadius: '50%',
  opacity: 0.7,
}));

export const TimeStamp = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: alpha(theme.palette.text.secondary, 0.7),
  padding: '4px 12px',
  borderRadius: '12px',
  background: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  marginBottom: theme.spacing(2),
  textAlign: 'center',
}));

export const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    width: 8,
    height: 8,
    borderRadius: '50%',
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(1)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2)',
      opacity: 0,
    },
  },
}));

export const StyledMarkdown = styled(ReactMarkdown)(({ theme }) => ({
  '& p': {
    margin: 0,
    lineHeight: 1.6,
  },
  '& p:not(:last-child)': {
    marginBottom: '0.75em',
  },
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& code': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    padding: '2px 4px',
    borderRadius: '4px',
    fontSize: '0.9em',
    fontFamily: 'monospace',
  },
  '& pre': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    padding: '12px',
    borderRadius: '8px',
    overflow: 'auto',
    '& code': {
      backgroundColor: 'transparent',
      padding: 0,
    },
  },
  '& ul, & ol': {
    paddingLeft: '1.5em',
    marginTop: '0.5em',
    marginBottom: '0.5em',
  },
  '& blockquote': {
    borderLeft: `4px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    margin: '0.5em 0',
    padding: '0.5em 1em',
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderRadius: '4px',
    '& p': {
      margin: 0,
    },
  },
  '& img': {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    marginTop: '0.5em',
    marginBottom: '0.5em',
  },
  '& th, & td': {
    border: `1px solid ${theme.palette.divider}`,
    padding: '8px',
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
}));

export const chatContentStyles = {
  flex: 1,
  overflowY: 'auto',
  px: 2,
  pt: 2,
  pb: `${BOTTOM_NAV_HEIGHT + CHAT_INPUT_HEIGHT + 32}px`,
  scrollBehavior: 'smooth',
  '::-webkit-scrollbar': {
    width: '4px',
  },
  '::-webkit-scrollbar-thumb': {
    background: 'rgba(128, 128, 128, 0.3)',
    borderRadius: '2px',
  },
  WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
  height: '100%', // Ensure container takes full height
  display: 'flex',
  flexDirection: 'column',
};

// Utility function for time formatting
export const formatTime = (ts) => {
  try {
    if (!ts) return '—';
    const date = ts.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Date';
  }
}; 