// src/pages/Insights.jsx

import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  useTheme,
  useMediaQuery,
  Paper,
  Alert,
  CircularProgress,
  TextField,
  Button,
  Collapse,
  Tooltip,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  Title,
  Filler,
} from 'chart.js';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import 'chartjs-adapter-date-fns';
import { MoodContext } from '../contexts/MoodContext';
import { ActivityContext } from '../contexts/ActivityContext';
import { SleepContext } from '../contexts/SleepContext';
import zoomPlugin from 'chartjs-plugin-zoom';
import FilterListIcon from '@mui/icons-material/FilterList';
import PageLayout from '../components/PageLayout';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTooltip,
  Legend,
  Title,
  Filler,
  zoomPlugin
);

// Animation Variants for Consistent Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
  exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

const Insights = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Contexts (with defaults)
  const { moodEntries = [], loading: moodLoading, error: moodError } = useContext(MoodContext);
  const { activities = [], loading: activityLoading, error: activityError } = useContext(ActivityContext);
  const { sleepLogs = [], loading: sleepLoading, error: sleepError } = useContext(SleepContext);

  // State for Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);

  // Toggle Filter Section
  const [showFilters, setShowFilters] = useState(false);

  // AI Generated Insights States
  const [aiInsights, setAiInsights] = useState('');
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState('');

  // Chart refs for resetting zoom
  const moodOverTimeRef = useRef(null);
  const sleepDurationOverTimeRef = useRef(null);

  // Initialize the Gemini AI model using the API key
  const genAI = useMemo(() => new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY2), []);
  const aiModel = useMemo(() => genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }), [genAI]);

  // Handle Activity Selection using Chips
  const handleActivityChange = (event) => {
    const activityTitle = event.target.name;
    if (selectedActivities.includes(activityTitle)) {
      setSelectedActivities(selectedActivities.filter(item => item !== activityTitle));
    } else {
      setSelectedActivities([...selectedActivities, activityTitle]);
    }
  };

  // Apply Filters to Data
  const filteredMoodEntries = useMemo(() => {
    return moodEntries.filter(entry => {
      const entryDate = parseISO(entry.timestamp);
      const isAfterStart = startDate ? entryDate >= parseISO(startDate) : true;
      const isBeforeEnd = endDate ? entryDate <= parseISO(endDate) : true;
      return isAfterStart && isBeforeEnd;
    });
  }, [moodEntries, startDate, endDate]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const activityDate = parseISO(activity.date);
      const isAfterStart = startDate ? activityDate >= parseISO(startDate) : true;
      const isBeforeEnd = endDate ? activityDate <= parseISO(endDate) : true;
      const isSelected = selectedActivities.length > 0 ? selectedActivities.includes(activity.title) : true;
      return isAfterStart && isBeforeEnd && isSelected;
    });
  }, [activities, startDate, endDate, selectedActivities]);

  const filteredSleepLogs = useMemo(() => {
    return sleepLogs.filter(log => {
      const logDate = parseISO(log.timestamp);
      const isAfterStart = startDate ? logDate >= parseISO(startDate) : true;
      const isBeforeEnd = endDate ? logDate <= parseISO(endDate) : true;
      return isAfterStart && isBeforeEnd;
    });
  }, [sleepLogs, startDate, endDate]);

  // Prepare Data for Mood Over Time Chart
  const moodOverTimeData = useMemo(() => {
    const moodMap = {};
    filteredMoodEntries.forEach(entry => {
      const date = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
      moodMap[date] ? moodMap[date].push(entry.mood) : (moodMap[date] = [entry.mood]);
    });
    const labels = Object.keys(moodMap).sort();
    const data = labels.map(date => {
      const moods = moodMap[date];
      const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
      return parseFloat(avgMood.toFixed(2));
    });
    return {
      labels: labels.map(date => format(new Date(date), 'MMM d')),
      datasets: [
        {
          label: 'Average Mood',
          data,
          fill: true,
          backgroundColor: 'rgba(75,192,192,0.2)',
          borderColor: theme.palette.primary.main,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }, [filteredMoodEntries, theme.palette.primary]);

  const moodOverTimeOptions = {
    responsive: true,
    plugins: {
      legend: { position: isSmallScreen ? 'bottom' : 'top' },
      title: { display: true, text: 'Mood Over Time' },
      tooltip: { callbacks: { label: context => `${context.parsed.y} ⭐` } },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
      },
    },
    scales: {
      y: { min: 1, max: 5, ticks: { stepSize: 1, callback: value => `${value} ⭐` } },
      x: { type: 'category', ticks: { maxTicksLimit: 10 } },
    },
    maintainAspectRatio: false,
  };

  // Prepare Data for Activity Frequency Chart
  const activityFrequencyData = useMemo(() => {
    const activityCount = {};
    filteredActivities.forEach(activity => {
      activityCount[activity.title] = (activityCount[activity.title] || 0) + 1;
    });
    const labels = Object.keys(activityCount);
    const data = labels.map(title => activityCount[title]);
    return {
      labels,
      datasets: [
        {
          label: 'Number of Activities',
          data,
          backgroundColor: theme.palette.primary.light,
          borderColor: theme.palette.primary.main,
          borderWidth: 1,
        },
      ],
    };
  }, [filteredActivities, theme.palette.primary]);

  const activityFrequencyOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Activity Frequency' },
      tooltip: { callbacks: { label: context => `${context.parsed.y} activities` } },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
      },
    },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    maintainAspectRatio: false,
  };

  // Prepare Data for Mood vs. Activity Correlation (Scatter Chart)
  const moodActivityCorrelationData = useMemo(() => {
    const activityMap = {};
    filteredActivities.forEach(activity => {
      const date = format(parseISO(activity.date), 'yyyy-MM-dd');
      activityMap[date] ? activityMap[date].push(activity.title) : (activityMap[date] = [activity.title]);
    });
    const scatterData = [];
    filteredMoodEntries.forEach(entry => {
      const date = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
      const associatedActivities = activityMap[date] || [];
      associatedActivities.forEach(activityTitle => {
        scatterData.push({ x: activityTitle, y: entry.mood });
      });
    });
    return {
      datasets: [
        {
          label: 'Mood vs. Activity',
          data: scatterData,
          backgroundColor: theme.palette.secondary.main,
        },
      ],
    };
  }, [filteredMoodEntries, filteredActivities, theme.palette.secondary]);

  const moodActivityCorrelationOptions = {
    responsive: true,
    plugins: {
      legend: { position: isSmallScreen ? 'bottom' : 'top' },
      title: { display: true, text: 'Mood vs. Activity Correlation' },
      tooltip: { callbacks: { label: context => `${context.parsed.y} ⭐` } },
      zoom: {
        pan: { enabled: true, mode: 'xy' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
      },
    },
    scales: {
      x: { type: 'category', title: { display: true, text: 'Activities' } },
      y: { min: 1, max: 5, title: { display: true, text: 'Mood Level' }, ticks: { stepSize: 1, callback: value => `${value} ⭐` } },
    },
    maintainAspectRatio: false,
  };

  // Prepare Data for Sleep Duration Over Time Chart
  const sleepDurationOverTimeData = useMemo(() => {
    const sleepDurationMap = {};
    filteredSleepLogs.forEach(log => {
      const date = format(parseISO(log.timestamp), 'yyyy-MM-dd');
      const startTime = parseISO(log.startTime);
      const endTime = parseISO(log.endTime);
      const durationMinutes = differenceInMinutes(endTime, startTime);
      sleepDurationMap[date] ? sleepDurationMap[date].push(durationMinutes) : (sleepDurationMap[date] = [durationMinutes]);
    });
    const labels = Object.keys(sleepDurationMap).sort();
    const data = labels.map(date => {
      const durations = sleepDurationMap[date];
      const avgDurationMinutes = durations.reduce((a, b) => a + b, 0) / durations.length;
      const avgDurationHours = avgDurationMinutes / 60;
      return parseFloat(avgDurationHours.toFixed(2));
    });
    return {
      labels: labels.map(date => format(new Date(date), 'MMM d')),
      datasets: [
        {
          label: 'Average Sleep Duration (Hours)',
          data,
          fill: false,
          borderColor: theme.palette.secondary.main,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }, [filteredSleepLogs, theme.palette.secondary]);

  const sleepDurationOverTimeOptions = {
    responsive: true,
    plugins: {
      legend: { position: isSmallScreen ? 'bottom' : 'top' },
      title: { display: true, text: 'Average Sleep Duration Over Time' },
      tooltip: { callbacks: { label: context => `${context.parsed.y} Hours` } },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
      },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Hours' } },
      x: { type: 'category', ticks: { maxTicksLimit: 10 } },
    },
    maintainAspectRatio: false,
  };

  // Prepare Summary Statistics (using filtered data)
  const summaryStatistics = useMemo(() => {
    const totalMoods = filteredMoodEntries.length;
    const moodSum = filteredMoodEntries.reduce((sum, entry) => sum + (entry.mood || 0), 0);
    const averageMood = totalMoods > 0 ? (moodSum / totalMoods).toFixed(2) : 'N/A';
    const totalActivities = filteredActivities.length;
    const totalSleepLogs = filteredSleepLogs.length;
    return { totalMoods, averageMood, totalActivities, totalSleepLogs };
  }, [filteredMoodEntries, filteredActivities, filteredSleepLogs]);

  // Determine if Charts Have Data
  const hasMoodOverTimeData = useMemo(() => {
    return (
      moodOverTimeData.labels?.length > 0 &&
      moodOverTimeData.datasets?.[0].data?.length > 0
    );
  }, [moodOverTimeData]);

  const hasActivityFrequencyData = useMemo(() => {
    return (
      activityFrequencyData.labels?.length > 0 &&
      activityFrequencyData.datasets?.[0].data?.length > 0
    );
  }, [activityFrequencyData]);

  const hasMoodActivityCorrelationData = useMemo(() => {
    return (
      moodActivityCorrelationData.datasets?.[0].data?.length > 0
    );
  }, [moodActivityCorrelationData]);

  const hasSleepDurationOverTimeData = useMemo(() => {
    return (
      sleepDurationOverTimeData.labels?.length > 0 &&
      sleepDurationOverTimeData.datasets?.[0].data?.length > 0
    );
  }, [sleepDurationOverTimeData]);

  // ---- AI Generated Insights with Caching ----

  // Function to fetch insights and update cache after a successful fetch.
  const fetchAiInsights = async () => {
    if (summaryStatistics.totalMoods === 0) return;
    setAiInsightsLoading(true);
    setAiInsightsError('');
    try {
      const prompt = `
You are an expert mental health analyst. Based on the following data, provide a comprehensive and actionable analysis of the user's mental well-being along with suggestions for improvement, always make it short.

**Summary Data:**
- **Total Moods Logged:** ${summaryStatistics.totalMoods}
- **Average Mood:** ${summaryStatistics.averageMood} (scale 1-5)
- **Total Activities Logged:** ${summaryStatistics.totalActivities}
- **Total Sleep Logs:** ${summaryStatistics.totalSleepLogs}

Additionally, consider the trends from the charts:
- *Mood Over Time* shows how the average mood varies day by day.
- *Activity Frequency* indicates which activities are most common.
- *Mood vs. Activity Correlation* shows the relationship between mood levels and specific activities.
- *Sleep Duration Over Time* shows average sleep duration trends.

Please provide insights that help the user understand their overall mental well-being and practical suggestions to maintain or improve it. Use **bold** for emphasis where needed.
      `;
      const chat = aiModel.startChat({ history: [{ role: 'user', parts: [{ text: prompt }] }] });
      const result = await chat.sendMessage('');
      const responseText = await result.response.text();
      setAiInsights(responseText);
      // Update cache with current raw counts and insights.
      const cacheData = {
        aiInsights: responseText,
        moodCount: moodEntries.length,
        activityCount: activities.length,
        sleepCount: sleepLogs.length,
        timestamp: Date.now(),
      };
      localStorage.setItem('aiInsightsCache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAiInsightsError('Failed to generate AI insights.');
    } finally {
      setAiInsightsLoading(false);
    }
  };

  // On initial mount (or when context data is loaded), check if cached insights exist and are valid.
  useEffect(() => {
    if (moodLoading || activityLoading || sleepLoading) return;

    const currentCounts = {
      mood: moodEntries.length,
      activity: activities.length,
      sleep: sleepLogs.length,
    };

    const cached = localStorage.getItem('aiInsightsCache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (
          parsed.moodCount === currentCounts.mood &&
          parsed.activityCount === currentCounts.activity &&
          parsed.sleepCount === currentCounts.sleep
        ) {
          setAiInsights(parsed.aiInsights);
          prevCountsRef.current = currentCounts;
          return;
        }
      } catch (e) {
        console.error('Error parsing cached AI insights:', e);
      }
    }
    if (currentCounts.mood > 0 || currentCounts.activity > 0 || currentCounts.sleep > 0) {
      prevCountsRef.current = currentCounts;
      fetchAiInsights();
    }
  }, [
    moodLoading,
    activityLoading,
    sleepLoading,
    moodEntries.length,
    activities.length,
    sleepLogs.length,
  ]);

  // Use a ref to store previous counts and debounce updates when new logs are added.
  const prevCountsRef = useRef({
    mood: moodEntries.length,
    activity: activities.length,
    sleep: sleepLogs.length,
  });

  useEffect(() => {
    const currentCounts = {
      mood: moodEntries.length,
      activity: activities.length,
      sleep: sleepLogs.length,
    };
    if (
      currentCounts.mood !== prevCountsRef.current.mood ||
      currentCounts.activity !== prevCountsRef.current.activity ||
      currentCounts.sleep !== prevCountsRef.current.sleep
    ) {
      const timer = setTimeout(() => {
        prevCountsRef.current = currentCounts;
        fetchAiInsights();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [moodEntries.length, activities.length, sleepLogs.length, aiModel]);

  // ---- End of AI insights modifications ----

  return (
    <PageLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          minHeight: '100vh',
          background: theme.palette.background.gradient || theme.palette.background.default,
          paddingTop: theme.spacing(8),
          paddingBottom: theme.spacing(10),
          color: theme.palette.text.primary,
        }}
      >
        <Container maxWidth="lg">
          {/* Page Header */}
          <Box textAlign="center" mb={6}>
            <motion.div variants={sectionVariants} initial="hidden" animate="visible">
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component="h1"
                sx={{ fontWeight: 800, color: theme.palette.text.primary }}
                gutterBottom
              >
                Insights & Analytics 📊
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" sx={{ maxWidth: 700, margin: '0 auto' }}>
                Dive deep into your mental well-being with detailed insights and analytics based on your logged moods, activities, and sleep.
              </Typography>
            </motion.div>
          </Box>

          {/* Toggle Filter Button */}
          <Box textAlign="center" mb={2}>
            <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"} placement="top">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setShowFilters(prev => !prev)}
                endIcon={<FilterListIcon />}
                aria-expanded={showFilters}
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                sx={{
                  padding: isMobile ? '6px 12px' : '8px 16px',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  borderColor: theme.palette.primary.light,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              />
            </Tooltip>
          </Box>

          {/* Expandable Filters Section */}
          <Collapse in={showFilters} timeout="auto" unmountOnExit>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: -10 },
                visible: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 },
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ marginBottom: theme.spacing(4) }}
            >
              <Paper
                elevation={2}
                sx={{
                  padding: theme.spacing(2),
                  borderRadius: 2,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Date Range Filters */}
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      margin="dense"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      size="small"
                      margin="dense"
                    />
                  </Grid>
                  {/* Apply Filters Button */}
                  <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        if (moodOverTimeRef.current) {
                          moodOverTimeRef.current.resetZoom();
                        }
                        if (sleepDurationOverTimeRef.current) {
                          sleepDurationOverTimeRef.current.resetZoom();
                        }
                      }}
                      size="small"
                      sx={{
                        padding: isMobile ? '6px 12px' : '8px 16px',
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                      }}
                    >
                      Apply
                    </Button>
                  </Grid>
                  {/* Activity Type Filters */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Filter by Activities:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {activities.map((activity) => (
                        <Chip
                          key={activity.title}
                          label={activity.title}
                          onClick={handleActivityChange}
                          name={activity.title}
                          color={selectedActivities.includes(activity.title) ? "primary" : "default"}
                          variant={selectedActivities.includes(activity.title) ? "contained" : "outlined"}
                          size="small"
                          sx={{
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.05)' },
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Collapse>

          {/* Loading and Error States */}
          <AnimatePresence>
            {(moodLoading || activityLoading || sleepLoading) && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box textAlign="center" mb={6}>
                  <CircularProgress />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Loading insights...
                  </Typography>
                </Box>
              </motion.div>
            )}
            {(moodError || activityError || sleepError) && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Box mb={6}>
                  <Alert severity="error">{moodError || activityError || sleepError}</Alert>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Insights When Data is Available */}
          {!moodLoading && !activityLoading && !sleepLoading && !moodError && !activityError && !sleepError && (
            <>
              {/* Summary Statistics Section */}
              <motion.div variants={sectionVariants} initial="hidden" animate="visible" style={{ marginBottom: theme.spacing(6) }}>
                <Grid container spacing={4} justifyContent="center">
                  {[
                    {
                      label: 'Total Moods Logged',
                      value: summaryStatistics.totalMoods,
                      color: theme.palette.primary.main,
                    },
                    {
                      label: 'Average Mood',
                      value: `${summaryStatistics.averageMood} ⭐`,
                      color: theme.palette.primary.main,
                    },
                    {
                      label: 'Total Activities Logged',
                      value: summaryStatistics.totalActivities,
                      color: theme.palette.primary.main,
                    },
                    {
                      label: 'Total Sleep Logs',
                      value: summaryStatistics.totalSleepLogs,
                      color: theme.palette.secondary.main,
                    },
                  ].map((stat, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                      <Paper
                        elevation={2}
                        sx={{
                          padding: theme.spacing(2),
                          textAlign: 'center',
                          borderRadius: 2,
                          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          boxShadow: theme.shadows[3],
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            boxShadow: theme.shadows[8],
                            transform: 'translateY(-6px)',
                          },
                        }}
                      >
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          {stat.label}
                        </Typography>
                        <Typography variant="h4" sx={{ color: stat.color }}>
                          {stat.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>

              {/* Charts Section */}
              <motion.div variants={sectionVariants} initial="hidden" animate="visible">
                <Grid container spacing={6}>
                  {/* Mood Over Time Line Chart */}
                  <Grid item xs={12} lg={6}>
                    <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                      Mood Over Time
                    </Typography>
                    <Box
                      component={Paper}
                      elevation={2}
                      sx={{
                        padding: theme.spacing(2),
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: theme.shadows[3],
                        height: isSmallScreen ? 300 : 400,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-6px)',
                        },
                      }}
                    >
                      {hasMoodOverTimeData ? (
                        <Line
                          ref={moodOverTimeRef}
                          data={moodOverTimeData}
                          options={moodOverTimeOptions}
                          onClick={(event, elements) => {
                            if (elements && elements.length > 0) {
                              const chart = event.chart;
                              const index = elements[0].index;
                              const label = chart.data.labels[index];
                              const value = chart.data.datasets[0].data[index];
                              alert(`Date: ${label}\nAverage Mood: ${value} ⭐`);
                            }
                          }}
                        />
                      ) : (
                        <Typography variant="body1" color="textSecondary" textAlign="center">
                          No mood entries available to display.
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Activity Frequency Bar Chart */}
                  <Grid item xs={12} lg={6}>
                    <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                      Activity Frequency
                    </Typography>
                    <Box
                      component={Paper}
                      elevation={2}
                      sx={{
                        padding: theme.spacing(2),
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: theme.shadows[3],
                        height: isSmallScreen ? 300 : 400,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-6px)',
                        },
                      }}
                    >
                      {hasActivityFrequencyData ? (
                        <Bar
                          data={activityFrequencyData}
                          options={activityFrequencyOptions}
                          onClick={(event, elements) => {
                            if (elements && elements.length > 0) {
                              const chart = event.chart;
                              const index = elements[0].index;
                              const label = chart.data.labels[index];
                              const value = chart.data.datasets[0].data[index];
                              alert(`Activity: ${label}\nCount: ${value}`);
                            }
                          }}
                        />
                      ) : (
                        <Typography variant="body1" color="textSecondary" textAlign="center">
                          No activities available to display.
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Mood vs. Activity Correlation Scatter Chart */}
                  <Grid item xs={12} lg={6}>
                    <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                      Mood vs. Activity Correlation
                    </Typography>
                    <Box
                      component={Paper}
                      elevation={2}
                      sx={{
                        padding: theme.spacing(2),
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: theme.shadows[3],
                        height: isSmallScreen ? 300 : 400,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-6px)',
                        },
                      }}
                    >
                      {hasMoodActivityCorrelationData ? (
                        <Scatter
                          data={moodActivityCorrelationData}
                          options={moodActivityCorrelationOptions}
                          onClick={(event, elements) => {
                            if (elements && elements.length > 0) {
                              const chart = event.chart;
                              const index = elements[0].index;
                              const activity = chart.data.datasets[0].data[index].x;
                              const mood = chart.data.datasets[0].data[index].y;
                              alert(`Activity: ${activity}\nMood: ${mood} ⭐`);
                            }
                          }}
                        />
                      ) : (
                        <Typography variant="body1" color="textSecondary" textAlign="center">
                          No correlation data available to display.
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Sleep Duration Over Time Line Chart */}
                  <Grid item xs={12} lg={6}>
                    <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                      Sleep Duration Over Time
                    </Typography>
                    <Box
                      component={Paper}
                      elevation={2}
                      sx={{
                        padding: theme.spacing(2),
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: theme.shadows[3],
                        height: isSmallScreen ? 300 : 400,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                          transform: 'translateY(-6px)',
                        },
                      }}
                    >
                      {hasSleepDurationOverTimeData ? (
                        <Line
                          ref={sleepDurationOverTimeRef}
                          data={sleepDurationOverTimeData}
                          options={sleepDurationOverTimeOptions}
                          onClick={(event, elements) => {
                            if (elements && elements.length > 0) {
                              const chart = event.chart;
                              const index = elements[0].index;
                              const label = chart.data.labels[index];
                              const value = chart.data.datasets[0].data[index];
                              alert(`Date: ${label}\nAverage Sleep Duration: ${value} Hours`);
                            }
                          }}
                        />
                      ) : (
                        <Typography variant="body1" color="textSecondary" textAlign="center">
                          No sleep data available to display.
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </motion.div>

              {/* Reset Zoom Button */}
              <Box textAlign="center" mt={4}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    if (moodOverTimeRef.current) {
                      moodOverTimeRef.current.resetZoom();
                    }
                    if (sleepDurationOverTimeRef.current) {
                      sleepDurationOverTimeRef.current.resetZoom();
                    }
                  }}
                  sx={{
                    padding: isMobile ? '8px 16px' : '12px 24px',
                    fontSize: isMobile ? '0.875rem' : '1rem',
                  }}
                >
                  Reset Zoom
                </Button>
              </Box>

              {/* AI Generated Insights Section */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                style={{ marginTop: theme.spacing(6) }}
              >
                <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                  AI Generated Insights
                </Typography>
                <Paper
                  elevation={2}
                  sx={{
                    padding: theme.spacing(3),
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: theme.shadows[3],
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: theme.shadows[8],
                      transform: 'translateY(-6px)',
                    },
                  }}
                >
                  {aiInsightsLoading ? (
                    <Box textAlign="center">
                      <CircularProgress />
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        Generating insights...
                      </Typography>
                    </Box>
                  ) : aiInsightsError ? (
                    <Alert severity="error">{aiInsightsError}</Alert>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiInsights}</ReactMarkdown>
                  )}
                </Paper>
              </motion.div>
            </>
          )}
        </Container>
      </motion.div>
    </PageLayout>
  );
};

export default Insights;
