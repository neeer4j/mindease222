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
  CardActions,
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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/system';
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
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: '12px',
  padding: '10px 22px',
  boxShadow: theme.shadows[4],
  transition: 'background 0.4s ease-out, box-shadow 0.3s ease-out, transform 0.3s ease-out',
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
  transition: 'background-color 0.3s ease-out, color 0.3s ease-out, transform 0.2s ease-out',
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
}));

const HeroSectionCard = styled(Card)(({ theme, variant = 'default' }) => {
  let backgroundColor = theme.palette.background.paper;
  let textColor = theme.palette.text.primary;
  if (variant === 'primary') {
    backgroundColor = theme.palette.primary.light;
    textColor = theme.palette.primary.contrastText;
  } else if (variant === 'secondary') {
    backgroundColor = theme.palette.secondary.light;
    textColor = theme.palette.secondary.contrastText;
  } else if (variant === 'tertiary') {
    backgroundColor = theme.palette.info.light;
    textColor = theme.palette.info.contrastText;
  }
  return {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(3),
    borderRadius: '24px',
    background: backgroundColor,
    color: textColor,
    boxShadow: theme.shadows[3],
    backdropFilter: 'blur(8px)',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.3s ease-out, color 0.3s ease-out',
    position: 'relative',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      textAlign: 'center',
      alignItems: 'center',
    },
  };
});

const HeroAvatar = styled(Avatar)(({ theme, variant = 'default' }) => {
  let borderColor = theme.palette.divider;
  if (variant === 'primary') {
    borderColor = theme.palette.primary.dark;
  } else if (variant === 'secondary') {
    borderColor = theme.palette.secondary.dark;
  } else if (variant === 'tertiary') {
    borderColor = theme.palette.info.dark;
  }
  return {
    width: theme.spacing(9),
    height: theme.spacing(9),
    marginRight: theme.spacing(3),
    border: `2px solid ${borderColor}`,
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(2),
      marginRight: 0,
    },
  };
});

const HeroTextContainer = styled(Box)({
  textAlign: 'left',
  flexGrow: 1,
});

const HeroGreeting = styled(Typography)(({ theme, variant = 'default' }) => ({
  fontWeight: 800,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
  lineHeight: 1.2,
  ...(variant !== 'default' && { color: theme.palette.getContrastText(theme.palette[variant].light) }),
}));

const HeroQuote = styled(Typography)(({ theme, variant = 'default' }) => ({
  fontStyle: 'italic',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
  lineHeight: 1.4,
  ...(variant !== 'default' && { color: theme.palette.getContrastText(theme.palette[variant].light) }),
}));

const HeroSubtitle = styled(Typography)(({ theme, variant = 'default' }) => ({
  color: theme.palette.text.secondary,
  fontSize: '1rem',
  ...(variant !== 'default' && { color: theme.palette.getContrastText(theme.palette[variant].light) }),
}));

const WidgetCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: '24px',
  boxShadow: theme.shadows[3],
  overflow: 'hidden',
  transition: 'box-shadow 0.3s ease-out, transform 0.3s ease-out',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-6px)',
  },
}));

const WidgetTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.text.primary,
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  fontSize: '1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const MoodHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  textAlign: 'center',
  backgroundColor: theme.palette.background.paper,
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(1),
  height: 160,
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
    background: theme.palette.background.paper,
    borderRadius: '12px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: '12px',
    border: `1px solid ${theme.palette.background.paper}`,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const ActivityListItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1, 0),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderRadius: '8px',
  },
}));

const DashboardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minHeight: '100vh',
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
          showSnackbar("Location access denied.", "warning");
          setIsRefreshing(false);
        }
      );
    } else {
      setLocationErrorState("Geolocation is not supported by this browser.");
      showSnackbar("Geolocation not supported.", "error");
      setIsRefreshing(false);
    }
  };

  // Removed auto-fetch on mount; therapists are fetched manually via refresh

  useEffect(() => {
    if (therapistError) {
      showSnackbar(therapistError, "error");
    }
  }, [therapistError, showSnackbar]);

  // Handle manual refresh for therapists
  const handleRefresh = () => {
    clearTherapists();
    fetchData(true);
    showSnackbar("Therapist recommendations refreshed.", "info");
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Open details dialog for the selected therapist.
  const handleDetailsClick = (therapist) => {
    setSelectedTherapist(therapist);
    setDialogOpen(true);
  };

  // Close the details dialog.
  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTherapist(null);
  };

  return (
    <DashboardContainer>
      <PageLayout>
        <MainContent variants={mainContentVariants} initial="hidden" animate="visible">
          <Container maxWidth="lg" sx={{ paddingBottom: theme.spacing(3) }}>
            {/* Hero Section */}
            <motion.div variants={widgetItemVariants}>
              <HeroSectionCard variant="primary">
                <motion.div style={{ display: 'flex', alignItems: 'center' }}>
                  <HeroAvatar alt={userName} src={userAvatarUrl} variant="primary" />
                  <HeroTextContainer>
                    <HeroGreeting variant="primary" component="h1">
                      {timeOfDayGreeting}, {userName},
                    </HeroGreeting>
                    <HeroQuote variant="primary">"{heroQuote}"</HeroQuote>
                    <HeroSubtitle variant="primary" color="textSecondary">
                      Here's your daily overview for a calmer, clearer mind.
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
              <Grid container spacing={isMobile ? 2 : 3}>
                {/* Mood Summary Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <WidgetCard>
                      <WidgetTitle variant="h6">Mood Summary</WidgetTitle>
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
                              <defs>
                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                                  <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" style={{ fontSize: '0.8rem' }} />
                              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} style={{ fontSize: '0.8rem' }} />
                              <ChartTooltip
                                contentStyle={{ background: theme.palette.background.paper }}
                                itemStyle={{ color: theme.palette.text.primary }}
                                labelStyle={{ color: theme.palette.text.secondary }}
                                formatter={(value) => value}
                              />
                              <Area
                                type="monotone"
                                dataKey="mood"
                                stroke={theme.palette.primary.main}
                                fillOpacity={1}
                                fill="url(#colorMood)"
                              />
                              <Brush
                                startIndex={chartBrushStartIndex}
                                onChange={handleBrushChange}
                                height={20}
                                stroke={theme.palette.primary.light}
                                travellerWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            No mood data available.
                          </Typography>
                        )}
                      </ChartContainer>
                      <CardActions sx={{ justifyContent: 'flex-end', padding: theme.spacing(1) }}>
                        <SubtleButton
                          size="small"
                          onClick={() => navigate('/mood-tracker')}
                          startIcon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                          style={{ fontSize: '0.8rem' }}
                        >
                          View Mood History
                        </SubtleButton>
                      </CardActions>
                    </WidgetCard>
                  </motion.div>
                </Grid>

                {/* AI Chat Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <WidgetCard>
                      <WidgetTitle variant="h6">AI Chat</WidgetTitle>
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
                    </WidgetCard>
                  </motion.div>
                </Grid>

                {/* Activity Logging Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <WidgetCard>
                      <WidgetTitle variant="h6">Recent Activities</WidgetTitle>
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
                    </WidgetCard>
                  </motion.div>
                </Grid>

                {/* Sleep Quality Monitor Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <WidgetCard>
                      <WidgetTitle variant="h6">Sleep Quality</WidgetTitle>
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
                    </WidgetCard>
                  </motion.div>
                </Grid>

                {/* Daily Affirmation Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <WidgetCard>
                      <WidgetTitle variant="h6">Daily Affirmation</WidgetTitle>
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
                    </WidgetCard>
                  </motion.div>
                </Grid>

                {/* Breathing Exercise Widget */}
                <Grid item xs={12} md={4}>
                  <motion.div variants={widgetItemVariants}>
                    <WidgetCard>
                      <WidgetTitle variant="h6">Quick Breathe</WidgetTitle>
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
                    </WidgetCard>
                  </motion.div>
                </Grid>

                {/* Inspiration Reels Widget */}
                <Grid item xs={12}>
                  <motion.div variants={widgetItemVariants}>
                    <WidgetCard>
                      <WidgetTitle variant="h6">Inspiration Reels</WidgetTitle>
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
                    </WidgetCard>
                  </motion.div>
                </Grid>

                {/* Feeling Overwhelmed? Widget */}
                <Grid item xs={12}>
                  <motion.div variants={widgetItemVariants}>
                    <WidgetCard>
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
                    </WidgetCard>
                  </motion.div>
                </Grid>

                {/* Daily Insight Widget */}
                <Grid item xs={12}>
                  <motion.div variants={widgetItemVariants}>
                    <WidgetCard>
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
                    </WidgetCard>
                  </motion.div>
                </Grid>
              </Grid>
            </motion.div>
          </Container>
        </MainContent>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </PageLayout>
    </DashboardContainer>
  );
};

export default DashboardPage;
