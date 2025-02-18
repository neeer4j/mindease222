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
  IconButton,
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
import MoodIcon from '@mui/icons-material/Mood';
import StarIcon from '@mui/icons-material/Star';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import TuneIcon from '@mui/icons-material/Tune';
import PanToolIcon from '@mui/icons-material/PanTool';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BedtimeIcon from '@mui/icons-material/Bedtime';

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
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: { 
        position: isSmallScreen ? 'bottom' : 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      title: { 
        display: true, 
        text: 'Mood Over Time',
        font: {
          size: 16,
          weight: 600
        },
        padding: { bottom: 20 }
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => `Date: ${context[0].label}`,
          label: context => `Mood: ${context.parsed.y} ⭐`
        }
      },
      zoom: {
        pan: { 
          enabled: true, 
          mode: 'x',
          modifierKey: 'ctrl'
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
          speed: 100,
          threshold: 2
        },
      }
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        grid: {
          drawBorder: false,
          color: alpha(theme.palette.divider, 0.1)
        },
        ticks: {
          stepSize: 1,
          padding: 10,
          font: {
            size: 12
          },
          callback: value => `${value} ⭐`
        }
      },
      x: {
        type: 'category',
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 10,
          maxRotation: 45,
          minRotation: 45,
          padding: 10,
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: theme.palette.background.paper
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

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
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: { 
        display: false
      },
      title: { 
        display: true, 
        text: 'Activity Frequency',
        font: {
          size: 16,
          weight: 600
        },
        padding: { bottom: 20 }
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.secondary.main,
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => context[0].label,
          label: context => `${context.parsed.y} times`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: alpha(theme.palette.divider, 0.1)
        },
        ticks: {
          stepSize: 1,
          padding: 10,
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          padding: 10,
          font: {
            size: 11
          }
        }
      }
    },
    barThickness: 'flex',
    maxBarThickness: 35,
    borderRadius: 6,
    borderSkipped: false
  };

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
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: { 
        position: isSmallScreen ? 'bottom' : 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      title: { 
        display: true, 
        text: 'Mood vs. Activity Correlation',
        font: {
          size: 16,
          weight: 600
        },
        padding: { bottom: 20 }
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.success.main,
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => `Activity: ${context[0].raw.x}`,
          label: context => `Mood: ${context.raw.y} ⭐`
        }
      },
      zoom: {
        pan: { 
          enabled: true, 
          mode: 'xy',
          modifierKey: 'ctrl'
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy',
          speed: 100,
          threshold: 2
        }
      }
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        title: {
          display: true,
          text: 'Mood Level',
          font: {
            size: 14,
            weight: 500
          }
        },
        grid: {
          drawBorder: false,
          color: alpha(theme.palette.divider, 0.1)
        },
        ticks: {
          stepSize: 1,
          padding: 10,
          font: {
            size: 12
          },
          callback: value => `${value} ⭐`
        }
      },
      x: {
        type: 'category',
        title: {
          display: true,
          text: 'Activities',
          font: {
            size: 14,
            weight: 500
          }
        },
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          padding: 10,
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 2,
        backgroundColor: alpha(theme.palette.success.main, 0.7)
      }
    }
  };

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
          label: 'Average Sleep Duration',
          data,
          fill: true,
          backgroundColor: alpha(theme.palette.info.main, 0.1),
          borderColor: theme.palette.info.main,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Recommended Sleep (8hrs)',
          data: labels.map(() => 8),
          borderColor: alpha(theme.palette.success.main, 0.5),
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    };
  }, [filteredSleepLogs, theme.palette.info, theme.palette.success]);

  const sleepDurationOverTimeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    },
    plugins: {
      legend: {
        position: isSmallScreen ? 'bottom' : 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      title: {
        display: true,
        text: 'Sleep Duration Over Time',
        font: {
          size: 16,
          weight: 600
        },
        padding: { bottom: 20 }
      },
      tooltip: {
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.info.main,
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (context) => `Date: ${context[0].label}`,
          label: (context) => {
            if (context.dataset.label === 'Average Sleep Duration') {
              const hours = Math.floor(context.parsed.y);
              const minutes = Math.round((context.parsed.y - hours) * 60);
              return `${context.dataset.label}: ${hours}h ${minutes}m`;
            }
            return `${context.dataset.label}`;
          }
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'ctrl'
        },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
          speed: 100,
          threshold: 2
        }
      }
    },
    scales: {
      y: {
        suggestedMin: 4,
        suggestedMax: 12,
        grid: {
          drawBorder: false,
          color: alpha(theme.palette.divider, 0.1)
        },
        title: {
          display: true,
          text: 'Hours',
          font: {
            size: 14,
            weight: 500
          }
        },
        ticks: {
          stepSize: 2,
          padding: 10,
          font: {
            size: 12
          },
          callback: value => `${value}h`
        }
      },
      x: {
        type: 'category',
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 10,
          maxRotation: 45,
          minRotation: 45,
          padding: 10,
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: theme.palette.background.paper
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
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
      const moodTrends = getMoodTrends();
      const topActivities = getTopActivities();
      const sleepInsights = getSleepQualityInsights();

      const prompt = `
You are an expert mental health analyst. Based on the following data, provide a comprehensive and actionable analysis of the user's mental well-being along with suggestions for improvement. Keep it concise and impactful.

**Summary Data:**
- Total Moods Logged: ${summaryStatistics.totalMoods}
- Average Mood: ${summaryStatistics.averageMood} (scale 1-5)
- Total Activities Logged: ${summaryStatistics.totalActivities}
- Total Sleep Logs: ${summaryStatistics.totalSleepLogs}

**Detailed Analysis:**
${moodTrends ? `- Mood Trend: ${moodTrends.improving ? 'Improving' : moodTrends.stable ? 'Stable' : 'Declining'} (${moodTrends.trend})` : ''}
${topActivities.length ? `- Top Activities: ${topActivities.map(a => `${a.name} (${a.count}x)`).join(', ')}` : ''}
${sleepInsights ? `- Sleep Quality: ${sleepInsights.averageDuration}hrs avg, Consistency: ${sleepInsights.consistency}` : ''}

Please provide:
1. A brief overview of current well-being status
2. Key patterns identified
3. Specific, actionable recommendations
4. Areas needing attention

Use **bold** for emphasis on key points.`;

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

  // Add new data analysis functions before the return statement
  const getMoodTrends = () => {
    if (!hasMoodOverTimeData) return null;
    const data = moodOverTimeData.datasets[0].data;
    const labels = moodOverTimeData.labels;
    
    // Calculate overall trend
    const trend = data[data.length - 1] - data[0];
    const percentageChange = ((data[data.length - 1] - data[0]) / data[0] * 100).toFixed(1);
    
    // Calculate weekly averages
    const currentWeekMoods = data.slice(-7);
    const previousWeekMoods = data.slice(-14, -7);
    const currentWeekAvg = currentWeekMoods.reduce((a, b) => a + b, 0) / currentWeekMoods.length;
    const previousWeekAvg = previousWeekMoods.length ? previousWeekMoods.reduce((a, b) => a + b, 0) / previousWeekMoods.length : null;
    const weeklyChange = previousWeekAvg ? ((currentWeekAvg - previousWeekAvg) / previousWeekAvg * 100).toFixed(1) : null;
    
    // Calculate consistency score (standard deviation)
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const consistency = stdDev <= 0.5 ? 'High' : stdDev <= 1 ? 'Moderate' : 'Low';

    // Get highest and lowest moods with dates
    const highestMood = Math.max(...data);
    const lowestMood = Math.min(...data);
    const highestDate = labels[data.indexOf(highestMood)];
    const lowestDate = labels[data.indexOf(lowestMood)];

    return {
      trend: trend.toFixed(2),
      percentageChange,
      improving: trend > 0,
      stable: Math.abs(trend) < 0.5,
      currentWeekAvg: currentWeekAvg.toFixed(2),
      previousWeekAvg: previousWeekAvg ? previousWeekAvg.toFixed(2) : null,
      weeklyChange,
      consistency,
      consistencyScore: stdDev.toFixed(2),
      highestMood,
      lowestMood,
      highestDate,
      lowestDate
    };
  };

  const getTopActivities = () => {
    if (!hasActivityFrequencyData) return [];
    const activities = activityFrequencyData.labels.map((label, index) => ({
      name: label,
      count: activityFrequencyData.datasets[0].data[index]
    }));
    return activities.sort((a, b) => b.count - a.count).slice(0, 3);
  };

  const getSleepQualityInsights = () => {
    if (!hasSleepDurationOverTimeData) return null;
    const durations = sleepDurationOverTimeData.datasets[0].data;
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    return {
      averageDuration: avgDuration.toFixed(1),
      isHealthy: avgDuration >= 7 && avgDuration <= 9,
      consistency: calculateSleepConsistency(durations)
    };
  };

  const calculateSleepConsistency = (durations) => {
    if (durations.length < 2) return 'N/A';
    const variations = durations.slice(1).map((dur, i) => 
      Math.abs(dur - durations[i])
    );
    const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
    return avgVariation <= 1 ? 'High' : avgVariation <= 2 ? 'Moderate' : 'Low';
  };

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
                hidden: { opacity: 0, y: -20 },
                visible: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -20 },
              }}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ marginBottom: theme.spacing(4) }}
            >
              <Paper
                elevation={3}
                sx={{
                  padding: theme.spacing(3),
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.97)} 0%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    opacity: 0.7
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 3 }}>
                  <TuneIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                    Filter Options
                  </Typography>
                </Box>
                <Grid container spacing={3} alignItems="center">
                  {/* Date Range Filters */}
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ 
                        shrink: true,
                        sx: { color: theme.palette.text.secondary }
                      }}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                          },
                          '&:hover fieldset': {
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }}
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
                        sx: { color: theme.palette.text.secondary }
                      }}
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: alpha(theme.palette.primary.main, 0.2),
                          },
                          '&:hover fieldset': {
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }}
                    />
                  </Grid>
                  {/* Apply and Reset Buttons */}
                  <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                        setSelectedActivities([]);
                      }}
                      sx={{
                        borderColor: alpha(theme.palette.error.main, 0.5),
                        color: theme.palette.error.main,
                        '&:hover': {
                          borderColor: theme.palette.error.main,
                          backgroundColor: alpha(theme.palette.error.main, 0.04),
                        },
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (moodOverTimeRef.current) moodOverTimeRef.current.resetZoom();
                        if (sleepDurationOverTimeRef.current) sleepDurationOverTimeRef.current.resetZoom();
                      }}
                      sx={{
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                        boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                        },
                      }}
                    >
                      Apply Filters
                    </Button>
                  </Grid>
                  {/* Activity Filters */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom sx={{ marginBottom: 1 }}>
                      Filter by Activities:
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1,
                      padding: 1,
                      borderRadius: 1,
                      backgroundColor: alpha(theme.palette.background.default, 0.4)
                    }}>
                      {activities.map((activity) => (
                        <Chip
                          key={activity.title}
                          label={activity.title}
                          onClick={handleActivityChange}
                          name={activity.title}
                          color={selectedActivities.includes(activity.title) ? "primary" : "default"}
                          variant={selectedActivities.includes(activity.title) ? "filled" : "outlined"}
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              backgroundColor: selectedActivities.includes(activity.title) 
                                ? alpha(theme.palette.primary.main, 0.85)
                                : alpha(theme.palette.action.hover, 0.15)
                            },
                            '&.MuiChip-filled': {
                              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Collapse>

          {/* Updated Reset Zoom Button with icons */}
          <Box 
            sx={{ 
              position: 'fixed',
              bottom: theme.spacing(4),
              right: theme.spacing(4),
              zIndex: 1000,
              display: 'flex',
              gap: 2
            }}
          >
            <Tooltip title="Reset Zoom">
              <Button
                variant="contained"
                onClick={() => {
                  if (moodOverTimeRef.current) moodOverTimeRef.current.resetZoom();
                  if (sleepDurationOverTimeRef.current) sleepDurationOverTimeRef.current.resetZoom();
                }}
                startIcon={<ZoomOutIcon />}
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.light} 90%)`,
                  boxShadow: `0 3px 5px 2px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  borderRadius: '50px',
                  padding: '10px 20px',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.secondary.dark} 30%, ${theme.palette.secondary.main} 90%)`,
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Reset Zoom
              </Button>
            </Tooltip>
          </Box>

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
                      icon: <MoodIcon sx={{ fontSize: 40, color: theme.palette.primary.light }} />,
                      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                    },
                    {
                      label: 'Average Mood',
                      value: `${summaryStatistics.averageMood}`,
                      suffix: ' ⭐',
                      color: theme.palette.warning.main,
                      icon: <StarIcon sx={{ fontSize: 40, color: theme.palette.warning.light }} />,
                      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
                    },
                    {
                      label: 'Total Activities Logged',
                      value: summaryStatistics.totalActivities,
                      color: theme.palette.success.main,
                      icon: <DirectionsRunIcon sx={{ fontSize: 40, color: theme.palette.success.light }} />,
                      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
                    },
                    {
                      label: 'Total Sleep Logs',
                      value: summaryStatistics.totalSleepLogs,
                      color: theme.palette.secondary.main,
                      icon: <NightsStayIcon sx={{ fontSize: 40, color: theme.palette.secondary.light }} />,
                      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    },
                  ].map((stat, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Paper
                          elevation={2}
                          sx={{
                            padding: theme.spacing(3),
                            textAlign: 'center',
                            borderRadius: 4,
                            background: stat.bgGradient,
                            border: `1px solid ${alpha(stat.color, 0.1)}`,
                            boxShadow: `0 4px 20px ${alpha(stat.color, 0.1)}`,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `linear-gradient(135deg, ${alpha(stat.color, 0.1)} 0%, transparent 100%)`,
                              opacity: 0,
                              transition: 'opacity 0.3s ease-in-out',
                            },
                            '&:hover::before': {
                              opacity: 1,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            {stat.icon}
                            <Typography
                              variant="h6"
                              sx={{
                                color: alpha(theme.palette.text.primary, 0.7),
                                fontWeight: 500,
                                fontSize: '1rem',
                                marginBottom: 1,
                              }}
                            >
                              {stat.label}
                            </Typography>
                            <Typography
                              variant="h4"
                              sx={{
                                color: stat.color,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              {stat.value}
                              {stat.suffix && (
                                <Typography
                                  component="span"
                                  sx={{
                                    fontSize: '1.5rem',
                                    opacity: 0.8,
                                  }}
                                >
                                  {stat.suffix}
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        </Paper>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>

              {/* Enhanced Insights Summary */}
              <motion.div variants={sectionVariants} initial="hidden" animate="visible" style={{ marginBottom: theme.spacing(4) }}>
                <Grid container spacing={3}>
                  {/* Mood Trends Card */}
                  {getMoodTrends() && (
                    <Grid item xs={12} md={4}>
                      <Paper
                        elevation={3}
                        sx={{
                          padding: theme.spacing(3),
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                          borderRadius: 3,
                          height: '100%',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[6],
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          }
                        }}
                      >
                        <Typography variant="h6" gutterBottom sx={{ 
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          paddingBottom: 1
                        }}>
                          Mood Trend Analysis
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Overall Trend */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            backgroundColor: alpha(theme.palette.background.paper, 0.5),
                            padding: 1,
                            borderRadius: 1
                          }}>
                            <Typography variant="body1" sx={{
                              fontSize: '1.1rem',
                              color: getMoodTrends().improving ? theme.palette.success.main : 
                                     getMoodTrends().stable ? theme.palette.info.main : 
                                     theme.palette.warning.main,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              {getMoodTrends().improving ? '📈' : getMoodTrends().stable ? '📊' : '📉'}
                              {getMoodTrends().improving ? 'Improving' : getMoodTrends().stable ? 'Stable' : 'Declining'}
                              <Typography component="span" sx={{ color: theme.palette.text.secondary }}>
                                {getMoodTrends().stable ? 
                                  '(Consistent)' : 
                                  `(${getMoodTrends().percentageChange}%)`}
                              </Typography>
                            </Typography>
                          </Box>

                          {/* Weekly Comparison */}
                          {getMoodTrends().previousWeekAvg && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                Weekly Change:
                              </Typography>
                              <Typography variant="body1" sx={{
                                color: getMoodTrends().weeklyChange > 0 ? theme.palette.success.main :
                                       getMoodTrends().weeklyChange < 0 ? theme.palette.error.main :
                                       theme.palette.text.primary
                              }}>
                                {getMoodTrends().weeklyChange > 0 ? '↗' : getMoodTrends().weeklyChange < 0 ? '↘' : '→'} {Math.abs(getMoodTrends().weeklyChange)}%
                              </Typography>
                            </Box>
                          )}

                          {/* Consistency Score */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Mood Consistency:
                            </Typography>
                            <Chip
                              label={getMoodTrends().consistency}
                              size="small"
                              color={
                                getMoodTrends().consistency === 'High' ? 'success' :
                                getMoodTrends().consistency === 'Moderate' ? 'warning' : 'error'
                              }
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>

                          {/* Highest and Lowest Points */}
                          <Box sx={{ 
                            mt: 1,
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: alpha(theme.palette.background.paper, 0.5)
                          }}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                              Peak Moods:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                                Highest: {getMoodTrends().highestMood}⭐ ({getMoodTrends().highestDate})
                              </Typography>
                              <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                                Lowest: {getMoodTrends().lowestMood}⭐ ({getMoodTrends().lowestDate})
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                  
                  {/* Top Activities Card */}
                  {getTopActivities().length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Paper
                        elevation={3}
                        sx={{
                          padding: theme.spacing(3),
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                          borderRadius: 3,
                          height: '100%',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[6],
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                          }
                        }}
                      >
                        <Typography variant="h6" gutterBottom sx={{ 
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          borderBottom: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                          paddingBottom: 1
                        }}>
                          Most Frequent Activities
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, marginTop: 2 }}>
                          {getTopActivities().map((activity, index) => (
                            <Chip
                              key={activity.name}
                              label={`${activity.name} (${activity.count}x)`}
                              color={index === 0 ? "secondary" : "default"}
                              variant={index === 0 ? "filled" : "outlined"}
                              size="medium"
                              sx={{
                                fontSize: '0.9rem',
                                padding: '8px 0',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  transform: 'scale(1.02)',
                                  backgroundColor: index === 0 ? alpha(theme.palette.secondary.main, 0.9) : alpha(theme.palette.action.hover, 0.1)
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                  
                  {/* Sleep Quality Card */}
                  {getSleepQualityInsights() && (
                    <Grid item xs={12} md={4}>
                      <Paper
                        elevation={3}
                        sx={{
                          padding: theme.spacing(3),
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.85)} 100%)`,
                          borderRadius: 3,
                          height: '100%',
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[6],
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                          }
                        }}
                      >
                        <Typography variant="h6" gutterBottom sx={{ 
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          borderBottom: `2px solid ${alpha(theme.palette.info.main, 0.1)}`,
                          paddingBottom: 1
                        }}>
                          Sleep Quality
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                              Average Duration:
                            </Typography>
                            <Typography variant="h6" sx={{ color: getSleepQualityInsights().isHealthy ? theme.palette.success.main : theme.palette.warning.main }}>
                              {getSleepQualityInsights().averageDuration}hrs
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                              Sleep Consistency:
                            </Typography>
                            <Chip
                              label={getSleepQualityInsights().consistency}
                              color={
                                getSleepQualityInsights().consistency === 'High' ? 'success' :
                                getSleepQualityInsights().consistency === 'Moderate' ? 'warning' : 'error'
                              }
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                          {!getSleepQualityInsights().isHealthy && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: theme.palette.warning.main,
                                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                padding: theme.spacing(1),
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5
                              }}
                            >
                              ⚠️ Consider adjusting sleep schedule for optimal rest
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </motion.div>

              {/* Charts Section with Updated Styling */}
              <motion.div variants={sectionVariants} initial="hidden" animate="visible">
                <Grid container spacing={4}>
                  {/* Chart containers with consistent styling */}
                  {[
                    {
                      title: "Mood Over Time",
                      content: (
                        hasMoodOverTimeData ? (
                          <Box sx={{ position: 'relative', height: '100%' }}>
                            <Box sx={{ 
                              position: 'absolute',
                              right: 0,
                              top: -35,
                              display: 'flex',
                              gap: 1
                            }}>
                              <Tooltip title="Pan: Hold Ctrl + Drag">
                                <IconButton size="small">
                                  <PanToolIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Zoom: Use Mouse Wheel">
                                <IconButton size="small">
                                  <ZoomInIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Line
                              ref={moodOverTimeRef}
                              data={moodOverTimeData}
                              options={moodOverTimeOptions}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 2
                          }}>
                            <SentimentDissatisfiedIcon sx={{ fontSize: '3rem', color: 'text.secondary', opacity: 0.5 }} />
                            <Typography variant="body1" color="textSecondary" textAlign="center">
                              No mood entries available to display.
                            </Typography>
                          </Box>
                        )
                      ),
                      accentColor: theme.palette.primary.main
                    },
                    {
                      title: "Activity Frequency",
                      content: (
                        hasActivityFrequencyData ? (
                          <Box sx={{ height: '100%' }}>
                            <Bar
                              data={activityFrequencyData}
                              options={activityFrequencyOptions}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 2
                          }}>
                            <DirectionsRunIcon sx={{ fontSize: '3rem', color: 'text.secondary', opacity: 0.5 }} />
                            <Typography variant="body1" color="textSecondary" textAlign="center">
                              No activities available to display.
                            </Typography>
                          </Box>
                        )
                      ),
                      accentColor: theme.palette.secondary.main
                    },
                    {
                      title: "Mood vs. Activity Correlation",
                      content: (
                        hasMoodActivityCorrelationData ? (
                          <Box sx={{ position: 'relative', height: '100%' }}>
                            <Box sx={{ 
                              position: 'absolute',
                              right: 0,
                              top: -35,
                              display: 'flex',
                              gap: 1
                            }}>
                              <Tooltip title="Pan: Hold Ctrl + Drag">
                                <IconButton size="small">
                                  <PanToolIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Zoom: Use Mouse Wheel">
                                <IconButton size="small">
                                  <ZoomInIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Scatter
                              data={moodActivityCorrelationData}
                              options={moodActivityCorrelationOptions}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 2
                          }}>
                            <AssessmentIcon sx={{ fontSize: '3rem', color: 'text.secondary', opacity: 0.5 }} />
                            <Typography variant="body1" color="textSecondary" textAlign="center">
                              No correlation data available to display.
                            </Typography>
                          </Box>
                        )
                      ),
                      accentColor: theme.palette.success.main
                    },
                    {
                      title: "Sleep Duration Over Time",
                      content: (
                        hasSleepDurationOverTimeData ? (
                          <Box sx={{ position: 'relative', height: '100%' }}>
                            <Box sx={{ 
                              position: 'absolute',
                              right: 0,
                              top: -35,
                              display: 'flex',
                              gap: 1
                            }}>
                              <Tooltip title="Pan: Hold Ctrl + Drag">
                                <IconButton size="small">
                                  <PanToolIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Zoom: Use Mouse Wheel">
                                <IconButton size="small">
                                  <ZoomInIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Line
                              ref={sleepDurationOverTimeRef}
                              data={sleepDurationOverTimeData}
                              options={sleepDurationOverTimeOptions}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 2
                          }}>
                            <BedtimeIcon sx={{ fontSize: '3rem', color: 'text.secondary', opacity: 0.5 }} />
                            <Typography variant="body1" color="textSecondary" textAlign="center">
                              No sleep data available to display.
                            </Typography>
                          </Box>
                        )
                      ),
                      accentColor: theme.palette.info.main
                    }
                  ].map((chart, index) => (
                    <Grid item xs={12} lg={6} key={index}>
                      <Paper
                        elevation={3}
                        sx={{
                          padding: theme.spacing(3),
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.97)} 0%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
                          borderRadius: 3,
                          height: isSmallScreen ? 350 : 450,
                          border: `1px solid ${alpha(chart.accentColor, 0.1)}`,
                          transition: 'all 0.3s ease-in-out',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 24px ${alpha(chart.accentColor, 0.15)}`,
                            '& .chart-header': {
                              borderColor: alpha(chart.accentColor, 0.3),
                            },
                            '& .chart-gradient': {
                              opacity: 1
                            }
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: `linear-gradient(90deg, ${alpha(chart.accentColor, 0.4)} 0%, transparent 100%)`,
                          }
                        }}
                      >
                        <Box className="chart-gradient" sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `radial-gradient(circle at top right, ${alpha(chart.accentColor, 0.05)} 0%, transparent 60%)`,
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        }} />
                        <Typography
                          variant="h6"
                          className="chart-header"
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 600,
                            marginBottom: 3,
                            paddingBottom: 1.5,
                            borderBottom: `2px solid ${alpha(chart.accentColor, 0.1)}`,
                            transition: 'border-color 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          {chart.title}
                        </Typography>
                        <Box sx={{ 
                          height: 'calc(100% - 70px)',
                          position: 'relative'
                        }}>
                          {chart.content}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>

              {/* AI Generated Insights Section with Updated Styling */}
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                style={{ marginTop: theme.spacing(6) }}
              >
                <Typography variant="h5" gutterBottom sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  marginBottom: theme.spacing(3)
                }}>
                  AI Generated Insights
                </Typography>
                <Paper
                  elevation={3}
                  sx={{
                    padding: theme.spacing(4),
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.97)} 0%, ${alpha(theme.palette.background.paper, 0.92)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '& p': {
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7
                    },
                    '& strong': {
                      color: theme.palette.primary.main,
                      fontWeight: 600
                    }
                  }}
                >
                  {aiInsightsLoading ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center',
                      gap: 2,
                      padding: theme.spacing(4)
                    }}>
                      <CircularProgress size={40} />
                      <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                        Analyzing your well-being data...
                      </Typography>
                    </Box>
                  ) : aiInsightsError ? (
                    <Alert 
                      severity="error"
                      sx={{
                        borderRadius: 2,
                        '& .MuiAlert-message': {
                          fontSize: '1rem'
                        }
                      }}
                    >
                      {aiInsightsError}
                    </Alert>
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
