// src/pages/Dashboard.js

import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardActions as MuiCardActions,
  Avatar,
  IconButton,
  Snackbar,
  Alert,
  Skeleton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Assignment as AssignmentIcon,
  Insights as InsightsIcon,
  Bedtime as BedtimeIcon,
  Lightbulb as LightbulbIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  Refresh as RefreshIcon,
  PsychologyAlt as PsychologyAltIcon,
  EmojiEmotions as MoodIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { styled, alpha } from '@mui/system';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { MoodContext } from '../contexts/MoodContext';
import { ActivityContext } from '../contexts/ActivityContext';
import { AuthContext } from '../contexts/AuthContext';
import { SleepContext } from '../contexts/SleepContext';
import { ChatContext } from '../contexts/ChatContext';
import { TherapistFindContext } from '../contexts/TherapistFindContext';
import PageLayout from '../components/PageLayout';
import DailyAffirmations from '../components/DailyAffirmations';
import BreathingExerciseWidget from '../components/BreathingExerciseWidget';

// =======================
// Utility Functions
// =======================
const getTimestampValue = (timestamp) => {
  if (!timestamp) return 0;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp === 'number') return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp).getTime();
  console.warn('Unknown timestamp format:', timestamp);
  return 0;
};

const getDateFromTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'number') return new Date(timestamp);
  if (typeof timestamp === 'string') return new Date(timestamp);
  console.warn('Unknown timestamp format:', timestamp);
  return null;
};

const formatDateToRelativeTime = (date) => {
  if (!(date instanceof Date) || isNaN(date)) return 'Invalid Date';
  const now = new Date();
  const diffInMilliseconds = now - date;
  const diffInMinutes = Math.round(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.round(diffInHours / 24);

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${Math.abs(diffInMinutes)} mins ago`;
  if (diffInMinutes < 60 * 24) return `${Math.abs(diffInHours)} hours ago`;
  if (diffInDays < 7) return `${Math.abs(diffInDays)} days ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// =======================
// Styled Components
// =======================

// A smoother GradientButton from your old code
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: '12px',
  padding: '10px 22px',
  boxShadow: theme.shadows[4],
  transition: 'background 0.4s ease-out, box-shadow 0.3s ease-out, transform 0.3s ease-out',
  textTransform: 'none',
  fontWeight: 500,
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
    boxShadow: theme.shadows[7],
    transform: 'scale(1.05)',
  },
}));

const SubtleButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.secondary,
  borderRadius: '12px',
  padding: '8px 16px',
  backgroundColor: 'transparent',
  transition: 'background-color 0.3s ease-out, color 0.3s ease-out, transform 0.2s ease-out',
  textTransform: 'none',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
    transform: 'scale(1.03)',
  },
}));

const MainContent = styled(motion.main)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  paddingTop: theme.spacing(3),
  backgroundColor: theme.palette.background.gradient,
  transition: theme.transitions.create(['padding-top', 'padding'], {
    duration: theme.transitions.duration.enteringScreen,
    easing: theme.transitions.easing.easeOut,
  }),
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
  flex: 1,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    paddingBottom: theme.spacing(8), // Add space for bottom navigation on mobile
  },
}));

// HeroSectionCard with better light mode contrast
const HeroSectionCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  background: theme.palette.mode === 'light' 
    ? `linear-gradient(135deg, 
        ${alpha(theme.palette.primary.main, 0.08)} 0%, 
        ${alpha(theme.palette.primary.light, 0.12)} 50%,
        ${alpha(theme.palette.primary.main, 0.05)} 100%)`
    : `linear-gradient(135deg, 
        ${alpha(theme.palette.primary.main, 0.15)} 0%, 
        ${alpha(theme.palette.secondary.main, 0.1)} 50%,
        ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
  borderRadius: '24px',
  position: 'relative',
  overflow: 'hidden',
  border: `1px solid ${theme.palette.mode === 'light' 
    ? alpha(theme.palette.primary.main, 0.15)
    : alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: theme.palette.mode === 'light'
    ? `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.25)}`
    : `0 8px 32px -8px ${alpha(theme.palette.primary.main, 0.15)}`,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: '28px',
    marginBottom: theme.spacing(2),
    '& .MuiAvatar-root': {
      width: 60,
      height: 60,
      marginBottom: theme.spacing(2),
    },
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'light'
      ? `radial-gradient(circle at top right, 
          ${alpha(theme.palette.primary.main, 0.08)} 0%, 
          transparent 70%)`
      : `radial-gradient(circle at top right, 
          ${alpha(theme.palette.primary.light, 0.1)} 0%, 
          transparent 70%)`,
    pointerEvents: 'none'
  }
}));

const HeroAvatar = styled(Avatar)(({ theme, variant = 'default' }) => {
  let borderColor = alpha(theme.palette.primary.main, 0.2);
  if (variant === 'primary') {
    borderColor = alpha(theme.palette.primary.main, 0.3);
  } else if (variant === 'secondary') {
    borderColor = alpha(theme.palette.secondary.main, 0.3);
  } else if (variant === 'tertiary') {
    borderColor = alpha(theme.palette.info.main, 0.3);
  }
  return {
    width: theme.spacing(9),
    height: theme.spacing(9),
    marginRight: theme.spacing(3),
    border: `3px solid ${borderColor}`,
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.25)}`,
    },
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(2),
      marginRight: 0,
    },
  };
});

const HeroTextContainer = styled(Box)(({ theme }) => ({
  textAlign: 'left',
  flexGrow: 1,
  [theme.breakpoints.down('sm')]: {
    textAlign: 'center',
    '& .MuiTypography-root': {
      textAlign: 'center',
    },
  },
}));

const HeroGreeting = styled(Typography)(({ theme, variant = 'default' }) => ({
  fontWeight: 800,
  color: theme.palette.mode === 'light' 
    ? theme.palette.primary.dark
    : theme.palette.common.white,
  marginBottom: theme.spacing(1),
  fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
  lineHeight: 1.2,
  textShadow: theme.palette.mode === 'light' 
    ? 'none'
    : `0 2px 4px ${alpha(theme.palette.common.black, 0.2)}`,
  ...(variant !== 'default' && { 
    color: theme.palette.mode === 'light'
      ? theme.palette.primary.dark
      : theme.palette.getContrastText(theme.palette[variant].light) 
  }),
}));

const HeroQuote = styled(Typography)(({ theme, variant = 'default' }) => ({
  fontStyle: 'italic',
  color: theme.palette.mode === 'light' 
    ? theme.palette.text.primary
    : theme.palette.common.white,
  marginBottom: theme.spacing(2),
  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
  lineHeight: 1.4,
  opacity: theme.palette.mode === 'light' ? 1 : 0.9,
  ...(variant !== 'default' && { 
    color: theme.palette.mode === 'light'
      ? theme.palette.text.primary
      : alpha(theme.palette.getContrastText(theme.palette[variant].light), 0.9)
  }),
}));

const HeroSubtitle = styled(Typography)(({ theme, variant = 'default' }) => ({
  color: theme.palette.mode === 'light' 
    ? theme.palette.text.secondary
    : theme.palette.common.white,
  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
  lineHeight: 1.6,
  display: 'flex',
  alignItems: 'center',
  '& .MuiIconButton-root': {
    color: theme.palette.mode === 'light' 
      ? theme.palette.primary.main
      : theme.palette.common.white,
    '&:hover': {
      color: theme.palette.mode === 'light'
        ? theme.palette.primary.dark
        : theme.palette.common.white,
      backgroundColor: theme.palette.mode === 'light'
        ? alpha(theme.palette.primary.main, 0.1)
        : alpha(theme.palette.common.white, 0.1),
    }
  },
  ...(variant !== 'default' && { 
    color: theme.palette.mode === 'light'
      ? theme.palette.text.secondary
      : alpha(theme.palette.getContrastText(theme.palette[variant].light), 0.7)
  }),
}));

// =======================
// NEW: DashboardCard styled component
// =======================
const DashboardCard = styled(Card)(({ theme, cardcolor, bggradient }) => ({
  padding: theme.spacing(3),
  textAlign: 'left',
  borderRadius: 16,
  height: '100%',
  background: theme.palette.mode === 'light'
    ? bggradient || `linear-gradient(135deg, 
        ${alpha(cardcolor || theme.palette.primary.main, 0.04)} 0%, 
        ${alpha(cardcolor || theme.palette.primary.main, 0.08)} 100%)`
    : bggradient || `linear-gradient(135deg, 
        ${alpha(theme.palette.primary.main, 0.08)} 0%, 
        ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
  border: `1px solid ${theme.palette.mode === 'light'
    ? alpha(cardcolor || theme.palette.primary.main, 0.2)
    : alpha(cardcolor || theme.palette.primary.main, 0.15)}`,
  boxShadow: theme.palette.mode === 'light'
    ? `0 8px 32px ${alpha(cardcolor || theme.palette.primary.main, 0.25)}`
    : `0 8px 32px ${alpha(cardcolor || theme.palette.primary.main, 0.15)}`,
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease-in-out',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: 24,
    boxShadow: `0 12px 24px ${alpha(cardcolor || theme.palette.primary.main, 0.2)}`,
    '&:active': {
      transform: 'scale(0.98)',
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, 
      ${alpha(cardcolor || theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.15)} 0%, 
      transparent 100%)`,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
  '&:hover::before': {
    opacity: 1,
  },
}));

const WidgetTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: theme.palette.mode === 'light' ? theme.palette.primary.dark : theme.palette.text.primary,
  marginBottom: theme.spacing(3),
  paddingBottom: theme.spacing(1.5),
  borderBottom: `2px solid ${theme.palette.mode === 'light' 
    ? alpha(theme.palette.primary.main, 0.3)
    : alpha(theme.palette.primary.main, 0.2)}`,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    color: theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.dark, 0.9)
      : alpha(theme.palette.primary.main, 0.8),
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1rem',
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
}));

const CardActions = styled(MuiCardActions)(({ theme }) => ({
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(1.5, 2),
}));

// MoodHeader with better light mode contrast
const MoodHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  textAlign: 'center',
  backgroundColor: theme.palette.mode === 'light' 
    ? alpha(theme.palette.background.paper, 0.7)
    : theme.palette.background.paper,
  '& .MuiTypography-root': {
    color: theme.palette.mode === 'light' 
      ? theme.palette.primary.dark
      : theme.palette.text.secondary,
  }
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(1),
  height: 160,
  '& .recharts-cartesian-grid-horizontal line, & .recharts-cartesian-grid-vertical line': {
    stroke: theme.palette.mode === 'light' 
      ? alpha(theme.palette.divider, 0.3)
      : alpha(theme.palette.divider, 0.2),
  },
  '& .recharts-text': {
    fill: theme.palette.mode === 'light'
      ? theme.palette.primary.dark
      : theme.palette.text.secondary,
  },
  '& .recharts-brush-slide': {
    fill: theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.main, 0.1)
      : alpha(theme.palette.primary.main, 0.2),
  }
}));

const ChatListScrollableBox = styled(Box)(({ theme }) => ({
  maxHeight: '120px',
  overflowY: 'auto',
  paddingRight: theme.spacing(0.5),
  transition: 'padding-right 0.3s ease-out',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.mode === 'light'
      ? alpha(theme.palette.background.paper, 0.8)
      : theme.palette.background.paper,
    borderRadius: '12px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.main, 0.6)
      : theme.palette.primary.main,
    borderRadius: '12px',
    border: `1px solid ${theme.palette.background.paper}`,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: theme.palette.mode === 'light'
      ? theme.palette.primary.main
      : theme.palette.primary.dark,
  },
}));

const ActivityListItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1, 0),
  '&:hover': {
    backgroundColor: theme.palette.mode === 'light'
      ? alpha(theme.palette.primary.main, 0.05)
      : theme.palette.action.hover,
    borderRadius: '8px',
  },
}));

const DashboardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minHeight: '100vh',
}));

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.background.paper, 0.7),
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[2]
  }
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  padding: theme.spacing(1, 1.5),
  transition: 'all 0.2s ease-in-out',
  border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  '&:hover': {
    backgroundColor: alpha(theme.palette.action.hover, 0.1),
    transform: 'translateX(4px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
  }
}));

const StyledListContainer = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
  marginBottom: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '& .MuiListItem-root:last-child': {
    marginBottom: 0
  }
}));

// =======================
// Motion Variants
// =======================
const mainContentVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

const widgetVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      delayChildren: 0.1,
      staggerChildren: 0.05,
      type: 'spring',
      damping: 20,
      stiffness: 100,
    },
  },
};

const widgetItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, type: 'spring', damping: 18, stiffness: 90 },
  },
};

// =======================
// Main Component: DashboardPage
// =======================
const DashboardPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Contexts
  const { user, logout } = useContext(AuthContext);
  const { moodEntries, loading: moodLoading } = useContext(MoodContext);
  const { activities, loading: activityLoading, refreshActivities } = useContext(ActivityContext);
  const { sleepLogs, loading: sleepLoading, refreshSleepLogs } = useContext(SleepContext);
  const { messages: chatMessages, loading: chatLoading, refreshMessages } = useContext(ChatContext);
  const {
    therapists: therapistData,
    loading: therapistLoading,
    error: therapistError,
    fetchTherapists,
    clearTherapists,
  } = useContext(TherapistFindContext);

  // Snackbar state for notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Local states for various sections
  const [userName, setUserName] = useState('User');
  const [userAvatarUrl, setUserAvatarUrl] = useState('https://source.unsplash.com/random/50x50?sig=avatar');
  const [moodSummary, setMoodSummary] = useState('');
  const [moodChartData, setMoodChartData] = useState([]);
  const [latestChatsPreview, setLatestChatsPreview] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [insightHighlight, setInsightHighlight] = useState('');
  const [sleepInsight, setSleepInsight] = useState('');
  const [heroQuote, setHeroQuote] = useState('');
  const [affirmation, setAffirmation] = useState('');
  const [chartBrushStartIndex, setChartBrushStartIndex] = useState(0);
  const [quoteCategory, setQuoteCategory] = useState('general');
  const [locationErrorState, setLocationErrorState] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // For the Reels section wording
  const reelsSectionText =
    "Dive into quick, uplifting reels designed to spark inspiration and motivate you throughout your day.";

  // Daily Quotes categorized for mood-based hero section
  const dailyQuotes = useMemo(
    () => ({
      positive: [
        'Every day is a fresh start.',
        'Believe in your potential.',
        'You have the power to create positive change.',
      ],
      neutral: [
        'Find joy in the present moment.',
        'Balance is key to wellbeing.',
        'Take time to reflect and recharge.',
      ],
      negative: [
        "It's okay to not be okay.",
        'Reach out for support when you need it.',
        'Small steps forward are still progress.',
      ],
      general: [
        'The journey of a thousand miles begins with a single step.',
        'Happiness is not by chance, but by choice.',
        "Believe you can and you're halfway there.",
        'The mind is everything. What you think you become.',
        'Small steps forward are still steps forward.',
      ],
    }),
    []
  );

  // Helper: Generate a mood summary text based on the numeric mood value
  const getMoodSummaryText = useCallback((moodValue) => {
    if (moodValue >= 4.5) return 'Extremely Positive! 🌟 Keep shining!';
    if (moodValue >= 3.5) return 'Positive and Energetic! 😊 Great job maintaining your mood.';
    if (moodValue >= 2.5) return "Balanced and Content. 🌈 You're maintaining a steady mood.";
    if (moodValue >= 1.5) return 'Feeling a Bit Low. 🧘‍♂️ Consider taking some time for self-care.';
    return 'Quite Low. 💔 It might help to reach out for support or engage in relaxing activities.';
  }, []);

  // Snackbar functions
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  }, []);

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login');
      showSnackbar('Logout successful!', 'success');
    } catch (error) {
      console.error('Logout failed', error);
      showSnackbar('Logout failed. Please try again.', 'error');
    }
  }, [logout, navigate, showSnackbar]);

  // Time of Day Greeting
  const timeOfDayGreeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Refresh Widget Data Handlers
  const refreshMoodWidget = useCallback(() => {
    showSnackbar('Mood data refreshed', 'info');
  }, [showSnackbar]);

  const refreshActivityWidget = useCallback(() => {
    refreshActivities();
    showSnackbar('Activity data refreshed', 'info');
  }, [refreshActivities, showSnackbar]);

  const refreshSleepWidget = useCallback(() => {
    refreshSleepLogs();
    showSnackbar('Sleep data refreshed', 'info');
  }, [refreshSleepLogs, showSnackbar]);

  const refreshChatWidget = useCallback(() => {
    refreshMessages();
    showSnackbar('Chat data refreshed', 'info');
  }, [refreshMessages, showSnackbar]);

  // Handle Refresh Quote
  const handleRefreshQuote = useCallback(() => {
    const categoryQuotes = dailyQuotes[quoteCategory] || dailyQuotes.general;
    setHeroQuote(categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)]);
  }, [dailyQuotes, quoteCategory]);

  // Set user details when available
  useEffect(() => {
    if (user) {
      setUserName(user.displayName || 'User');
      setUserAvatarUrl(user.avatar || 'https://source.unsplash.com/random/50x50?sig=avatar');
    }
  }, [user]);

  // Update hero quote based on moodSummary
  useEffect(() => {
    let category = 'general';
    if (moodSummary.includes('Extremely Positive') || moodSummary.includes('Positive and Energetic')) {
      category = 'positive';
    } else if (moodSummary.includes('Feeling a Bit Low') || moodSummary.includes('Quite Low')) {
      category = 'negative';
    } else if (moodSummary) {
      category = 'neutral';
    }
    setQuoteCategory(category);
    const categoryQuotes = dailyQuotes[category] || dailyQuotes.general;
    setHeroQuote(categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)]);
  }, [moodSummary, dailyQuotes]);

  // Set affirmation on mount
  useEffect(() => {
    setAffirmation(DailyAffirmations.getRandomAffirmation());
  }, []);

  // Process mood entries for summary and chart data
  useEffect(() => {
    if (!moodLoading && moodEntries) {
      if (moodEntries.length > 0) {
        const sortedMoods = [...moodEntries].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        const latestMoodEntry = sortedMoods[sortedMoods.length - 1];
        const latestMood = parseFloat(latestMoodEntry.mood);
        setMoodSummary(getMoodSummaryText(latestMood));

        const dailyMoodAverages = {};
        sortedMoods.forEach((entry) => {
          const entryDate = new Date(entry.timestamp).toLocaleDateString();
          if (!dailyMoodAverages[entryDate]) {
            dailyMoodAverages[entryDate] = { sumMood: 0, count: 0 };
          }
          dailyMoodAverages[entryDate].sumMood += parseFloat(entry.mood);
          dailyMoodAverages[entryDate].count += 1;
        });

        const chartData = Object.keys(dailyMoodAverages)
          .sort((a, b) => new Date(a) - new Date(b))
          .map((dateStr) => {
            const date = new Date(dateStr);
            return {
              name: date.toLocaleDateString('en-US', { weekday: 'short' }),
              date,
              mood: parseFloat(
                (dailyMoodAverages[dateStr].sumMood / dailyMoodAverages[dateStr].count).toFixed(1)
              ),
            };
          });
        setMoodChartData(chartData);
        setChartBrushStartIndex(chartData.length > 7 ? chartData.length - 7 : 0);
      } else {
        setMoodSummary('No mood entries yet. Log your mood to track your well-being.');
        setMoodChartData([]);
        setChartBrushStartIndex(0);
      }
    }
  }, [moodLoading, moodEntries, getMoodSummaryText]);

  // Process recent activities
  useEffect(() => {
    if (!activityLoading && activities) {
      const recentActivitiesData = activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map((activity) => ({
          id: activity.id,
          text: activity.title,
          time: formatDateToRelativeTime(new Date(activity.date)),
        }));
      setRecentActivities(
        recentActivitiesData.length > 0
          ? recentActivitiesData
          : [{ text: 'No activities logged yet. Start logging your daily activities!', time: '' }]
      );
    } else if (!activityLoading) {
      setRecentActivities([{ text: 'No activities logged yet. Start logging your daily activities!', time: '' }]);
    }
  }, [activityLoading, activities]);

  // Process chat messages preview
  useEffect(() => {
    if (!chatLoading && chatMessages) {
      const chatPreviewData = chatMessages
        .sort((a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp))
        .slice(0, 3);
      const processedChats = chatPreviewData.map((message) => {
        const date = getDateFromTimestamp(message.timestamp);
        return {
          id: message.id,
          text: message.text,
          time: date ? formatDateToRelativeTime(date) : 'Unknown time',
          sender: message.sender === 'user' ? 'You:' : 'AI:',
        };
      });
      setLatestChatsPreview(
        processedChats.length > 0
          ? processedChats
          : [{ text: 'No chat messages yet. Start a conversation!', time: '', sender: '' }]
      );
    } else if (!chatLoading) {
      setLatestChatsPreview([{ text: 'No chat messages yet. Start a conversation!', time: '', sender: '' }]);
    }
  }, [chatLoading, chatMessages]);

  // Set insights based on mood summary
  useEffect(() => {
    if (moodSummary.includes('Extremely Positive') || moodSummary.includes('Positive and Energetic')) {
      setInsightHighlight(
        'Your mood trend is looking fantastic! 🎉 Keep up the great work and continue focusing on your well-being.'
      );
    } else if (moodSummary.includes('Balanced and Content')) {
      setInsightHighlight("You're maintaining a steady mood. 🌟 Keep balancing your activities and self-care.");
    } else if (moodSummary.includes('Feeling a Bit Low') || moodSummary.includes('Quite Low')) {
      setInsightHighlight(
        "It's okay to have down days. 💙 Consider exploring some self-care activities and remember we're here to support you."
      );
    } else {
      setInsightHighlight("Let's check in with your mood and activities to bring you personalized insights.");
    }
  }, [moodSummary]);

  // Process sleep logs for sleep insight
  useEffect(() => {
    if (!sleepLoading && sleepLogs) {
      const totalSleepEntries = sleepLogs.length;
      if (totalSleepEntries > 0) {
        const totalDurationMs = sleepLogs.reduce(
          (sum, log) => sum + new Date(log.endTime).getTime() - new Date(log.startTime).getTime(),
          0
        );
        const avgHours = (totalDurationMs / totalSleepEntries / (1000 * 60 * 60)).toFixed(1);
        setSleepInsight(
          `Over the last ${totalSleepEntries} entries, you've averaged ${avgHours} hours of sleep per night. Consistent sleep is key!`
        );
      } else {
        setSleepInsight('No sleep logs recorded yet. Start tracking your sleep to understand your sleep patterns.');
      }
    } else if (!sleepLoading) {
      setSleepInsight('No sleep logs recorded yet. Start tracking your sleep to understand your sleep patterns.');
    }
  }, [sleepLoading, sleepLogs]);

  // Brush handler for mood chart
  const handleBrushChange = useCallback((startIndex, endIndex) => {
    if (startIndex !== undefined && endIndex !== undefined) {
      setChartBrushStartIndex(startIndex);
    }
  }, []);

  // Therapist refresh handling
  const fetchData = (force = false) => {
    setLocationErrorState(null);
    setIsRefreshing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`User location: ${latitude}, ${longitude}`);
          fetchTherapists(latitude, longitude, force);
          setIsRefreshing(false);
        },
        (err) => {
          console.error("Error obtaining location:", err);
          setLocationErrorState(
            "Unable to access your location. Please ensure location services are enabled for your browser and this site."
          );
          setIsRefreshing(false);
        }
      );
    } else {
      setLocationErrorState("Geolocation is not supported by your browser.");
      setIsRefreshing(false);
    }
  };

  // Close the details dialog.
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTherapist(null);
  };

  // Add a new component for mobile grid spacing
  const MobileGrid = styled(Grid)(({ theme }) => ({
    [theme.breakpoints.down('sm')]: {
      '& .MuiGrid-item': {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
      },
    },
  }));

  return (
    <DashboardContainer>
      <PageLayout>
        <MainContent variants={mainContentVariants} initial="hidden" animate="visible">
          <Container maxWidth="lg" sx={{ paddingBottom: theme.spacing(3) }}>
            {/* Hero Section */}
            <motion.div variants={widgetItemVariants} style={{ marginBottom: theme.spacing(isMobile ? 2 : 4) }}>
              <HeroSectionCard variant="primary">
                <motion.div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <HeroAvatar alt={userName} src={userAvatarUrl} variant="primary" />
                  <HeroTextContainer>
                    <HeroGreeting variant="primary" component="h1">
                      {timeOfDayGreeting}, {userName}
                    </HeroGreeting>
                    <HeroQuote variant="primary">"{heroQuote}"</HeroQuote>
                    <HeroSubtitle variant="primary" color="textSecondary">
                      Here's your daily overview
                      <IconButton
                        aria-label="refresh quote"
                        size="small"
                        onClick={handleRefreshQuote}
                        sx={{ ml: 1, color: 'inherit' }}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </HeroSubtitle>
                  </HeroTextContainer>
                </motion.div>
              </HeroSectionCard>
            </motion.div>

            {/* Widgets Grid */}
            <motion.div variants={widgetVariants} initial="hidden" animate="visible">
              <MobileGrid container spacing={isMobile ? 2 : 3}>
                {/* Mood Summary Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <DashboardCard
                      cardcolor={theme.palette.primary.main}
                      bggradient={`linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.05
                      )} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`}
                    >
                      <WidgetTitle>
                        <MoodIcon sx={{ fontSize: '1.2rem', color: theme.palette.primary.light }} />
                        Mood Summary
                      </WidgetTitle>
                      <MoodHeader>
                        <Typography variant="body2" color="textSecondary">
                          {moodSummary}
                          <Typography
                            component="span"
                            sx={{ fontWeight: 600, color: theme.palette.primary.dark, ml: 0.5 }}
                          >
                            {moodEntries.length > 0 &&
                              parseFloat(
                                moodEntries.sort(
                                  (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                                )[moodEntries.length - 1].mood
                              ).toFixed(1)}{' '}
                            / 5
                          </Typography>
                        </Typography>
                      </MoodHeader>
                      <ChartContainer>
                        {moodLoading ? (
                          <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '12px' }} />
                        ) : moodChartData && moodChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={moodChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                              <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                              <YAxis stroke={theme.palette.text.secondary} domain={[1, 5]} />
                              <ChartTooltip contentStyle={{ backgroundColor: theme.palette.background.paper }} />
                              <Area type="monotone" dataKey="mood" stroke={theme.palette.primary.main} fill={alpha(theme.palette.primary.main, 0.2)} />
                              <Brush dataKey="name" startIndex={chartBrushStartIndex} height={20} stroke={theme.palette.primary.main} onChange={({ startIndex, endIndex }) => handleBrushChange(startIndex, endIndex)} />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : null}
                      </ChartContainer>
                      <CardActions sx={{ justifyContent: 'space-between', padding: theme.spacing(1) }}>
                        <SubtleButton
                          size="small"
                          onClick={() => navigate('/mood-tracker')}
                          startIcon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                          style={{ fontSize: '0.8rem' }}
                        >
                          View Mood History
                        </SubtleButton>
                      </CardActions>
                    </DashboardCard>
                  </motion.div>
                </Grid>

                {/* AI Chat Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <DashboardCard
                      cardcolor={theme.palette.secondary.main}
                      bggradient={`linear-gradient(135deg, ${alpha(
                        theme.palette.secondary.main,
                        0.05
                      )} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`}
                    >
                      <WidgetTitle>
                        <ChatIcon sx={{ fontSize: '1.2rem', color: theme.palette.secondary.light }} />
                        AI Chat
                      </WidgetTitle>
                      <CardContent
                        sx={{
                          height: isMobile ? 'auto' : 240,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        {chatLoading ? (
                          <Box
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            alignItems="center"
                            height={240}
                          >
                            <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: '12px', mb: 2 }} />
                            <Skeleton variant="rectangular" width="100%" height={30} sx={{ borderRadius: '12px', mb: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={30} sx={{ borderRadius: '12px' }} />
                          </Box>
                        ) : latestChatsPreview &&
                          latestChatsPreview.length > 0 &&
                          !(latestChatsPreview.length === 1 && latestChatsPreview[0].text.includes('No chat messages yet')) ? (
                          <>
                            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                              Recent chats:
                            </Typography>
                            <ChatListScrollableBox style={{ maxHeight: '100px' }}>
                              <List dense>
                                {latestChatsPreview.map((chat, index) =>
                                  chat.text !== 'No chat messages yet. Start a conversation!' ? (
                                    <ListItem key={index} sx={{ padding: '6px 0' }}>
                                      <ListItemText
                                        primary={`${chat.sender} ${chat.text}`}
                                        secondary={chat.time}
                                        primaryTypographyProps={{
                                          sx: {
                                            fontSize: '0.9rem',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                          },
                                        }}
                                        secondaryTypographyProps={{
                                          variant: 'caption',
                                          sx: { fontSize: '0.8rem' },
                                        }}
                                      />
                                    </ListItem>
                                  ) : null
                                )}
                              </List>
                            </ChatListScrollableBox>
                            <CardActions sx={{ justifyContent: 'space-between', padding: theme.spacing(1) }}>
                              <SubtleButton
                                size="small"
                                onClick={() => navigate('/chat')}
                                startIcon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                                style={{ fontSize: '0.8rem' }}
                              >
                                Go to Chat
                              </SubtleButton>
                              <GradientButton
                                size="small"
                                onClick={() => navigate('/chat')}
                                startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                                style={{ fontSize: '0.8rem' }}
                              >
                                New Chat
                              </GradientButton>
                            </CardActions>
                          </>
                        ) : (
                          <Box
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            alignItems="center"
                            height={240}
                            textAlign="center"
                            px={2}
                          >
                            <ChatIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body1" color="textSecondary" sx={{ fontSize: '0.9rem' }}>
                              Ready to explore your thoughts and feelings?
                            </Typography>
                            <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                              <GradientButton
                                size="small"
                                onClick={() => navigate('/chat')}
                                startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                                style={{ fontSize: '0.8rem' }}
                              >
                                Start Chatting
                              </GradientButton>
                            </CardActions>
                          </Box>
                        )}
                      </CardContent>
                    </DashboardCard>
                  </motion.div>
                </Grid>

                {/* Recent Activities Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <DashboardCard
                      cardcolor={theme.palette.success.main}
                      bggradient={`linear-gradient(135deg, ${alpha(
                        theme.palette.success.main,
                        0.05
                      )} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`}
                    >
                      <WidgetTitle>
                        <AssignmentIcon sx={{ fontSize: '1.2rem', color: theme.palette.success.light }} />
                        Recent Activities
                      </WidgetTitle>
                      <CardContent
                        sx={{
                          height: isMobile ? 'auto' : 240,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        {activityLoading ? (
                          <Box
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            alignItems="center"
                            height={240}
                          >
                            <Skeleton variant="rectangular" width="100%" height={100} sx={{ borderRadius: '12px', mb: 2 }} />
                            <Skeleton variant="rectangular" width="100%" height={30} sx={{ borderRadius: '12px' }} />
                          </Box>
                        ) : recentActivities &&
                          recentActivities.length > 0 &&
                          !(recentActivities.length === 1 && recentActivities[0].text.includes('No activities logged yet')) ? (
                          <>
                            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                              Your recent activities:
                            </Typography>
                            <List dense>
                              {recentActivities.map((activity, index) =>
                                activity.text !== 'No activities logged yet. Start logging your daily activities!' ? (
                                  <ActivityListItem key={index}>
                                    <ListItemText
                                      primary={activity.text}
                                      secondary={activity.time}
                                      primaryTypographyProps={{ sx: { fontSize: '0.9rem' } }}
                                      secondaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.8rem' } }}
                                    />
                                  </ActivityListItem>
                                ) : null
                              )}
                            </List>
                            <CardActions sx={{ justifyContent: 'flex-end', padding: theme.spacing(1) }}>
                              <SubtleButton
                                size="small"
                                onClick={() => navigate('/activity-logging')}
                                startIcon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                                style={{ fontSize: '0.8rem' }}
                              >
                                See All Activities
                              </SubtleButton>
                            </CardActions>
                          </>
                        ) : (
                          <Box
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            alignItems="center"
                            height={240}
                            textAlign="center"
                            px={2}
                          >
                            <AssignmentIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body1" color="textSecondary" sx={{ fontSize: '0.9rem' }}>
                              Log your daily activities to reflect on your day and habits.
                            </Typography>
                            <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                              <GradientButton
                                size="small"
                                onClick={() => navigate('/activity-logging')}
                                startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                                style={{ fontSize: '0.8rem' }}
                              >
                                Add Activity
                              </GradientButton>
                            </CardActions>
                          </Box>
                        )}
                      </CardContent>
                    </DashboardCard>
                  </motion.div>
                </Grid>

                {/* Sleep Quality Monitor Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <DashboardCard
                      cardcolor={theme.palette.info.main}
                      bggradient={`linear-gradient(135deg, ${alpha(
                        theme.palette.info.main,
                        0.05
                      )} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`}
                    >
                      <WidgetTitle>Sleep Quality</WidgetTitle>
                      <CardContent
                        sx={{
                          height: isMobile ? 'auto' : 240,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        {sleepLoading ? (
                          <Box
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            alignItems="center"
                            height={240}
                          >
                            <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: '12px', mb: 2 }} />
                            <Skeleton variant="rectangular" width="100%" height={30} sx={{ borderRadius: '12px' }} />
                          </Box>
                        ) : sleepLogs && sleepLogs.length > 0 ? (
                          <>
                            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontSize: '0.9rem' }}>
                              Sleep insights:
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2, fontSize: '0.9rem' }}>
                              {sleepInsight}
                            </Typography>
                            <CardActions sx={{ justifyContent: 'flex-end', padding: theme.spacing(1) }}>
                              <SubtleButton
                                size="small"
                                onClick={() => navigate('/sleep-tracker')}
                                startIcon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                                style={{ fontSize: '0.8rem' }}
                              >
                                View Sleep Data
                              </SubtleButton>
                            </CardActions>
                          </>
                        ) : (
                          <Box
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            alignItems="center"
                            height={240}
                            textAlign="center"
                            px={2}
                          >
                            <BedtimeIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body1" color="textSecondary" sx={{ fontSize: '0.9rem' }}>
                              Track your sleep to understand your rest and energy levels.
                            </Typography>
                            <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                              <GradientButton
                                size="small"
                                onClick={() => navigate('/sleep-tracker')}
                                startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                                style={{ fontSize: '0.8rem' }}
                              >
                                Track Sleep
                              </GradientButton>
                            </CardActions>
                          </Box>
                        )}
                      </CardContent>
                    </DashboardCard>
                  </motion.div>
                </Grid>

                {/* Daily Affirmation Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <DashboardCard
                      cardcolor={theme.palette.warning.main}
                      bggradient={`linear-gradient(135deg, ${alpha(
                        theme.palette.warning.main,
                        0.05
                      )} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`}
                    >
                      <WidgetTitle>
                        <LightbulbIcon sx={{ fontSize: '1.2rem', color: theme.palette.warning.light }} />
                        Daily Affirmation
                      </WidgetTitle>
                      <CardContent
                        sx={{
                          height: isMobile ? 'auto' : 240,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <FavoriteIcon color="secondary" sx={{ fontSize: 40, mb: 2 }} />
                        <Typography variant="subtitle1" sx={{ fontStyle: 'italic', textAlign: 'center', fontSize: '1rem' }}>
                          "{affirmation}"
                        </Typography>
                        <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                          <SubtleButton
                            size="small"
                            onClick={() => setAffirmation(DailyAffirmations.getRandomAffirmation())}
                            sx={{ fontSize: '0.8rem' }}
                          >
                            Another Affirmation
                          </SubtleButton>
                        </CardActions>
                      </CardContent>
                    </DashboardCard>
                  </motion.div>
                </Grid>

                {/* Quick Breathe Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <DashboardCard
                      cardcolor={theme.palette.info.main}
                      bggradient={`linear-gradient(135deg, ${alpha(
                        theme.palette.info.main,
                        0.05
                      )} 0%, ${alpha(theme.palette.info.main, 0.1)} 100%)`}
                    >
                      <WidgetTitle>
                        <PsychologyAltIcon sx={{ fontSize: '1.2rem', color: theme.palette.info.light }} />
                        Quick Breathe
                      </WidgetTitle>
                      <CardContent
                        sx={{
                          height: isMobile ? 'auto' : 240,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <BreathingExerciseWidget />
                      </CardContent>
                    </DashboardCard>
                  </motion.div>
                </Grid>

                {/* Inspiration Reels Widget */}
                <Grid item xs={12}>
                  <motion.div variants={widgetItemVariants}>
                    <DashboardCard
                      cardcolor={theme.palette.error.main}
                      bggradient={`linear-gradient(135deg, ${alpha(
                        theme.palette.error.main,
                        0.05
                      )} 0%, ${alpha(theme.palette.error.main, 0.1)} 100%)`}
                    >
                      <WidgetTitle>
                        <FavoriteIcon sx={{ fontSize: '1.2rem', color: theme.palette.error.light }} />
                        Inspiration Reels
                      </WidgetTitle>
                      <CardContent
                        sx={{
                          height: isMobile ? 'auto' : 240,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="body1" color="textSecondary" sx={{ fontSize: '1rem', mb: 2 }}>
                          {reelsSectionText}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'center', padding: theme.spacing(1) }}>
                        <GradientButton
                          size="small"
                          onClick={() => navigate('/reels')}
                          startIcon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                          style={{ fontSize: '0.8rem' }}
                        >
                          Watch Reels
                        </GradientButton>
                      </CardActions>
                    </DashboardCard>
                  </motion.div>
                </Grid>

                {/* Feeling Overwhelmed? Widget */}
                <Grid item xs={12}>
                  <motion.div variants={widgetItemVariants}>
                    <DashboardCard
                      cardcolor={theme.palette.error.main}
                      bggradient={`linear-gradient(135deg, ${alpha(
                        theme.palette.error.main,
                        0.05
                      )} 0%, ${alpha(theme.palette.error.main, 0.1)} 100%)`}
                    >
                      <WidgetTitle variant="h6">Feeling Overwhelmed?</WidgetTitle>
                      <CardContent
                        sx={{
                          height: isMobile ? 'auto' : 240,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <PsychologyAltIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body1" color="textSecondary" sx={{ fontSize: '0.9rem', mb: 2, px: 2 }}>
                          Life can be challenging, and seeking support is a sign of strength.
                          If you're feeling overwhelmed, connecting with a therapist can provide a safe
                          space to explore your feelings and develop coping strategies.
                        </Typography>
                        <CardActions sx={{ justifyContent: 'center' }}>
                          <GradientButton
                            size="small"
                            onClick={() => navigate('/therapist-recommendations')}
                            startIcon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                            style={{ fontSize: '0.8rem' }}
                          >
                            Find Support Near You
                          </GradientButton>
                        </CardActions>
                      </CardContent>
                    </DashboardCard>
                  </motion.div>
                </Grid>

                {/* Daily Insight Widget */}
                <Grid item xs={12}>
                  <motion.div variants={widgetItemVariants}>
                    <DashboardCard
                      cardcolor={theme.palette.primary.main}
                      bggradient={`linear-gradient(135deg, ${alpha(
                        theme.palette.primary.main,
                        0.05
                      )} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`}
                    >
                      <WidgetTitle variant="h6">Daily Insight</WidgetTitle>
                      <CardContent sx={{ height: isMobile ? 'auto' : 240 }}>
                        {insightHighlight ? (
                          <>
                            <Box display="flex" alignItems="center" mb={2}>
                              <LightbulbIcon color="secondary" sx={{ mr: 1, fontSize: '1.8rem' }} />
                              <Typography variant="h6" fontWeight="bold" color="secondary" sx={{ fontSize: '1rem' }}>
                                {insightHighlight}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.9rem' }}>
                              Tap below for more personalized insights and tips to enhance your mental well-being.
                            </Typography>
                            <CardActions sx={{ justifyContent: 'flex-end', padding: theme.spacing(1) }}>
                              <SubtleButton
                                size="small"
                                onClick={() => navigate('/insights')}
                                startIcon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                                style={{ fontSize: '0.8rem' }}
                              >
                                Get More Insights
                              </SubtleButton>
                            </CardActions>
                          </>
                        ) : (
                          <Box
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            alignItems="center"
                            height={240}
                            textAlign="center"
                            px={2}
                          >
                            <InsightsIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body1" color="textSecondary" sx={{ fontSize: '0.9rem' }}>
                              Unlock personalized guidance by tracking your mood and activities.
                            </Typography>
                            <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                              <GradientButton
                                size="small"
                                onClick={() => navigate('/insights')}
                                startIcon={<InsightsIcon sx={{ fontSize: '1rem' }} />}
                                style={{ fontSize: '0.8rem' }}
                              >
                                Explore Insights
                              </GradientButton>
                            </CardActions>
                          </Box>
                        )}
                      </CardContent>
                    </DashboardCard>
                  </motion.div>
                </Grid>
              </MobileGrid>
            </motion.div>
          </Container>
        </MainContent>
        
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ 
            vertical: isMobile ? 'bottom' : 'bottom',
            horizontal: isMobile ? 'center' : 'center'
          }}
          sx={{
            bottom: isMobile ? '80px !important' : '24px',
          }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbarSeverity} 
            sx={{ 
              width: '100%',
              borderRadius: isMobile ? '16px' : '8px',
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </PageLayout>
    </DashboardContainer>
  );
};

export default DashboardPage;