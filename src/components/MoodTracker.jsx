// src/pages/MoodTracker.jsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  DialogActions
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
import 'chartjs-adapter-date-fns'; // Import the date adapter

Chart.register(...registerables);

// Define motion variants for hover effects
const emojiVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.3, rotate: 10, transition: { type: 'spring', stiffness: 300 } },
};

const moodOptions = [
  { value: 1, label: '😢 Very Low', color: '#ef4444' },
  { value: 2, label: '😞 Low', color: '#f97316' },
  { value: 3, label: '😐 Neutral', color: '#eab308' },
  { value: 4, label: '🙂 Good', color: '#84cc16' },
  { value: 5, label: '😁 Excellent', color: '#10b981' },
];

const MoodTracker = () => {
  const theme = useTheme();
  const [moodEntries, setMoodEntries] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [dailyNotes, setDailyNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const inputRef = useRef(null);

  // Optional: Clear localStorage during development
  // useEffect(() => {
  //   localStorage.removeItem('moodEntries');
  // }, []);

  // Load and migrate mood entries from localStorage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('moodEntries');
      if (saved) {
        const parsedEntries = JSON.parse(saved).map(entry => {
          if (entry.date && !entry.timestamp) {
            // Convert 'date' to 'timestamp' by appending a default time (e.g., noon)
            const timestamp = `${entry.date}T12:00:00Z`;
            return { ...entry, timestamp };
          }
          return entry;
        }).filter(entry => entry.timestamp && !isNaN(new Date(entry.timestamp).getTime()));
        setMoodEntries(parsedEntries);
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
    }
  }, []);

  // Save mood entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
    } catch (error) {
      console.error('Error saving mood entries:', error);
    }
  }, [moodEntries]);

  // Function to add a new mood entry
  const addMood = () => {
    if (!selectedMood) return;

    const now = new Date();
    const timestamp = now.toISOString(); // Full timestamp

    const newEntry = {
      id: Date.now(),
      timestamp, // Use timestamp instead of just date
      mood: selectedMood,
      notes: dailyNotes,
    };

    setMoodEntries(prev => [...prev, newEntry]);
    setSelectedMood(null);
    setDailyNotes('');
    inputRef.current?.focus();
  };

  // Function to open edit modal
  const editMood = (entry) => {
    setEditEntry(entry);
    setIsModalOpen(true);
  };

  // Function to update an existing mood entry
  const updateMood = (updatedEntry) => {
    setMoodEntries(prev => prev.map(entry => entry.id === updatedEntry.id ? { ...updatedEntry, timestamp: entry.timestamp } : entry));
    setIsModalOpen(false);
    setEditEntry(null);
  };

  // Function to delete a mood entry
  const deleteMood = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setMoodEntries(prev => prev.filter(entry => entry.id !== id));
    }
  };

  // Prepare chart data and options
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
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: sortedEntries.map(entry => moodOptions.find(o => o.value === entry.mood)?.color),
        fill: true,
      }]
    };
  }, [moodEntries, theme.palette.primary.main]);

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
          maxTicksLimit: 10,
        },
        grid: { color: theme.palette.divider },
      }
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
  }), [moodEntries, theme.palette.text.secondary, theme.palette.divider]);

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 10 }}>
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
          Mood Journal 📆
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Track your moods to gain insights into your emotional well-being.
        </Typography>
      </Box>

      {/* Mood Selection */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
          How are you feeling today?
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          {moodOptions.map(option => (
            <Grid item key={option.value}>
              <Tooltip title={option.label}>
                <IconButton
                  onClick={() => setSelectedMood(option.value)}
                  sx={{
                    width: 80,
                    height: 80,
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
                    initial="initial"
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

      {/* Journal Entry */}
      <Box mb={4}>
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

      {/* Add Mood Button */}
      <Box mb={6} textAlign="center">
        <Button
          variant="contained"
          color="primary"
          onClick={addMood}
          disabled={!selectedMood}
          startIcon={
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          }
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 3,
            boxShadow: 3,
            transition: 'background-color 0.3s, box-shadow 0.3s',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              boxShadow: 6,
            }
          }}
        >
          Add Journal Entry
        </Button>
      </Box>

      {/* Mood Timeline Chart */}
      {moodEntries.length > 0 ? (
        <Box mb={6}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', color: theme.palette.text.primary }}>
            Mood Timeline
          </Typography>
          <Box sx={{ position: 'relative', height: 400 }}>
            <Line 
              data={chartData} 
              options={chartOptions} 
            />
          </Box>
        </Box>
      ) : (
        <Box mb={6} textAlign="center">
          <Typography variant="body1" color="textSecondary">
            Your mood history will appear here once you start logging entries.
          </Typography>
        </Box>
      )}

      {/* Mood Entries List */}
      {moodEntries.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center', color: theme.palette.text.primary }}>
            Logged Entries
          </Typography>
          <List>
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
                        <IconButton edge="end" onClick={() => editMood(entry)} aria-label="edit">
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Entry">
                        <IconButton edge="end" onClick={() => deleteMood(entry.id)} aria-label="delete">
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
                          bgcolor: `${moodOptions.find(o => o.value === entry.mood)?.color}40` 
                        }}
                      >
                        {moodOptions.find(o => o.value === entry.mood)?.label.split(' ')[0]}
                      </Avatar>
                    </motion.div>
                  </ListItemAvatar>
                  <ListItemText
                    primary={entry.timestamp ? format(parseISO(entry.timestamp), 'MMMM d, yyyy, h:mm a') : 'Unknown Date'}
                    secondary={entry.notes || 'No notes'}
                  />
                </ListItem>
              ))
            }
          </List>
        </Box>
      )}

      {/* Edit Mood Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Mood Entry</DialogTitle>
        <DialogContent>
          {editEntry && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Date: {editEntry.timestamp ? format(parseISO(editEntry.timestamp), 'MMMM d, yyyy, h:mm a') : 'Unknown Date'}
              </Typography>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  How are you feeling?
                </Typography>
                <Grid container spacing={2}>
                  {moodOptions.map(option => (
                    <Grid item key={option.value}>
                      <Tooltip title={option.label}>
                        <IconButton
                          onClick={() => setEditEntry(prev => ({ ...prev, mood: option.value }))}
                          sx={{
                            width: 60,
                            height: 60,
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
                            initial="initial"
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
                <Typography variant="h6" gutterBottom>
                  Journal Entry (optional)
                </Typography>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={() => updateMood(editEntry)} 
            variant="contained" 
            color="primary"
            disabled={!editEntry?.mood}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MoodTracker;
