// src/pages/MoodTracker.jsx

import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  useMediaQuery // Import useMediaQuery from MUI
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import 'chartjs-adapter-date-fns';
import { styled } from '@mui/system';
import { MoodContext } from '../contexts/MoodContext';
import PageLayout from '../components/PageLayout'; // Import PageLayout

Chart.register(...registerables);

// Styled Gradient Button
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
  color: '#FFFFFF',
  borderRadius: '8px',
  padding: '8px 16px',
  boxShadow: theme.shadows[4],
  transition: 'all 0.3s ease',
  fontWeight: 600,
  fontFamily: 'Roboto, sans-serif',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
    boxShadow: theme.shadows[6],
    transform: 'translateY(-2px)',
  },
}));

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const emojiVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20
    }
  },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6
    }
  },
};

// Mood Options
const moodOptions = [
  { value: 1, label: '😢 Very Low', color: '#ef4444' },
  { value: 2, label: '😞 Low', color: '#f97316' },
  { value: 3, label: '😐 Neutral', color: '#eab308' },
  { value: 4, label: '🙂 Good', color: '#84cc16' },
  { value: 5, label: '😁 Excellent', color: '#10b981' },
];

const MoodTracker = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Check if it's mobile
  const {
    moodEntries,
    addMood,
    editMood,
    deleteMood,
    loading,
    error
  } = useContext(MoodContext);

  const [selectedMood, setSelectedMood] = useState(null);
  const [dailyNotes, setDailyNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const inputRef = useRef(null);

  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle external errors
  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (!loading && !error && success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, loading, error]);

  // Add Mood Entry
  const handleAddMood = async () => {
    if (!selectedMood) {
      setLocalError('Please select a mood before adding an entry.');
      return;
    }

    try {
      await addMood(selectedMood, dailyNotes);
      setSuccess('Mood entry added successfully!');
      setSelectedMood(null);
      setDailyNotes('');
      inputRef.current?.focus();
    } catch (err) {
      // Error is handled by MoodContext
    }
  };

  // Edit Mood Entry
  const handleEditMood = (entry) => {
    setEditEntry(entry);
    setIsModalOpen(true);
  };

  // Update Mood Entry
  const handleUpdateMood = async () => {
    if (!editEntry?.mood) {
      setLocalError('Please select a mood before saving changes.');
      return;
    }

    try {
      await editMood(editEntry.id, editEntry.mood, editEntry.notes);
      setSuccess('Mood entry updated successfully!');
      setIsModalOpen(false);
      setEditEntry(null);
    } catch (err) {
      // Error is handled by MoodContext
    }
  };

  // Delete Mood Entry
  const handleDeleteMood = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteMood(id);
        setSuccess('Mood entry deleted successfully!');
      } catch (err) {
        // Error is handled by MoodContext
      }
    }
  };

  // Prepare Chart Data
  const chartData = useMemo(() => {
    const validEntries = moodEntries.filter(entry => entry.timestamp && !isNaN(new Date(entry.timestamp).getTime()));
    const sortedEntries = [...validEntries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    return {
      labels: sortedEntries.map(entry => entry.timestamp),
      datasets: [{
        label: 'Mood Level',
        data: sortedEntries.map(entry => entry.mood),
        borderColor: theme.palette.primary.main,
        backgroundColor: sortedEntries.map(entry => `${moodOptions.find(o => o.value === entry.mood)?.color}40`),
        tension: 0.4,
        pointRadius: isMobile ? 3 : 6, // Adjust point radius for mobile
        pointHoverRadius: isMobile ? 4 : 8, // Adjust hover radius for mobile
        pointBackgroundColor: sortedEntries.map(entry => moodOptions.find(o => o.value === entry.mood)?.color),
        fill: true,
      }]
    };
  }, [moodEntries, theme.palette.primary.main, isMobile]);

  // Chart Options
  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (context) => {
            const rawTimestamp = context[0].label;
            if (!rawTimestamp) return '';
            const parsedDate = parseISO(rawTimestamp);
            return !isNaN(parsedDate.getTime()) ? format(parsedDate, 'MMM d, yyyy, h:mm a') : rawTimestamp;
          },
          label: (context) => {
            const rawTimestamp = context.label;
            const entry = moodEntries.find(e => e.timestamp === rawTimestamp);
            if (!entry) return '';
            return [
              `Mood: ${moodOptions.find(o => o.value === entry.mood)?.label}`,
              `Notes: ${entry.notes || 'No notes'}`
            ];
          }
        }
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { enabled: true, mode: 'x' },
      }
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
          color: theme.palette.text.secondary,
          callback: (value) => moodOptions.find(o => o.value === value)?.label,
          font: { size: isMobile ? 10 : 12 } // Adjust font size for mobile
        },
        grid: { color: theme.palette.divider },
      },
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM d, yyyy, h:mm a',
          displayFormats: {
            day: 'MMM d',
            hour: 'h a',
          }
        },
        ticks: {
          color: theme.palette.text.secondary,
          autoSkip: true,
          maxTicksLimit: isMobile ? 5 : 10, // Reduce ticks for mobile
          font: { size: isMobile ? 10 : 12 } // Adjust font size for mobile
        },
        grid: { color: theme.palette.divider },
      }
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
  }), [moodEntries, theme.palette.text.secondary, theme.palette.divider, isMobile]);

  return (
    <PageLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          minHeight: '100vh',
          background: theme.palette.background.gradient || theme.palette.background.default,
          paddingTop: theme.spacing(isMobile ? 4 : 8), // Adjust padding for mobile
          paddingBottom: theme.spacing(isMobile ? 6 : 10), // Adjust padding for mobile
        }}
      >
        <Container maxWidth="md"> {/* Keep original container structure */}
          <motion.div
            variants={textVariants}
            initial="hidden"
            animate="visible"
          >
            <Box textAlign="center" mb={isMobile ? 4 : 6}> {/* Keep existing Box */}
              <Typography variant={isMobile ? 'h5' : 'h4'} component="h2" gutterBottom sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Mood Journal 📆
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Track your moods to gain insights into your emotional well-being.
              </Typography>
            </Box>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Box mb={isMobile ? 3 : 4}> {/* Keep existing Box */}
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                  How are you feeling today?
                </Typography>
              </motion.div>
              <Grid container spacing={2} justifyContent="center">
                {moodOptions.map(option => (
                  <Grid item key={option.value}>
                    <motion.div variants={emojiVariants}>
                      <Tooltip title={option.label}>
                        <IconButton
                          onClick={() => setSelectedMood(option.value)}
                          sx={{
                            width: isMobile ? 60 : 80, // Adjust size for mobile
                            height: isMobile ? 60 : 80, // Adjust height for mobile
                            bgcolor: `${option.color}20`,
                            border: selectedMood === option.value ? `4px solid ${option.color}` : `2px solid ${theme.palette.divider}`,
                            borderRadius: '50%',
                            transition: 'transform 0.2s, border 0.2s',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              bgcolor: `${option.color}30`,
                            }
                          }}
                          aria-label={option.label}
                        >
                          <motion.span
                            variants={emojiVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover="hover"
                            style={{ display: 'inline-block' }}
                          >
                            <Typography variant="h5">
                              {option.label.split(' ')[0]}
                            </Typography>
                          </motion.span>
                        </IconButton>
                      </Tooltip>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>

          <motion.div
            variants={textVariants}
            initial="hidden"
            animate="visible"
          >
            <Box mb={isMobile ? 3 : 4}>
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                Journal Entry (optional)
              </Typography>
              <TextField
                value={dailyNotes}
                onChange={(e) => setDailyNotes(e.target.value)}
                placeholder="Write about your day, thoughts, or anything you want to remember..."
                variant="outlined"
                fullWidth
                multiline
                minRows={3}
                inputRef={inputRef}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
                    },
                  },
                }}
              />
            </Box>
          </motion.div>

          <Box mb={isMobile ? 4 : 6} textAlign="center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <GradientButton
                variant="contained"
                color="primary"
                onClick={handleAddMood}
                disabled={loading || !selectedMood}
                sx={{
                  px: isMobile ? 3 : 4, // Adjust padding for mobile
                  py: isMobile ? 1 : 1.5, // Adjust padding for mobile
                  borderRadius: 3,
                  boxShadow: 3,
                  transition: 'background-color 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                    boxShadow: 6,
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Add Journal Entry'}
              </GradientButton>
            </motion.div>
          </Box>

          {moodEntries.length > 0 ? (
            <Box mb={isMobile ? 4 : 6}>
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  gutterBottom
                  sx={{ textAlign: 'center', color: theme.palette.text.primary }}
                >
                  Mood Timeline
                </Typography>
              </motion.div>
              <Box sx={{ position: 'relative', height: isMobile ? 300 : 400 }}>
                <Line
                  data={chartData}
                  options={chartOptions}
                />
              </Box>
            </Box>
          ) : (
            <Box mb={isMobile ? 4 : 6} textAlign="center">
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                <Typography
                  variant="body1"
                  color="textSecondary"
                  sx={{ px: isMobile ? 2 : 0 }}
                >
                  Your mood history will appear here once you start logging entries.
                </Typography>
              </motion.div>
            </Box>
          )}

          {moodEntries.length > 0 && (
            <Box>
              <motion.div
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  gutterBottom
                  sx={{ textAlign: 'center', color: theme.palette.text.primary }}
                >
                  Logged Entries
                </Typography>
              </motion.div>
              <List sx={{ px: isMobile ? 1 : 0 }}>
                {moodEntries
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map(entry => (
                    <ListItem
                      key={entry.id}
                      sx={{
                        mb: 2,
                        p: 2,
                        bgcolor: theme.palette.background.paper,
                        borderRadius: 2,
                        boxShadow: 1
                      }}
                      secondaryAction={
                        <Box>
                          <Tooltip title="Edit Entry">
                            <IconButton edge="end" onClick={() => handleEditMood(entry)} aria-label="edit" size={isMobile ? 'small' : 'medium'}>
                              <EditIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Entry">
                            <IconButton edge="end" onClick={() => handleDeleteMood(entry.id)} aria-label="delete" size={isMobile ? 'small' : 'medium'}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <motion.div
                          whileHover={{ scale: 1.3, rotate: 10 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: `${moodOptions.find(o => o.value === entry.mood)?.color}40`,
                              width: isMobile ? 40 : 50, // Adjust size for mobile
                              height: isMobile ? 40 : 50, // Adjust size for mobile
                              fontSize: isMobile ? '1rem' : '1.5rem' // Adjust font size for mobile
                            }}
                          >
                            {moodOptions.find(o => o.value === entry.mood)?.label.split(' ')[0]}
                          </Avatar>
                        </motion.div>
                      </ListItemAvatar>
                      <ListItemText
                        primaryTypographyProps={{ variant: isMobile ? 'subtitle2' : 'body1' }} // Adjust text variant for mobile
                        secondaryTypographyProps={{ variant: isMobile ? 'caption' : 'body2' }} // Adjust text variant for mobile
                        primary={entry.timestamp ? format(parseISO(entry.timestamp), 'MMMM d, yyyy, h:mm a') : 'Unknown Date'}
                        secondary={entry.notes || 'No notes'}
                      />
                    </ListItem>
                  ))
                }
              </List>
            </Box>
          )}

          {/* Edit Entry Dialog */}
          <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Mood Entry</DialogTitle>
            <DialogContent>
              {editEntry && (
                <Box>
                  <motion.div
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      Date: {editEntry.timestamp ? format(parseISO(editEntry.timestamp), 'MMMM d, yyyy, h:mm a') : 'Unknown Date'}
                    </Typography>
                  </motion.div>
                  <Box mb={3}>
                    <motion.div
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Typography variant="h6" gutterBottom>
                        How are you feeling?
                      </Typography>
                    </motion.div>
                    <Grid container spacing={2} justifyContent="center">
                      {moodOptions.map(option => (
                        <Grid item key={option.value}>
                          <Tooltip title={option.label}>
                            <IconButton
                              onClick={() => setEditEntry(prev => ({ ...prev, mood: option.value }))}
                              sx={{
                                width: isMobile ? 50 : 60, // Adjust size for mobile
                                height: isMobile ? 50 : 60, // Adjust size for mobile
                                bgcolor: `${option.color}20`,
                                border: editEntry.mood === option.value ? `4px solid ${option.color}` : `2px solid ${theme.palette.divider}`,
                                borderRadius: '50%',
                                transition: 'transform 0.2s, border 0.2s',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                  bgcolor: `${option.color}30`,
                                }
                              }}
                              aria-label={option.label}
                            >
                              <motion.span
                                variants={emojiVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                style={{ display: 'inline-block' }}
                              >
                                <Typography variant="h5">
                                  {option.label.split(' ')[0]}
                                </Typography>
                              </motion.span>
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                  <Box>
                    <motion.div
                      variants={textVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Typography variant="h6" gutterBottom>
                        Journal Entry (optional)
                      </Typography>
                    </motion.div>
                    <TextField
                      value={editEntry.notes}
                      onChange={(e) => setEditEntry(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Write about your day, thoughts, or anything you want to remember..."
                      variant="outlined"
                      fullWidth
                      multiline
                      minRows={3}
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: theme.palette.divider,
                          },
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                            boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              )}
              <Box mt={2}>
                {localError && <Alert severity="error">{localError}</Alert>}
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsModalOpen(false)} color="secondary" sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateMood}
                variant="contained"
                color="primary"
                disabled={loading || !editEntry?.mood}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Global Error and Success Alerts */}
          <Box mt={2}>
            {localError && <Alert severity="error">{localError}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
          </Box>
        </Container>
      </motion.div>
    </PageLayout>
  );
};

export default MoodTracker;
