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
  DialogTitle,
  Avatar,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, alpha } from '@mui/system';
import {
  Bedtime as BedtimeIcon,
  Delete as DeleteIcon,
  Timeline as TimelineIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  HelpOutline as HelpOutlineIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  FormatListBulleted as FormatListBulletedIcon,
  Insights as InsightsIcon,
} from '@mui/icons-material';
import Chart from 'react-apexcharts';
import { SleepContext } from '../contexts/SleepContext';
import PageLayout from '../components/PageLayout';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import SleepQualityMonitorSplash from '../components/SleepQualityMonitorSplash';
import SplashScreenToggle from '../components/SplashScreenToggle';

// Initialize Gemini API using your API key from .env
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
if (!apiKey) {
  console.error("REACT_APP_GEMINI_API_KEY is not set in your environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);
const sleepModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.6, -0.05, 0.01, 0.99],
      when: 'beforeChildren',
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.6
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99]
    }
  }
};

// Styled components
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

// Styled Slider Component
const StyledSlider = styled(Slider, {
  shouldForwardProp: (prop) => prop !== 'isMobile',
})(({ theme, isMobile }) => ({
  color: theme.palette.primary.main,
  height: 3,
  padding: '35px 0',
  '& .MuiSlider-track': {
    border: 'none',
    height: 3,
    background: `linear-gradient(to right, 
      ${theme.palette.primary.main}, 
      ${theme.palette.secondary.main}
    )`,
  },
  '& .MuiSlider-rail': {
    height: 3,
    opacity: 0.38,
    backgroundColor: theme.palette.grey[300],
  },
  '& .MuiSlider-thumb': {
    height: isMobile ? 20 : 22,
    width: isMobile ? 20 : 22,
    backgroundColor: theme.palette.background.paper,
    border: `2px solid currentColor`,
    transition: theme.transitions.create(['box-shadow']),
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
    },
    '&.Mui-active': {
      boxShadow: `0 0 0 12px ${alpha(theme.palette.primary.main, 0.16)}`,
    },
  },
  '& .MuiSlider-valueLabel': {
    fontSize: 13,
    fontWeight: 'normal',
    top: -10,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 8,
    padding: '4px 8px',
    '&:before': {
      display: 'none',
    },
    '& *': {
      background: 'transparent',
    },
  },
  '& .MuiSlider-mark': {
    backgroundColor: theme.palette.grey[400],
    height: 3,
    width: 3,
    borderRadius: '50%',
    '&.MuiSlider-markActive': {
      opacity: 1,
      backgroundColor: 'currentColor',
    },
  },
  '& .MuiSlider-markLabel': {
    fontSize: '1.2rem',
    marginTop: 8,
    '&.MuiSlider-markLabelActive': {
      color: theme.palette.text.primary,
    },
  },
}));

const GlowingPaper = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(3),
  borderRadius: 24,
  background: `linear-gradient(145deg, 
    ${alpha(theme.palette.background.paper, 0.9)}, 
    ${alpha(theme.palette.background.paper, 0.95)}
  )`,
  backdropFilter: 'blur(10px)',
  boxShadow: `
    0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)},
    0 0 0 1px ${alpha(theme.palette.primary.main, 0.05)},
    inset 0 0 80px ${alpha(theme.palette.primary.main, 0.05)}
  `,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `
      0 12px 48px 0 ${alpha(theme.palette.common.black, 0.12)},
      0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)},
      inset 0 0 100px ${alpha(theme.palette.primary.main, 0.08)}
    `,
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main}, 
      ${theme.palette.secondary.main}, 
      ${theme.palette.primary.main}
    )`,
    backgroundSize: '200% 100%',
    animation: 'gradient 8s linear infinite',
  },
  '@keyframes gradient': {
    '0%': { backgroundPosition: '0% 50%' },
    '100%': { backgroundPosition: '200% 50%' }
  }
}));

const FloatingIcon = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(3),
  right: theme.spacing(3),
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  color: theme.palette.common.white,
  animation: 'float 3s ease-in-out infinite',
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' }
  }
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  '&:before': {
    display: 'none',
  },
  '& .MuiAccordionSummary-root': {
    borderRadius: 12,
    backgroundColor: alpha(theme.palette.background.paper, 0.6),
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.8),
    }
  },
  '& .MuiAccordionDetails-root': {
    padding: theme.spacing(3),
    backgroundColor: 'transparent',
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(8px)',
}));

// *** START: SleepLogForm Component ***
const SleepLogForm = ({ onSubmit, initialValues = {}, factorOptions, isEditing }) => {
  const [startTime, setStartTime] = useState(initialValues.startTime || '');
  const [endTime, setEndTime] = useState(initialValues.endTime || '');
  const [notes, setNotes] = useState(initialValues.notes || '');
  const [sleepQualityRating, setSleepQualityRating] = useState(initialValues.qualityRating || 3);
  const [showFactors, setShowFactors] = useState(false);
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
      <Grid container spacing={3}>
        {/* Time Selection */}
        <Grid item xs={12} md={6}>
          <motion.div variants={itemVariants}>
            <GlowingPaper sx={{ 
              minHeight: '100%', 
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              height: '280px'
            }}>
              <FloatingIcon>
                <BedtimeIcon />
              </FloatingIcon>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: theme.palette.primary.main,
                fontWeight: 600,
                mb: 3
              }}>
                When did you sleep?
              </Typography>
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Bedtime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                          },
                          '&.Mui-focused': {
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Wake time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`
                          },
                          '&.Mui-focused': {
                            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                          }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </GlowingPaper>
          </motion.div>
        </Grid>

        {/* Sleep Quality Rating */}
        <Grid item xs={12} md={6}>
          <motion.div variants={itemVariants}>
            <GlowingPaper sx={{ 
              minHeight: '100%', 
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              height: '280px'
            }}>
              <FloatingIcon>
                <InsightsIcon />
              </FloatingIcon>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: theme.palette.primary.main,
                fontWeight: 600,
                mb: 3
              }}>
                How well did you sleep?
              </Typography>
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 2
              }}>
                <StyledSlider
                  isMobile={isMobile}
                  value={sleepQualityRating}
                  onChange={(e, newValue) => setSleepQualityRating(newValue)}
                  step={1}
                  marks={[
                    { value: 1, label: '😴' },
                    { value: 2, label: '🥱' },
                    { value: 3, label: '😊' },
                    { value: 4, label: '😃' },
                    { value: 5, label: '🤩' },
                  ]}
                  min={1}
                  max={5}
                  valueLabelDisplay="on"
                  valueLabelFormat={(value) => {
                    const labels = {
                      1: 'Poor',
                      2: 'Fair',
                      3: 'Good',
                      4: 'Very Good',
                      5: 'Excellent'
                    };
                    return labels[value];
                  }}
                />
                <Box sx={{ 
                  mt: 2,
                  display: 'flex', 
                  justifyContent: 'space-between',
                  px: 1
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Poor</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Excellent</Typography>
                </Box>
              </Box>
            </GlowingPaper>
          </motion.div>
        </Grid>

        {/* Optional Details Button */}
        <Grid item xs={12}>
          <motion.div variants={itemVariants}>
            <Button
              variant="outlined"
              onClick={() => setShowFactors(!showFactors)}
              startIcon={showFactors ? <HelpOutlineIcon /> : <HelpOutlineIcon />}
              sx={{ 
                mb: 2,
                borderRadius: 8,
                borderWidth: 2,
                background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.95)})`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.15)}`
                }
              }}
            >
              {showFactors ? "Hide Additional Details" : "Add More Details (Optional)"}
            </Button>

            <AnimatePresence>
              {showFactors && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <GlowingPaper>
                        <FloatingIcon>
                          <HelpOutlineIcon />
                        </FloatingIcon>
                        <Typography variant="h6" gutterBottom sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          mb: 3
                        }}>
                          What affected your sleep?
                        </Typography>
                        <Grid container spacing={1}>
                          {factorOptions.map((factor) => (
                            <Grid item xs={6} sm={4} key={factor}>
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <FormControlLabel
                                  control={
                                    <Checkbox 
                                      checked={sleepFactors.includes(factor)} 
                                      onChange={handleFactorChange(factor)}
                                      sx={{
                                        color: theme.palette.primary.main,
                                        '&.Mui-checked': {
                                          color: theme.palette.primary.main,
                                        }
                                      }}
                                    />
                                  }
                                  label={factor}
                                  sx={{
                                    '& .MuiFormControlLabel-label': {
                                      fontSize: '0.9rem'
                                    }
                                  }}
                                />
                              </motion.div>
                            </Grid>
                          ))}
                        </Grid>
                      </GlowingPaper>
                    </Grid>
                  </Grid>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <motion.div 
            variants={itemVariants}
            style={{ textAlign: 'center' }}
          >
            <GradientButton 
              type="submit" 
              variant="contained" 
              startIcon={<CheckCircleOutlineIcon />}
              sx={{ 
                minWidth: 250,
                py: 1.8,
                fontSize: '1.1rem',
                borderRadius: 8,
                background: `linear-gradient(45deg, 
                  ${theme.palette.primary.main}, 
                  ${theme.palette.secondary.main}
                )`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  background: `linear-gradient(45deg, 
                    ${theme.palette.primary.dark}, 
                    ${theme.palette.secondary.dark}
                  )`,
                  boxShadow: `0 6px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {isEditing ? 'Update Sleep Log' : 'Save Sleep Log'}
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      <Container maxWidth="md">
        {/* Page Header */}
        <Box textAlign="center" mb={6}>
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: { xs: '0.25rem', sm: '0.5rem' }, 
              mb: 2,
              position: 'relative'
            }}>
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                component="h1"
                sx={{
                  fontWeight: 800,
                  position: 'relative',
                  zIndex: 1,
                  background: `linear-gradient(135deg, 
                    ${theme.palette.primary.main} 0%, 
                    ${theme.palette.secondary.main} 50%,
                    ${theme.palette.primary.main} 100%
                  )`,
                  backgroundSize: '200% auto',
                  animation: 'gradient 8s linear infinite',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  textShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <BedtimeIcon sx={{ 
                  fontSize: 'inherit',
                  color: theme.palette.primary.main,
                  filter: `drop-shadow(0 2px 4px ${alpha(theme.palette.primary.main, 0.3)})`
                }} />
                Sleep Quality Monitor
              </Typography>
            </Box>
            <Typography 
              variant="subtitle1" 
              sx={{
                color: alpha(theme.palette.text.primary, 0.8),
                maxWidth: '600px',
                margin: '0 auto',
                fontSize: '1.1rem'
              }}
            >
              Track and analyze your sleep patterns for better rest
            </Typography>
          </motion.div>
        </Box>

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <SleepLogForm
              onSubmit={handleLogSleep}
              factorOptions={factorOptions}
              initialValues={initialFormValues}
              isEditing={isEditing}
            />
          )}
        </motion.div>

        {/* History Section - Only show if there are logs */}
        {sleepLogs.length > 0 && (
          <motion.div variants={itemVariants}>
            <Box mt={4}>
              <StyledAccordion>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      margin: '12px 0',
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: theme.palette.primary.main,
                    fontWeight: 600
                  }}>
                    <TimelineIcon /> Sleep History
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <StyledPaper>
                      <SleepHistoryChart sleepLogs={sleepLogs} chartOptions={baseChartOptions} theme={theme} />
                      <Box mt={3} textAlign="center">
                        <GradientButton 
                          onClick={analyzeSleepLogs} 
                          disabled={analyzingSleep} 
                          startIcon={analyzingSleep ? <CircularProgress size={20} /> : <InsightsIcon />}
                          sx={{ minWidth: 200 }}
                        >
                          Get Sleep Insights
                        </GradientButton>
                      </Box>
                      {sleepAnalysis && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          <Alert 
                            severity="info" 
                            sx={{ 
                              mt: 3,
                              borderRadius: 2,
                              '& .MuiAlert-message': {
                                width: '100%'
                              }
                            }}
                          >
                            <ReactMarkdown>{sleepAnalysis}</ReactMarkdown>
                          </Alert>
                        </motion.div>
                      )}
                    </StyledPaper>
                  </motion.div>
                </AccordionDetails>
              </StyledAccordion>

              <StyledAccordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6" sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: theme.palette.primary.main,
                    fontWeight: 600
                  }}>
                    <FormatListBulletedIcon /> Previous Logs
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <SleepLogList sleepLogs={sleepLogs} onDeleteLog={handleDeleteLog} onEditLog={handleEditLog} theme={theme} />
                </AccordionDetails>
              </StyledAccordion>
            </Box>
          </motion.div>
        )}
      </Container>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ 
            borderRadius: 2,
            boxShadow: theme.shadows[4]
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default SleepQualityMonitor;