// src/pages/SleepQualityMonitor.jsx

import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  TextField,
  Button,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Slider,
  FormControlLabel,
  FormGroup,
  CircularProgress,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/system';
import {
  Bedtime as BedtimeIcon,
  Delete as DeleteIcon,
  Timeline as TimelineIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  HelpOutline as HelpOutlineIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import Chart from 'react-apexcharts';
import { SleepContext } from '../contexts/SleepContext';
import PageLayout from '../components/PageLayout';

// Import Gemini API from Google Generative AI library
import { GoogleGenerativeAI } from '@google/generative-ai';
// Import ReactMarkdown for rendering markdown content
import ReactMarkdown from 'react-markdown';

// Add this import at the top with other imports
import SleepQualityMonitorSplash from '../components/SleepQualityMonitorSplash';
import SplashScreenToggle from '../components/SplashScreenToggle';

// Initialize Gemini API using your API key from .env
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
if (!apiKey) {
  console.error("REACT_APP_GEMINI_API_KEY is not set in your environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);
const sleepModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Styled Gradient Button
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.secondary.light} 30%, ${theme.palette.secondary.main} 90%)`,
  color: theme.palette.secondary.contrastText,
  borderRadius: '12px',
  padding: '10px 22px',
  boxShadow: theme.shadows[4],
  transition: 'background 0.5s, box-shadow 0.3s, transform 0.3s',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.secondary.main} 30%, ${theme.palette.secondary.dark} 90%)`,
    boxShadow: theme.shadows[6],
    transform: 'scale(1.03)',
  },
}));

// Styled Slider Component
const StyledSlider = styled(Slider, {
  shouldForwardProp: (prop) => prop !== 'isMobile',
})(({ theme, isMobile }) => ({
  color: theme.palette.secondary.main,
  height: 8,
  padding: '15px 0',
  '& .MuiSlider-track': {
    border: 'none',
    height: 8,
    borderRadius: 4,
    background: `linear-gradient(to right, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
  },
  '& .MuiSlider-rail': {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.palette.grey[300],
  },
  '& .MuiSlider-thumb': {
    height: isMobile ? 20 : 24,
    width: isMobile ? 20 : 24,
    backgroundColor: theme.palette.background.paper,
    border: `2px solid ${theme.palette.secondary.main}`,
    boxShadow: theme.shadows[2],
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: theme.shadows[4],
      '@keyframes thumbPulse': {
        '0%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.15)' },
        '100%': { transform: 'scale(1)' },
      },
      animation: 'thumbPulse 1.5s infinite',
    },
  },
  '& .MuiSlider-valueLabel': {
    backgroundColor: theme.palette.secondary.dark,
    color: theme.palette.secondary.contrastText,
    borderRadius: 4,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    '&:before': {
      backgroundColor: theme.palette.secondary.dark,
    },
  },
  '& .MuiSlider-mark': {
    height: 8,
    width: 8,
    borderRadius: '50%',
    backgroundColor: theme.palette.grey[500],
    '&.MuiSlider-markActive': {
      backgroundColor: theme.palette.primary.main,
    },
  },
  '& .MuiSlider-markLabel': {
    color: theme.palette.text.secondary,
    fontSize: '0.8rem',
    top: 25,
  },
}));

// *** START: SleepLogForm Component ***
const SleepLogForm = ({ onSubmit, initialValues = {}, factorOptions, isEditing }) => {
  const [startTime, setStartTime] = useState(initialValues.startTime || '');
  const [endTime, setEndTime] = useState(initialValues.endTime || '');
  const [notes, setNotes] = useState(initialValues.notes || '');
  const [sleepQualityRating, setSleepQualityRating] = useState(initialValues.qualityRating || 3);
  const [sleepFactors, setSleepFactors] = useState(initialValues.factors || []);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleFactorChange = (factor) => (event) => {
    if (event.target.checked) {
      setSleepFactors([...sleepFactors, factor]);
    } else {
      setSleepFactors(sleepFactors.filter(f => f !== factor));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      startTime,
      endTime,
      notes,
      qualityRating: sleepQualityRating,
      factors: sleepFactors,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Sleep Start Time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            InputLabelProps={{
              style: { color: theme.palette.text.secondary },
              shrink: true,
            }}
            required
            InputProps={{
              style: { color: theme.palette.text.primary },
            }}
            aria-label="Sleep Start Time"
            size="small"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Sleep End Time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            InputLabelProps={{
              style: { color: theme.palette.text.secondary },
              shrink: true,
            }}
            required
            InputProps={{
              style: { color: theme.palette.text.primary },
            }}
            aria-label="Sleep End Time"
            size="small"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }} color="textSecondary">
            Rate your sleep quality:
          </Typography>
          <StyledSlider
            isMobile={isMobile}
            value={sleepQualityRating}
            onChange={(e, newValue) => setSleepQualityRating(newValue)}
            step={1}
            marks={[
              { value: 1, label: 'Poor' },
              { value: 2, label: 'Fair' },
              { value: 3, label: 'Average' },
              { value: 4, label: 'Good' },
              { value: 5, label: 'Excellent' },
            ]}
            min={1}
            max={5}
            valueLabelDisplay="auto"
            aria-label="Sleep Quality Slider"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }} color="textSecondary">
            Factors that may have affected sleep (optional):
          </Typography>
          <FormGroup row>
            {factorOptions.map((factor) => (
              <FormControlLabel
                key={factor}
                control={<Checkbox checked={sleepFactors.includes(factor)} onChange={handleFactorChange(factor)} name={factor} />}
                label={factor}
                sx={{
                  color: theme.palette.text.primary,
                  '& .MuiSvgIcon-root': { color: theme.palette.secondary.main },
                }}
                aria-label={`Sleep Factor: ${factor}`}
              />
            ))}
          </FormGroup>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did you sleep? Any factors affecting your sleep?"
            InputProps={{ style: { color: theme.palette.text.primary } }}
            InputLabelProps={{
              style: { color: theme.palette.text.secondary },
              shrink: true,
            }}
            aria-label="Sleep Notes"
            size="small"
          />
        </Grid>
        <Grid item xs={12} sx={{ textAlign: 'right' }}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <GradientButton type="submit" variant="contained" startIcon={<CheckCircleOutlineIcon />}>
              {isEditing ? 'Update Sleep' : 'Log Sleep'}
            </GradientButton>
          </motion.div>
        </Grid>
      </Grid>
    </form>
  );
};
// *** END: SleepLogForm Component ***

// *** START: SleepHistoryChart Component ***
const SleepHistoryChart = ({ sleepLogs, chartOptions: baseChartOptions, theme }) => {
  const [chartOptions, setChartOptions] = useState({ ...baseChartOptions });
  const [chartSeries, setChartSeries] = useState([{ name: 'Sleep Duration', data: [] }]);

  useEffect(() => {
    updateChart(sleepLogs);
    // Update chart options based on theme mode
    setChartOptions({
      ...baseChartOptions,
      theme: { mode: theme.palette.mode },
      colors: [theme.palette.secondary.main],
      xaxis: {
        ...baseChartOptions.xaxis,
        labels: {
          ...baseChartOptions.xaxis.labels,
          style: { colors: theme.palette.text.primary },
        },
        axisBorder: { ...baseChartOptions.xaxis.axisBorder, color: theme.palette.divider },
        axisTicks: { ...baseChartOptions.xaxis.axisTicks, color: theme.palette.divider },
      },
      yaxis: {
        ...baseChartOptions.yaxis,
        labels: { ...baseChartOptions.yaxis.labels, style: { colors: theme.palette.text.primary } },
        axisBorder: { ...baseChartOptions.yaxis.axisBorder, color: theme.palette.divider },
        axisTicks: { ...baseChartOptions.yaxis.axisTicks, color: theme.palette.divider },
        title: {
          ...baseChartOptions.yaxis.title,
          style: { color: theme.palette.text.primary, fontSize: '14px', fontWeight: 'bold' },
        },
      },
      grid: { ...baseChartOptions.grid, borderColor: theme.palette.divider },
      tooltip: { ...baseChartOptions.tooltip, theme: theme.palette.mode, style: { fontSize: '12px' } },
      legend: { ...baseChartOptions.legend, labels: { colors: theme.palette.text.primary } },
    });
  }, [sleepLogs, theme.palette.mode]);

  const updateChart = (logs) => {
    const chartData = logs.map(log => {
      const start = new Date(log.startTime).getTime();
      const end = new Date(log.endTime).getTime();
      const durationHours = (end - start) / (1000 * 60 * 60);
      return [start, parseFloat(durationHours.toFixed(2))];
    }).sort((a, b) => a[0] - b[0]);

    setChartSeries([{ name: 'Sleep Duration', data: chartData }]);
  };

  return (
    <Box mt={4}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, display: 'flex', alignItems: 'center' }}>
          <TimelineIcon sx={{ mr: 0.5 }} /> Sleep History & Trends
        </Typography>
      </Box>
      {sleepLogs.length > 0 ? (
        <Chart options={chartOptions} series={chartSeries} type="line" height={300} />
      ) : (
        <Typography variant="body2" color="textSecondary">No sleep history available yet.</Typography>
      )}
    </Box>
  );
};
// *** END: SleepHistoryChart Component ***

// *** START: SleepStats Component ***
const SleepStats = ({ sleepLogs, theme }) => {
  const calculateAverageSleep = () => {
    if (sleepLogs.length === 0) return 0;
    const totalHours = sleepLogs.reduce((sum, log) => {
      const start = new Date(log.startTime).getTime();
      const end = new Date(log.endTime).getTime();
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0);
    return (totalHours / sleepLogs.length).toFixed(2);
  };

  return (
    <Box mt={3} mb={2} sx={{
      padding: theme.spacing(2),
      borderRadius: '10px',
      backgroundColor: theme.palette.background.default,
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary
    }}>
      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
        Key Stats:
      </Typography>
      <Typography variant="body1">
        Average Sleep Duration: <strong>{calculateAverageSleep()} hours</strong>
      </Typography>
    </Box>
  );
};
// *** END: SleepStats Component ***

// *** START: SleepLogList Component ***
const SleepLogList = ({ sleepLogs, onDeleteLog, onEditLog, theme }) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [logIdToDelete, setLogIdToDelete] = useState(null);
  const [clearAllConfirmationOpen, setClearAllConfirmationOpen] = useState(false);

  if (!sleepLogs || sleepLogs.length === 0) {
    return (
      <Box mt={6} textAlign="center" color={theme.palette.text.secondary}>
        <NotificationsActiveIcon sx={{ fontSize: 60, opacity: 0.6, display: 'block', margin: '0 auto' }} />
        <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.8 }}>
          No sleep logs yet. Start tracking your sleep to see your sleep patterns and improve your sleep quality!
        </Typography>
      </Box>
    );
  }

  const confirmDeleteLog = (logId) => {
    setLogIdToDelete(logId);
    setDeleteConfirmationOpen(true);
  };

  const handleActualDeleteLog = () => {
    onDeleteLog(logIdToDelete);
    setDeleteConfirmationOpen(false);
    setLogIdToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setLogIdToDelete(null);
  };

  const confirmClearAllLogs = () => {
    setClearAllConfirmationOpen(true);
  };

  const handleActualClearAllLogs = () => {
    // Implement clear all logs functionality if needed
    console.log("Clear All Logs action triggered - implement this functionality as needed.");
    setClearAllConfirmationOpen(false);
  };

  const handleCancelClearAllLogs = () => {
    setClearAllConfirmationOpen(false);
  };

  return (
    <Box mt={4}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Logged Sleep Sessions:
        </Typography>
        {sleepLogs.length > 0 && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button color="error" startIcon={<DeleteIcon />} onClick={confirmClearAllLogs} size="small">
              Clear All Logs
            </Button>
          </motion.div>
        )}
      </Box>
      <Grid container spacing={2}>
        {sleepLogs.map((log) => (
          <Grid item xs={12} md={6} key={log.id}>
            <Paper elevation={2} sx={{
              padding: theme.spacing(2),
              borderRadius: '15px',
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.text.primary
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {new Date(log.startTime).toLocaleDateString()}
                </Typography>
                <Box>
                  <Tooltip title="Edit this log">
                    <IconButton color="primary" size="small" onClick={() => onEditLog(log)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete this log">
                    <IconButton color="error" size="small" onClick={() => confirmDeleteLog(log.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Typography variant="body2">
                Start: {new Date(log.startTime).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                End: {new Date(log.endTime).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Quality: <strong>{
                  {
                    '1': 'Poor', '2': 'Fair', '3': 'Average', '4': 'Good', '5': 'Excellent'
                  }[log.qualityRating] || 'N/A'
                }</strong> ({log.qualityRating}/5)
              </Typography>
              {log.factors && log.factors.length > 0 && (
                <Typography variant="body2">
                  Factors: {log.factors.join(', ')}
                </Typography>
              )}
              {log.notes && (
                <Typography variant="body2" mt={1} sx={{ fontStyle: 'italic', color: theme.palette.text.secondary }}>
                  Notes: {log.notes}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Delete Log?"}</DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            Are you sure you want to delete this sleep log? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleActualDeleteLog} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Logs Confirmation Dialog */}
      <Dialog
        open={clearAllConfirmationOpen}
        onClose={handleCancelClearAllLogs}
        aria-labelledby="alert-dialog-clear-all-title"
        aria-describedby="alert-dialog-clear-all-description"
      >
        <DialogTitle id="alert-dialog-clear-all-title">{"Confirm Clear All Logs?"}</DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-clear-all-description">
            Are you sure you want to clear all sleep logs? This action is irreversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClearAllLogs} color="primary">
            Cancel
          </Button>
          <Button onClick={handleActualClearAllLogs} color="error" autoFocus>
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
// *** END: SleepLogList Component ***

const SleepQualityMonitor = () => {
  const theme = useTheme();
  const { sleepLogs, addSleepLog, deleteSleepLog, loading } = useContext(SleepContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isEditing, setIsEditing] = useState(false);
  const [editLogId, setEditLogId] = useState(null);
  const [initialFormValues, setInitialFormValues] = useState({});

  // State for Gemini-powered sleep insights
  const [sleepAnalysis, setSleepAnalysis] = useState('');
  const [analyzingSleep, setAnalyzingSleep] = useState(false);

  // Add splash screen state
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenTutorial = localStorage.getItem('sleepMonitorTutorialSeen');
    return !hasSeenTutorial;
  });

  // Add tutorial completion handler
  const handleTutorialComplete = () => {
    localStorage.setItem('sleepMonitorTutorialSeen', 'true');
    setShowSplash(false);
  };

  const handleShowSplash = () => {
    setShowSplash(true);
  };

  const factorOptions = [
    'Caffeine', 'Alcohol', 'Stress', 'Exercise (Late)', 'Late Meal', 'Screen Time (Before Bed)', 'Travel', 'Unusual Bedtime'
  ];

  const baseChartOptions = {
    chart: {
      id: 'sleep-chart',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', animateGradually: { enabled: false }, dynamicAnimation: { speed: 350 } },
      background: 'transparent',
    },
    xaxis: {
      type: 'datetime',
      labels: { datetimeUTC: false, style: { colors: theme.palette.text.primary } },
      axisBorder: { show: true, color: theme.palette.divider },
      axisTicks: { show: true, color: theme.palette.divider },
    },
    yaxis: {
      title: {
        text: 'Hours Slept',
        style: { color: theme.palette.text.primary, fontSize: '14px', fontWeight: 'bold' },
      },
      labels: { style: { colors: theme.palette.text.primary } },
      min: 0,
      max: 12,
      tickAmount: 6,
    },
    tooltip: {
      x: { format: 'dd MMM yyyy HH:mm' },
      theme: theme.palette.mode,
      style: { fontSize: '12px' },
    },
    stroke: { curve: 'smooth', width: 3 },
    markers: { size: 5 },
    grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
    legend: { labels: { colors: theme.palette.text.primary } },
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleLogSleep = async (logData) => {
    if (!logData.startTime || !logData.endTime) {
      showSnackbar('Please enter both start and end times.', 'warning');
      return;
    }
    if (new Date(logData.endTime) <= new Date(logData.startTime)) {
      showSnackbar('End time must be after start time.', 'error');
      return;
    }
    const newLog = {
      startTime: logData.startTime,
      endTime: logData.endTime,
      notes: logData.notes,
      qualityRating: logData.qualityRating,
      factors: logData.factors,
    };

    try {
      await addSleepLog(newLog);
      showSnackbar('Sleep logged successfully and synced to Firebase!', 'success');
      setIsEditing(false);
      setEditLogId(null);
      setInitialFormValues({});
      // Reset previous analysis when new log is added
      setSleepAnalysis('');
    } catch (err) {
      console.error("Firebase add sleep log error:", err);
      showSnackbar('Failed to save sleep log to Firebase.', 'error');
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await deleteSleepLog(id);
      showSnackbar('Sleep log deleted successfully from Firebase!', 'success');
    } catch (error) {
      console.error("Error deleting sleep log:", error);
      showSnackbar('Failed to delete sleep log from Firebase.', 'error');
    }
  };

  const handleEditLog = (log) => {
    setIsEditing(true);
    setEditLogId(log.id);
    setInitialFormValues(log);
  };

  // Helper to calculate average sleep duration (used in sleep analysis)
  const calculateAverageSleep = () => {
    if (sleepLogs.length === 0) return 0;
    const totalHours = sleepLogs.reduce((sum, log) => {
      const start = new Date(log.startTime).getTime();
      const end = new Date(log.endTime).getTime();
      return sum + (end - start) / (1000 * 60 * 60);
    }, 0);
    return (totalHours / sleepLogs.length).toFixed(2);
  };

  // Gemini-powered function to analyze sleep logs and provide insights (using markdown formatting)
  const analyzeSleepLogs = async () => {
    if (sleepLogs.length === 0) {
      showSnackbar("No sleep logs to analyze.", "warning");
      return;
    }
    setAnalyzingSleep(true);
    const avgSleep = calculateAverageSleep();
    // Collect unique factors from all logs
    const allFactors = sleepLogs.flatMap(log => log.factors || []);
    const uniqueFactors = [...new Set(allFactors)];
    const prompt = `I have been tracking my sleep. I have logged ${sleepLogs.length} sleep sessions with an average sleep duration of ${avgSleep} hours. My sleep quality ratings range from 1 (Poor) to 5 (Excellent). Some factors that may have affected my sleep include: ${uniqueFactors.join(', ') || "None"}.  
      
**Provide a  analysis** of my sleep patterns and offer **personalized recommendations** to improve my sleep quality and duration. Format your response using Markdown (e.g., **bold** and *italic* styling).`;
    try {
      const result = await sleepModel.generateContent(prompt);
      const analysisText = result.response.text() || "";
      setSleepAnalysis(analysisText);
    } catch (error) {
      console.error("Error analyzing sleep logs:", error);
      showSnackbar("Failed to analyze sleep logs.", "error");
    } finally {
      setAnalyzingSleep(false);
    }
  };

  return (
    <PageLayout>
      {showSplash && <SleepQualityMonitorSplash onComplete={handleTutorialComplete} />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          minHeight: '100vh',
          background: theme.palette.background.gradient || theme.palette.background.default,
          paddingTop: theme.spacing(8),
          paddingBottom: theme.spacing(10),
          color: theme.palette.text.primary,
        }}
      >
        <Container maxWidth="md">
          <Paper elevation={3} sx={{
            padding: theme.spacing(4),
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: 'rgba(17, 12, 46, 0.15) 0px 48px 100px 0px',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: 'rgba(17, 12, 46, 0.2) 0px 48px 100px 0px',
              transform: 'translateY(-6px)',
            },
            color: theme.palette.text.primary
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: theme.palette.primary.main, display: 'flex', alignItems: 'center' }}>
                <BedtimeIcon sx={{ mr: 1, fontSize: '2.5rem' }} /> Sleep Quality Monitor
              </Typography>
              <Tooltip title="Understand how to use this feature">
                <IconButton color="primary" aria-label="Help">
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {isEditing ? 'Edit Sleep Log' : 'Log Your Sleep'}
                </Typography>
                <SleepLogForm
                  onSubmit={handleLogSleep}
                  factorOptions={factorOptions}
                  initialValues={initialFormValues}
                  isEditing={isEditing}
                />

                <SleepHistoryChart sleepLogs={sleepLogs} chartOptions={baseChartOptions} theme={theme} />
                <SleepStats sleepLogs={sleepLogs} theme={theme} />

                {/* Gemini Sleep Insights Section */}
                <Box mt={3} mb={2} textAlign="center">
                  <GradientButton onClick={analyzeSleepLogs} disabled={analyzingSleep || sleepLogs.length === 0}>
                    {analyzingSleep ? <CircularProgress size={24} color="inherit" /> : "Get Sleep Insights"}
                  </GradientButton>
                </Box>
                {sleepAnalysis && (
                  <Box mb={3}>
                    <Alert severity="info">
                      <ReactMarkdown>{sleepAnalysis}</ReactMarkdown>
                    </Alert>
                  </Box>
                )}

                <SleepLogList sleepLogs={sleepLogs} onDeleteLog={handleDeleteLog} onEditLog={handleEditLog} theme={theme} />
              </>
            )}
          </Paper>
        </Container>
      </motion.div>
      <SplashScreenToggle onShowSplash={handleShowSplash} />
    </PageLayout>
  );
};

export default SleepQualityMonitor;
