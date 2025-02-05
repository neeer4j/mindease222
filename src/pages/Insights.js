// src/pages/Insights.jsx

import React, { useState, useMemo, useContext, useRef } from 'react';
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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Collapse, // Import Collapse for smoother animation
  IconButton, // Import IconButton for icon button
  Tooltip, // Import Tooltip for better UX
  Chip, // Import Chip for activity selection
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Line,
  Bar,
  Scatter,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip, // Rename Tooltip import from chart.js
  Legend,
  Title,
  Filler,
} from 'chart.js';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import 'chartjs-adapter-date-fns'; // For time-based charts
import { MoodContext } from '../contexts/MoodContext';
import { ActivityContext } from '../contexts/ActivityContext';
import { SleepContext } from '../contexts/SleepContext'; // Import Sleep Context
import zoomPlugin from 'chartjs-plugin-zoom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import ExpandMoreIcon
import FilterListIcon from '@mui/icons-material/FilterList'; // Import FilterListIcon
import PageLayout from '../components/PageLayout';
// Register Chart.js components and plugins
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTooltip, // Use the renamed import here
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
    transition: {
      staggerChildren: 0.2, // Stagger children by 0.2 seconds
    },
  },
  exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
};

// Insights Page Component
const Insights = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Destructure contexts with default empty arrays to prevent undefined errors
  const { moodEntries = [], loading: moodLoading, error: moodError } = useContext(MoodContext);
  const { activities = [], loading: activityLoading, error: activityError } = useContext(ActivityContext);
  const { sleepLogs = [], loading: sleepLoading, error: sleepError } = useContext(SleepContext); // Use SleepContext

  // State for Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedActivities, setSelectedActivities] = useState([]);

  // State to Toggle Filter Section
  const [showFilters, setShowFilters] = useState(false);

  // Initialize refs for charts if needed in future (e.g., to reset zoom)
  const moodOverTimeRef = useRef(null);
  const sleepDurationOverTimeRef = useRef(null);

  // Handle Activity Selection
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
    // Aggregate moods by date
    const moodMap = {};

    filteredMoodEntries.forEach(entry => {
      const date = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
      if (moodMap[date]) {
        moodMap[date].push(entry.mood);
      } else {
        moodMap[date] = [entry.mood];
      }
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
      legend: {
        position: isSmallScreen ? 'bottom' : 'top', // Adjust legend position
      },
      title: {
        display: true,
        text: 'Mood Over Time',
      },
      tooltip: {
        callbacks: {
          label: context => `${context.parsed.y} ⭐`,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
      },
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: value => `${value} ⭐`,
        },
      },
      x: {
        type: 'category',
        ticks: {
          maxTicksLimit: 10,
        },
      },
    },
    maintainAspectRatio: false, // Allows the chart to adjust based on container size
  };

  // Prepare Data for Activity Frequency Chart
  const activityFrequencyData = useMemo(() => {
    const activityCount = {};

    filteredActivities.forEach(activity => {
      if (activityCount[activity.title]) {
        activityCount[activity.title] += 1;
      } else {
        activityCount[activity.title] = 1;
      }
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
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Activity Frequency',
      },
      tooltip: {
        callbacks: {
          label: context => `${context.parsed.y} activities`,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    maintainAspectRatio: false, // Allows the chart to adjust based on container size
  };

  // Prepare Data for Mood vs. Activity Correlation (Scatter Chart)
  const moodActivityCorrelationData = useMemo(() => {
    // Map activities by date
    const activityMap = {};

    filteredActivities.forEach(activity => {
      const date = format(parseISO(activity.date), 'yyyy-MM-dd');
      if (activityMap[date]) {
        activityMap[date].push(activity.title);
      } else {
        activityMap[date] = [activity.title];
      }
    });

    // Prepare scatter data: each point represents an activity with associated mood
    const scatterData = [];

    filteredMoodEntries.forEach(entry => {
      const date = format(parseISO(entry.timestamp), 'yyyy-MM-dd');
      const associatedActivities = activityMap[date] || [];
      associatedActivities.forEach(activityTitle => {
        scatterData.push({
          x: activityTitle,
          y: entry.mood,
        });
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
      legend: {
        position: isSmallScreen ? 'bottom' : 'top', // Adjust legend position
      },
      title: {
        display: true,
        text: 'Mood vs. Activity Correlation',
      },
      tooltip: {
        callbacks: {
          label: context => `${context.parsed.y} ⭐`,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'xy',
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Activities',
        },
      },
      y: {
        min: 1,
        max: 5,
        title: {
          display: true,
          text: 'Mood Level',
        },
        ticks: {
          stepSize: 1,
          callback: value => `${value} ⭐`,
        },
      },
    },
    maintainAspectRatio: false, // Allows the chart to adjust based on container size
  };

  // Prepare Data for Sleep Duration Over Time Chart
  const sleepDurationOverTimeData = useMemo(() => {
    const sleepDurationMap = {};

    filteredSleepLogs.forEach(log => {
      const date = format(parseISO(log.timestamp), 'yyyy-MM-dd');
      const startTime = parseISO(log.startTime);
      const endTime = parseISO(log.endTime);
      // Calculate duration in minutes
      const durationMinutes = differenceInMinutes(endTime, startTime);
      if (sleepDurationMap[date]) {
        sleepDurationMap[date].push(durationMinutes);
      } else {
        sleepDurationMap[date] = [durationMinutes];
      }
    });

    const labels = Object.keys(sleepDurationMap).sort();
    const data = labels.map(date => {
      const durations = sleepDurationMap[date];
      const avgDurationMinutes = durations.reduce((a, b) => a + b, 0) / durations.length;
      // Convert average duration to hours and minutes for display, or just hours as decimal
      const avgDurationHours = avgDurationMinutes / 60;
      return parseFloat(avgDurationHours.toFixed(2)); // Average sleep duration in hours
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
      legend: {
        position: isSmallScreen ? 'bottom' : 'top',
      },
      title: {
        display: true,
        text: 'Average Sleep Duration Over Time',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} Hours`,
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
      },
      x: {
        type: 'category',
        ticks: {
          maxTicksLimit: 10,
        },
      },
    },
    maintainAspectRatio: false, // Allows the chart to adjust based on container size
  };

  // Prepare Summary Statistics
  const summaryStatistics = useMemo(() => {
    const totalMoods = filteredMoodEntries.length;
    const moodSum = filteredMoodEntries.reduce((sum, entry) => sum + (entry.mood || 0), 0); // Extract mood from each entry
    const averageMood = totalMoods > 0 ? (moodSum / totalMoods).toFixed(2) : 'N/A';
    const totalActivities = filteredActivities.length;
    const totalSleepLogs = filteredSleepLogs.length;

    return {
      totalMoods,
      averageMood,
      totalActivities,
      totalSleepLogs, // Add total sleep logs to summary
    };
  }, [filteredMoodEntries, filteredActivities, filteredSleepLogs]);

  // Determine if Charts Have Data
  const hasMoodOverTimeData = useMemo(() => {
    return (
      moodOverTimeData.labels && moodOverTimeData.labels.length > 0 &&
      moodOverTimeData.datasets && moodOverTimeData.datasets.length > 0 &&
      moodOverTimeData.datasets[0].data && moodOverTimeData.datasets[0].data.length > 0
    );
  }, [moodOverTimeData]);

  const hasActivityFrequencyData = useMemo(() => {
    return (
      activityFrequencyData.labels && activityFrequencyData.labels.length > 0 &&
      activityFrequencyData.datasets && activityFrequencyData.datasets.length > 0 &&
      activityFrequencyData.datasets[0].data && activityFrequencyData.datasets[0].data.length > 0
    );
  }, [activityFrequencyData]);

  const hasMoodActivityCorrelationData = useMemo(() => {
    return (
      moodActivityCorrelationData.datasets && moodActivityCorrelationData.datasets.length > 0 &&
      moodActivityCorrelationData.datasets[0].data && moodActivityCorrelationData.datasets[0].data.length > 0
    );
  }, [moodActivityCorrelationData]);

  const hasSleepDurationOverTimeData = useMemo(() => {
    return (
      sleepDurationOverTimeData.labels && sleepDurationOverTimeData.labels.length > 0 &&
      sleepDurationOverTimeData.datasets && sleepDurationOverTimeData.datasets.length > 0 &&
      sleepDurationOverTimeData.datasets[0].data && sleepDurationOverTimeData.datasets[0].data.length > 0
    );
  }, [sleepDurationOverTimeData]);

  return (
    <PageLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{
          minHeight: '100vh',
          background: theme.palette.background.gradient || theme.palette.background.default, // Fallback to default if gradient not defined
          paddingTop: theme.spacing(8),
          paddingBottom: theme.spacing(10),
          color: theme.palette.text.primary, // Ensure text color adapts to theme
        }}
      >
        <Container maxWidth="lg">
          {/* Page Header with Animated Text */}
          <Box textAlign="center" mb={6}>
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component="h1"
                sx={{
                  fontWeight: 800,
                  color: theme.palette.text.primary,
                }}
                gutterBottom
              >
                Insights & Analytics 📊
              </Typography>
              <Typography
                variant="subtitle1"
                color="textSecondary"
                sx={{ maxWidth: 700, margin: '0 auto' }}
              >
                Dive deep into your mental well-being with detailed insights and analytics based on your logged moods, activities, and sleep.
              </Typography>
            </motion.div>
          </Box>

          {/* **Toggle Filter Button** */}
          <Box textAlign="center" mb={2}> {/* Reduced marginBottom */}
            <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"} placement="top">
              <Button
                variant="outlined" // Changed to outlined for a softer look
                color="primary"
                onClick={() => setShowFilters(prev => !prev)}
                endIcon={<FilterListIcon />} // More intuitive filter icon
                aria-expanded={showFilters} // Accessibility
                aria-label={showFilters ? 'Hide filters' : 'Show filters'} // Accessibility
                sx={{
                  padding: isMobile ? '6px 12px' : '8px 16px', // Slightly smaller padding
                  fontSize: isMobile ? '0.8rem' : '0.9rem', // Slightly smaller font size
                  borderColor: theme.palette.primary.light, // Lighter border
                  '&:hover': {
                    borderColor: theme.palette.primary.main, // Darker on hover
                    backgroundColor: theme.palette.action.hover, // Add a subtle background hover effect
                  },
                }}
              >
                {/* {showFilters ? 'Hide Filters' : 'Show Filters'} */} {/* Text removed, icon-based primarily now */}
              </Button>
            </Tooltip>
          </Box>

          {/* **Expandable Filters Section** */}
          <Collapse in={showFilters} timeout="auto" unmountOnExit> {/* Using Collapse for smooth animation */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: -10 }, // Slight upward slide-in
                visible: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -10 }, // Slight upward slide-out
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ marginBottom: theme.spacing(4) }} // Add some margin below the filter section
            >
              <Paper
                elevation={2} // Reduced elevation for a flatter design
                sx={{
                  padding: theme.spacing(2), // Reduced padding inside paper
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
                      InputLabelProps={{
                        shrink: true,
                      }}
                      fullWidth
                      size="small" // Use size="small" for compact fields
                      margin="dense" // Use margin="dense" for tighter spacing
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      fullWidth
                      size="small" // Use size="small" for compact fields
                      margin="dense" // Use margin="dense" for tighter spacing
                    />
                  </Grid>
                  {/* Apply Filters Button */}
                  <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        // Optional: Implement any additional logic when filters are applied
                        // For example, you might reset zoom on charts
                        if (moodOverTimeRef.current) {
                          moodOverTimeRef.current.resetZoom();
                        }
                        if (sleepDurationOverTimeRef.current) {
                          sleepDurationOverTimeRef.current.resetZoom();
                        }
                      }}
                      size="small" // Use size="small" for a more inline button
                      sx={{
                        padding: isMobile ? '6px 12px' : '8px 16px', // Consistent padding
                        fontSize: isMobile ? '0.8rem' : '0.9rem', // Consistent font size
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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}> {/* Chip container */}
                      {activities.map((activity) => (
                        <Chip
                          key={activity.title}
                          label={activity.title}
                          onClick={handleActivityChange}
                          name={activity.title} // Important to pass name for handleActivityChange
                          color={selectedActivities.includes(activity.title) ? "primary" : "default"}
                          variant={selectedActivities.includes(activity.title) ? "contained" : "outlined"} // Visual toggle
                          size="small"
                          sx={{
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.05)',
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Collapse>


          {/* **Handle Loading and Error States** */}
          <AnimatePresence>
            {(moodLoading || activityLoading || sleepLoading) && ( // Add sleepLoading
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Box textAlign="center" mb={6}>
                  <CircularProgress />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Loading insights...
                  </Typography>
                </Box>
              </motion.div>
            )}

            {(moodError || activityError || sleepError) && ( // Add sleepError
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

          {/* **Render Insights Only When Data is Available and Not Loading** */}
          {!moodLoading && !activityLoading && !sleepLoading && !moodError && !activityError && !sleepError && ( // Add sleepLoading, sleepError
            <>
              {/* **Summary Statistics Section** */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                style={{ marginBottom: theme.spacing(6) }}
              >
                <Grid container spacing={4} justifyContent="center">
                  <Grid item xs={12} sm={6} md={3}> {/* Adjusted Grid size for 4 items */}
                    <Paper
                      elevation={2}
                      sx={{
                        padding: theme.spacing(2),
                        textAlign: 'center',
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                      }}
                    >
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Total Moods Logged
                      </Typography>
                      <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
                        {summaryStatistics.totalMoods}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}> {/* Adjusted Grid size for 4 items */}
                    <Paper
                      elevation={2}
                      sx={{
                        padding: theme.spacing(2),
                        textAlign: 'center',
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                      }}
                    >
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Average Mood
                      </Typography>
                      <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
                        {summaryStatistics.averageMood} ⭐
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}> {/* Adjusted Grid size for 4 items */}
                    <Paper
                      elevation={2}
                      sx={{
                        padding: theme.spacing(2),
                        textAlign: 'center',
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                      }}
                    >
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Total Activities Logged
                      </Typography>
                      <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
                        {summaryStatistics.totalActivities}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}> {/* Adjusted Grid size for 4 items */}
                    <Paper
                      elevation={2}
                      sx={{
                        padding: theme.spacing(2),
                        textAlign: 'center',
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                      }}
                    >
                      <Typography variant="h6" color="textSecondary" gutterBottom>
                        Total Sleep Logs
                      </Typography>
                      <Typography variant="h4" sx={{ color: theme.palette.secondary.main }}> {/* Different color to differentiate */}
                        {summaryStatistics.totalSleepLogs}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </motion.div>

              {/* **Charts Section** */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
              >
                <Grid container spacing={6}>
                  {/* **Mood Over Time Line Chart** */}
                  <Grid item xs={12} lg={6}> {/* Adjust grid for layout */}
                    <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                      Mood Over Time
                    </Typography>
                    <Box
                      component={Paper}
                      elevation={2} // Reduced elevation for charts
                      sx={{
                        padding: theme.spacing(2), // Reduced padding for charts
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        height: isSmallScreen ? 300 : 400, // Adjust height based on screen size
                      }}
                    >
                      {hasMoodOverTimeData ? (
                        <Line
                          ref={moodOverTimeRef} // Attach the ref here
                          data={moodOverTimeData}
                          options={moodOverTimeOptions}
                          onClick={(event, elements) => {
                            if (elements && elements.length > 0) { // Defensive check
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

                  {/* **Activity Frequency Bar Chart** */}
                  <Grid item xs={12} lg={6}> {/* Adjust grid for layout */}
                    <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                      Activity Frequency
                    </Typography>
                    <Box
                      component={Paper}
                      elevation={2} // Reduced elevation for charts
                      sx={{
                        padding: theme.spacing(2), // Reduced padding for charts
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        height: isSmallScreen ? 300 : 400, // Adjust height based on screen size
                      }}
                    >
                      {hasActivityFrequencyData ? (
                        <Bar
                          data={activityFrequencyData}
                          options={activityFrequencyOptions}
                          onClick={(event, elements) => {
                            if (elements && elements.length > 0) { // Defensive check
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

                  {/* **Mood vs. Activity Correlation Scatter Chart** */}
                  <Grid item xs={12} lg={6}> {/* Adjust grid for layout */}
                    <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                      Mood vs. Activity Correlation
                    </Typography>
                    <Box
                      component={Paper}
                      elevation={2} // Reduced elevation for charts
                      sx={{
                        padding: theme.spacing(2), // Reduced padding for charts
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        height: isSmallScreen ? 300 : 400, // Adjust height based on screen size
                      }}
                    >
                      {hasMoodActivityCorrelationData ? (
                        <Scatter
                          data={moodActivityCorrelationData}
                          options={moodActivityCorrelationOptions}
                          onClick={(event, elements) => {
                            if (elements && elements.length > 0) { // Defensive check
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

                  {/* **Sleep Duration Over Time Line Chart** */}
                  <Grid item xs={12} lg={6}> {/* Adjust grid for layout */}
                    <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
                      Sleep Duration Over Time
                    </Typography>
                    <Box
                      component={Paper}
                      elevation={2} // Reduced elevation for charts
                      sx={{
                        padding: theme.spacing(2), // Reduced padding for charts
                        borderRadius: 2,
                        backgroundColor: theme.palette.background.paper,
                        height: isSmallScreen ? 300 : 400, // Adjust height based on screen size
                      }}
                    >
                      {hasSleepDurationOverTimeData ? (
                        <Line
                          ref={sleepDurationOverTimeRef} // Attach the ref here
                          data={sleepDurationOverTimeData}
                          options={sleepDurationOverTimeOptions}
                          onClick={(event, elements) => {
                            if (elements && elements.length > 0) { // Defensive check
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

              {/* **Reset Zoom Button for Charts** */}
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
            </>
          )}
        </Container>
      </motion.div>
    </PageLayout>
  );
};

export default Insights;
