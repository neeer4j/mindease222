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
  useMediaQuery,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Close as CloseIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { format, parseISO } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import 'chartjs-adapter-date-fns';
import { styled } from '@mui/system';
import { MoodContext } from '../contexts/MoodContext';
import PageLayout from '../components/PageLayout';

// Import Google Generative AI library
import { GoogleGenerativeAI } from "@google/generative-ai";
// Import ReactMarkdown to render markdown formatting
import ReactMarkdown from 'react-markdown';

// Add this import at the top with other imports
import MoodTrackerSplash from '../components/MoodTrackerSplash';
import SplashScreenToggle from '../components/SplashScreenToggle';

Chart.register(...registerables);

// Create a single instance of the Gemini model using your API key from env
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
if (!apiKey) {
  console.error("REACT_APP_GEMINI_API_KEY is not set in your environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

// Animation Variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const emojiVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// Mood Options
const moodOptions = [
  { value: 1, label: '😢 Very Low', color: '#ef4444' },
  { value: 2, label: '😞 Low', color: '#f97316' },
  { value: 3, label: '😐 Neutral', color: '#eab308' },
  { value: 4, label: '🙂 Good', color: '#84cc16' },
  { value: 5, label: '😁 Excellent', color: '#10b981' },
];

// Enhancement Options for the enhancement menu
const enhancementOptions = [
  { id: 'clarify', label: "Clarify" },
  { id: 'concise', label: "Make it Concise" },
  { id: 'descriptive', label: "Add Detail" },
  { id: 'emotional', label: "Enhance Emotional Tone" },
];

const MoodTracker = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { moodEntries, addMood, editMood, deleteMood, loading, error } = useContext(MoodContext);

  // Add splash screen state
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenTutorial = localStorage.getItem('moodTrackerTutorialSeen');
    return !hasSeenTutorial;
  });

  // Local state for mood, journal text, and AI-related data
  const [selectedMood, setSelectedMood] = useState(null);
  const [dailyNotes, setDailyNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  // Gemini AI related states
  const [aiAnalysis, setAiAnalysis] = useState(''); // Sentiment analysis result
  const [completionSuggestion, setCompletionSuggestion] = useState(''); // Auto-complete prompt suggestion
  const [enhancing, setEnhancing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Enhancement preview states
  const [enhancementPreview, setEnhancementPreview] = useState('');
  const [openEnhancementPreview, setOpenEnhancementPreview] = useState(false);
  const [enhancementType, setEnhancementType] = useState('');

  // Menu state for selecting enhancement type
  const [enhanceMenuAnchor, setEnhanceMenuAnchor] = useState(null);

  // Voice-to-text (audio journaling) state
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const inputRef = useRef(null);

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after a phrase
      recognition.interimResults = false; // Only final results
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        // Concatenate all the transcript results
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setDailyNotes(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API is not supported in this browser.");
    }
  }, []);

  // Toggle the voice-to-text recording
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  };

  // Handle external errors
  useEffect(() => {
    if (error) setLocalError(error);
  }, [error]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (!loading && !error && success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, loading, error]);

  // -------------------------
  // Google Generative AI Integration
  // -------------------------

  // Function to fetch sentiment analysis with markdown formatting
  const fetchMoodAnalysis = async (mood, text) => {
    setShowInsights(true); // Show insights when analysis is fetched
    try {
      // Get recent mood history for trend analysis
      const recentMoods = moodEntries
        .slice(-5)
        .map(entry => entry.mood)
        .filter(m => m !== undefined);
      
      const avgMood = recentMoods.length > 0 
        ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length 
        : mood;
      
      const trendDirection = mood > avgMood ? "improving" : mood < avgMood ? "declining" : "stable";

      const moodContext = `
Scale Context (1 is lowest, 5 is highest):
1 = Very Low (😢) - Feeling deeply down or distressed
2 = Low (😞) - Feeling down or upset
3 = Neutral (😐) - Neither particularly positive nor negative
4 = Good (🙂) - Feeling positive and upbeat
5 = Excellent (😁) - Feeling fantastic and energized

Current Mood Level: ${mood}
Recent Mood Trend: ${trendDirection}
Average Recent Mood: ${avgMood.toFixed(1)}
Journal Entry: "${text}"

Based on this context, please provide a comprehensive analysis including:
1. Current emotional state assessment
2. Mood trend analysis comparing current mood to recent average
3. Pattern recognition and potential mood triggers from the journal content
4. Tailored self-care recommendations based on current mood level
5. Specific coping strategies or mood maintenance tips
6. A personalized affirmation or encouragement message

Format the response in markdown with clear sections using ## headers.
Keep the analysis concise but meaningful.
If mood is low (1-2), focus on support and gentle encouragement.
If mood is neutral (3), focus on mindfulness and growth.
If mood is high (4-5), focus on maintaining positivity and gratitude.`;

      const result = await model.generateContent(moodContext);
      const analysis = result.response.text() || "";

      // Enhanced mood trend indicator with emoji and color context
      const getTrendEmoji = (trend) => {
        switch(trend) {
          case "improving": return "↗️";
          case "declining": return "↘️";
          default: return "➡️";
        }
      };

      const trendIndicator = `${getTrendEmoji(trendDirection)} **Mood Trend:** Your current mood (${mood}/5) is ${trendDirection} compared to your recent average (${avgMood.toFixed(1)}/5).\n\n`;

      const moodSummary = mood <= 2 ? 
        "⚠️ **Current State:** Your mood is on the lower end today. Remember that challenging emotions are temporary, and support is available when you need it." :
        mood >= 4 ?
        "🌟 **Current State:** You're experiencing positive emotions today! Let's explore ways to maintain this uplifted state." :
        "💭 **Current State:** You're in a balanced state today. This is an ideal time for reflection and personal growth.";

      return `${moodSummary}\n\n${trendIndicator}${analysis}`;
    } catch (err) {
      console.error("Error in mood analysis:", err);
      return "Unable to analyze mood at this moment. Remember that your feelings are valid, and it's okay to seek support when needed.";
    }
  };

  // Function to fetch auto-complete suggestions as the user types
  const fetchAutoCompletion = async (text) => {
    try {
      const prompt = `Given the journal entry "${text}", provide a short follow-up question to encourage deeper reflection.`;
      const result = await model.generateContent(prompt);
      if (result.response.text()) {
        setCompletionSuggestion(result.response.text());
      } else {
        setCompletionSuggestion("");
      }
    } catch (err) {
      console.error("Error fetching auto completion:", err);
      setCompletionSuggestion("");
    }
  };

  // Function to generate an enhancement preview based on the selected option
  const enhanceJournalEntry = async (option) => {
    try {
      setEnhancing(true);
      let prompt = "";
      switch (option) {
        case "clarify":
          prompt = `Clarify the following journal entry in a concise manner:\n\n"${dailyNotes}"`;
          break;
        case "concise":
          prompt = `Make the following journal entry more concise:\n\n"${dailyNotes}"`;
          break;
        case "descriptive":
          prompt = `Add a bit more detail to the following journal entry:\n\n"${dailyNotes}"`;
          break;
        case "emotional":
          prompt = `Enhance the emotional tone of the following journal entry in a short and supportive way:\n\n"${dailyNotes}"`;
          break;
        default:
          prompt = `Enhance the following journal entry:\n\n"${dailyNotes}"`;
      }
      const result = await model.generateContent(prompt);
      const enhancedText = result.response.text() || "";
      setEnhancementPreview(enhancedText);
      setOpenEnhancementPreview(true);
      setEnhancing(false);
    } catch (err) {
      console.error("Error enhancing journal entry:", err);
      setEnhancing(false);
      setLocalError("Failed to enhance entry.");
    }
  };

  // Debounce auto-complete suggestions for short journal entries
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dailyNotes && dailyNotes.trim().length > 0 && dailyNotes.trim().length < 50) {
        fetchAutoCompletion(dailyNotes);
      } else {
        setCompletionSuggestion("");
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [dailyNotes]);

  // Handler to add a mood entry and trigger sentiment analysis if text exists
  const handleAddMood = async () => {
    if (!selectedMood) {
      setLocalError("Please select a mood before adding an entry.");
      return;
    }
    try {
      await addMood(selectedMood, dailyNotes);
      setSuccess("Mood entry added successfully!");

      if (dailyNotes.trim().length > 0) {
        setAnalyzing(true);
        const analysis = await fetchMoodAnalysis(selectedMood, dailyNotes);
        setAiAnalysis(analysis);
        setAnalyzing(false);
      } else {
        setAiAnalysis("");
      }

      setSelectedMood(null);
      setDailyNotes("");
      inputRef.current?.focus();
    } catch (err) {
      // Error handled by MoodContext
    }
  };

  // Handler to edit a mood entry
  const handleEditMood = (entry) => {
    setEditEntry(entry);
    setIsModalOpen(true);
  };

  // Handler to update a mood entry
  const handleUpdateMood = async () => {
    if (!editEntry?.mood) {
      setLocalError("Please select a mood before saving changes.");
      return;
    }
    try {
      await editMood(editEntry.id, editEntry.mood, editEntry.notes);
      setSuccess("Mood entry updated successfully!");
      setIsModalOpen(false);
      setEditEntry(null);
    } catch (err) {
      // Error handled by MoodContext
    }
  };

  // Handler to delete a mood entry
  const handleDeleteMood = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteMood(id);
        setSuccess("Mood entry deleted successfully!");
      } catch (err) {
        // Error handled by MoodContext
      }
    }
  };

  // Chart data from mood entries
  const chartData = useMemo(() => {
    const validEntries = moodEntries.filter(
      (entry) => entry.timestamp && !isNaN(new Date(entry.timestamp).getTime())
    );
    const sortedEntries = [...validEntries].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Create gradient
    const ctx = document.createElement('canvas').getContext('2d');
    const gradient = ctx?.createLinearGradient(0, 0, 0, 400);
    gradient?.addColorStop(0, `${theme.palette.primary.main}40`);
    gradient?.addColorStop(1, `${theme.palette.background.default}00`);

    return {
      labels: sortedEntries.map((entry) => entry.timestamp),
      datasets: [
        {
          label: "Mood Level",
          data: sortedEntries.map((entry) => entry.mood),
          borderColor: theme.palette.primary.main,
          borderWidth: 3,
          backgroundColor: gradient || 'rgba(0,0,0,0.1)',
          tension: 0.4,
          pointRadius: isMobile ? 4 : 8,
          pointHoverRadius: isMobile ? 6 : 12,
          pointBackgroundColor: sortedEntries.map(
            (entry) => moodOptions.find((o) => o.value === entry.mood)?.color
          ),
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: theme.palette.primary.main,
          pointHoverBorderColor: '#fff',
          fill: true,
          cubicInterpolationMode: 'monotone',
        },
      ],
    };
  }, [moodEntries, theme.palette.primary.main, theme.palette.background.default, isMobile]);

  // Enhanced chart options
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animations: {
        radius: {
          duration: 400,
          easing: 'linear',
        },
        tension: {
          duration: 1000,
          easing: 'linear',
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: theme.palette.background.paper,
          titleColor: theme.palette.text.primary,
          bodyColor: theme.palette.text.secondary,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          bodyFont: {
            size: 13,
          },
          callbacks: {
            title: (context) => {
              const rawTimestamp = context[0].label;
              if (!rawTimestamp) return "";
              const parsedDate = parseISO(rawTimestamp);
              return !isNaN(parsedDate.getTime())
                ? format(parsedDate, "EEEE, MMM d, yyyy")
                : rawTimestamp;
            },
            label: (context) => {
              const rawTimestamp = context.raw;
              const entry = moodEntries.find((e) => e.mood === rawTimestamp);
              const moodLabel = moodOptions.find((o) => o.value === rawTimestamp)?.label;
              return [
                `Mood: ${moodLabel}`,
                entry?.notes ? `Notes: ${entry.notes}` : null
              ].filter(Boolean);
            },
          },
          displayColors: false,
        },
      },
      scales: {
        y: {
          min: 0.5,
          max: 5.5,
          grid: {
            display: true,
            color: `${theme.palette.divider}40`,
            drawBorder: false,
          },
          ticks: {
            stepSize: 1,
            padding: 10,
            color: theme.palette.text.secondary,
            font: {
              size: isMobile ? 11 : 13,
              family: 'Roboto',
            },
            callback: (value) => {
              const mood = moodOptions.find((o) => o.value === value);
              return mood ? mood.label.split(' ')[0] : '';
            },
          },
          border: {
            display: false,
          },
        },
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'PPP',
            displayFormats: {
              day: isMobile ? 'MMM d' : 'MMM d, yyyy',
            },
          },
          grid: {
            display: true,
            color: `${theme.palette.divider}40`,
            drawBorder: false,
          },
          ticks: {
            color: theme.palette.text.secondary,
            maxTicksLimit: isMobile ? 5 : 8,
            padding: 10,
            font: {
              size: isMobile ? 11 : 13,
              family: 'Roboto',
            },
          },
          border: {
            display: false,
          },
        },
      },
      elements: {
        line: {
          borderJoinStyle: 'round',
        },
      },
    }),
    [moodEntries, theme, isMobile]
  );

  // Handlers for the Enhance Entry menu
  const handleEnhanceButtonClick = (event) => {
    setEnhanceMenuAnchor(event.currentTarget);
  };

  const handleEnhanceMenuClose = () => {
    setEnhanceMenuAnchor(null);
  };

  // Called when a user selects an enhancement option from the menu
  const handleEnhancementOption = (optionId) => {
    setEnhancementType(optionId);
    handleEnhanceMenuClose();
    enhanceJournalEntry(optionId);
  };

  // Apply the enhancement preview to the journal entry
  const applyEnhancement = () => {
    setDailyNotes(enhancementPreview);
    setOpenEnhancementPreview(false);
    setEnhancementPreview('');
    setSuccess("Enhancement applied!");
  };

  // Add tutorial completion handler
  const handleTutorialComplete = () => {
    localStorage.setItem('moodTrackerTutorialSeen', 'true');
    setShowSplash(false);
  };

  // Update the splash screen state to be toggleable
  const handleShowSplash = () => {
    setShowSplash(true);
  };

  return (
    <PageLayout>
      {showSplash && <MoodTrackerSplash onComplete={handleTutorialComplete} />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          minHeight: "100vh",
          background: theme.palette.background.gradient || theme.palette.background.default,
          paddingTop: theme.spacing(isMobile ? 4 : 8),
          paddingBottom: theme.spacing(isMobile ? 6 : 10),
        }}
      >
        <Container maxWidth="md">
          {/* Header */}
          <motion.div variants={textVariants} initial="hidden" animate="visible">
            <Box textAlign="center" mb={isMobile ? 4 : 6}>
              <Typography variant={isMobile ? "h5" : "h4"} component="h2" gutterBottom sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Mood Journal 📆
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Track your moods to gain insights into your emotional well-being.
              </Typography>
            </Box>
          </motion.div>

          {/* Mood selection */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box mb={isMobile ? 3 : 4}>
              <motion.div variants={textVariants} initial="hidden" animate="visible">
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                  How are you feeling today?
                </Typography>
              </motion.div>
              <Grid container spacing={2} justifyContent="center">
                {moodOptions.map((option) => (
                  <Grid item key={option.value}>
                    <motion.div variants={emojiVariants}>
                      <Tooltip title={option.label}>
                        <IconButton
                          onClick={() => setSelectedMood(option.value)}
                          sx={{
                            width: isMobile ? 60 : 80,
                            height: isMobile ? 60 : 80,
                            bgcolor: `${option.color}20`,
                            border: selectedMood === option.value ? `4px solid ${option.color}` : `2px solid ${theme.palette.divider}`,
                            borderRadius: "50%",
                            transition: "transform 0.2s, border 0.2s",
                            "&:hover": { transform: "scale(1.05)", bgcolor: `${option.color}30` },
                          }}
                          aria-label={option.label}
                        >
                          <motion.span variants={emojiVariants} initial="hidden" animate="visible" whileHover="hover" style={{ display: "inline-block" }}>
                            <Typography variant="h5">{option.label.split(" ")[0]}</Typography>
                          </motion.span>
                        </IconButton>
                      </Tooltip>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>

          {/* Journal entry area with voice input and enhancement menu */}
          <motion.div variants={textVariants} initial="hidden" animate="visible">
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
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: theme.palette.divider },
                    "&:hover fieldset": { borderColor: theme.palette.primary.main },
                    "&.Mui-focused fieldset": {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
                    },
                  },
                }}
              />

              {/* Auto-complete suggestion */}
              {completionSuggestion && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                  Suggestion: {completionSuggestion}
                </Typography>
              )}

              {/* Voice Input Button */}
              <Box mt={1} display="flex" justifyContent="flex-end">
                <Button variant="text" color="primary" onClick={toggleListening}>
                  {listening ? (
                    <>
                      <MicOffIcon fontSize="small" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <MicIcon fontSize="small" /> Start Recording
                    </>
                  )}
                </Button>
              </Box>

              {/* Enhance Entry Button & Menu */}
              <Box mt={1} display="flex" justifyContent="flex-end">
                <Button variant="text" color="primary" onClick={handleEnhanceButtonClick} disabled={enhancing || !dailyNotes.trim()}>
                  {enhancing ? <CircularProgress size={20} color="inherit" /> : "Enhance Entry"}
                </Button>
                <Menu
                  anchorEl={enhanceMenuAnchor}
                  open={Boolean(enhanceMenuAnchor)}
                  onClose={handleEnhanceMenuClose}
                >
                  {enhancementOptions.map((option) => (
                    <MenuItem key={option.id} onClick={() => handleEnhancementOption(option.id)}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            </Box>
          </motion.div>

          {/* Add Entry Button */}
          <Box mb={isMobile ? 4 : 6} textAlign="center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <GradientButton
                variant="contained"
                color="primary"
                onClick={handleAddMood}
                disabled={loading || !selectedMood}
                sx={{
                  px: isMobile ? 3 : 4,
                  py: isMobile ? 1 : 1.5,
                  borderRadius: 3,
                  boxShadow: 3,
                  transition: "background-color 0.3s, box-shadow 0.3s",
                  "&:hover": { backgroundColor: theme.palette.primary.dark, boxShadow: 6 },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Add Journal Entry"}
              </GradientButton>
            </motion.div>
          </Box>

          {/* Add Insights Toggle Button */}
          {aiAnalysis && !showInsights && (
            <Box mb={3} textAlign="center">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setShowInsights(true)}
                startIcon={<motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity }}><InsightsIcon /></motion.div>}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Show AI Insights
              </Button>
            </Box>
          )}

          {/* Display sentiment analysis with markdown formatting */}
          {analyzing && (
            <Box mb={2} sx={{ 
              textAlign: "center",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
              borderRadius: 3,
              p: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <CircularProgress size={28} color="primary" />
              </motion.div>
              <Typography variant="body2" sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 500
              }}>
                Analyzing your emotional patterns...
              </Typography>
            </Box>
          )}
          {aiAnalysis && showInsights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <Box mb={4} sx={{
                position: 'relative',
                background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
                borderRadius: 4,
                p: 0,
                boxShadow: `0 10px 40px -10px ${theme.palette.primary.main}20`,
                border: `1px solid ${theme.palette.divider}`,
                overflow: 'hidden',
              }}>
                {/* Close Button */}
                <Box sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  zIndex: 2 
                }}>
                  <IconButton
                    onClick={() => setShowInsights(false)}
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: theme.shadows[2],
                      '&:hover': {
                        bgcolor: 'background.paper',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Gradient Bar */}
                <Box sx={{
                  height: '4px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }} />

                {/* Content */}
                <Box sx={{
                  position: 'relative',
                  p: 3,
                  '& h1, & h2': {
                    color: theme.palette.primary.main,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    '&::before': {
                      content: '""',
                      width: '4px',
                      height: '1em',
                      background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      borderRadius: '4px',
                      marginRight: '8px'
                    }
                  },
                  '& p': {
                    mb: 2,
                    lineHeight: 1.7,
                    color: theme.palette.text.primary,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateX(8px)',
                      color: theme.palette.primary.main
                    }
                  },
                  '& strong': {
                    color: theme.palette.secondary.main,
                    background: `linear-gradient(120deg, ${theme.palette.secondary.main}20, ${theme.palette.secondary.main}00)`,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `linear-gradient(120deg, ${theme.palette.secondary.main}40, ${theme.palette.secondary.main}10)`,
                    }
                  },
                  '& ul, & ol': {
                    pl: 3,
                    mb: 2,
                    '& li': {
                      mb: 1,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateX(8px)',
                      }
                    }
                  }
                }}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Typography variant="body1" paragraph>
                              {children}
                            </Typography>
                          </motion.div>
                        ),
                        h1: ({ children }) => (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                              {children}
                            </Typography>
                          </motion.div>
                        ),
                        h2: ({ children }) => (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Typography variant="h6" gutterBottom sx={{ 
                              fontWeight: 600,
                              color: theme.palette.secondary.main 
                            }}>
                              {children}
                            </Typography>
                          </motion.div>
                        ),
                        li: ({ children }) => (
                          <motion.li
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            style={{
                              marginBottom: '8px',
                              color: theme.palette.text.primary
                            }}
                          >
                            {children}
                          </motion.li>
                        ),
                      }}
                    >
                      {aiAnalysis}
                    </ReactMarkdown>
                  </motion.div>
                </Box>
              </Box>
            </motion.div>
          )}

          {/* Mood Timeline Chart */}
          {moodEntries.length > 0 ? (
            <Box mb={isMobile ? 4 : 6}>
              <motion.div variants={textVariants} initial="hidden" animate="visible">
                <Typography variant={isMobile ? "h6" : "h5"} gutterBottom sx={{ textAlign: "center", color: theme.palette.text.primary }}>
                  Mood Timeline
                </Typography>
              </motion.div>
              <Box sx={{ position: "relative", height: isMobile ? 300 : 400 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            </Box>
          ) : (
            <Box mb={isMobile ? 4 : 6} textAlign="center">
              <motion.div variants={textVariants} initial="hidden" animate="visible">
                <Typography variant="body1" color="textSecondary" sx={{ px: isMobile ? 2 : 0 }}>
                  Your mood history will appear here once you start logging entries.
                </Typography>
              </motion.div>
            </Box>
          )}

          {/* Logged Entries List */}
          {moodEntries.length > 0 && (
            <Box>
              <motion.div variants={textVariants} initial="hidden" animate="visible">
                <Typography variant={isMobile ? "h6" : "h5"} gutterBottom sx={{ textAlign: "center", color: theme.palette.text.primary }}>
                  Logged Entries
                </Typography>
              </motion.div>
              <List sx={{ px: isMobile ? 1 : 0 }}>
                {moodEntries
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((entry) => (
                    <ListItem
                      key={entry.id}
                      sx={{
                        mb: 2,
                        p: 2,
                        bgcolor: theme.palette.background.paper,
                        borderRadius: 2,
                        boxShadow: 1,
                      }}
                      secondaryAction={
                        <Box>
                          <Tooltip title="Edit Entry">
                            <IconButton edge="end" onClick={() => handleEditMood(entry)} aria-label="edit" size={isMobile ? "small" : "medium"}>
                              <EditIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Entry">
                            <IconButton edge="end" onClick={() => handleDeleteMood(entry.id)} aria-label="delete" size={isMobile ? "small" : "medium"}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <motion.div whileHover={{ scale: 1.3, rotate: 10 }} transition={{ type: "spring", stiffness: 300 }}>
                          <Avatar
                            sx={{
                              bgcolor: `${moodOptions.find((o) => o.value === entry.mood)?.color}40`,
                              width: isMobile ? 40 : 50,
                              height: isMobile ? 40 : 50,
                              fontSize: isMobile ? "1rem" : "1.5rem",
                            }}
                          >
                            {moodOptions.find((o) => o.value === entry.mood)?.label.split(" ")[0]}
                          </Avatar>
                        </motion.div>
                      </ListItemAvatar>
                      <ListItemText
                        primaryTypographyProps={{ variant: isMobile ? "subtitle2" : "body1" }}
                        secondaryTypographyProps={{ variant: isMobile ? "caption" : "body2" }}
                        primary={entry.timestamp ? format(parseISO(entry.timestamp), "MMMM d, yyyy, h:mm a") : "Unknown Date"}
                        secondary={entry.notes || "No notes"}
                      />
                    </ListItem>
                  ))}
              </List>
            </Box>
          )}

          {/* Edit Entry Dialog */}
          <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Mood Entry</DialogTitle>
            <DialogContent>
              {editEntry && (
                <Box>
                  <motion.div variants={textVariants} initial="hidden" animate="visible">
                    <Typography variant="subtitle1" gutterBottom>
                      Date:{" "}
                      {editEntry.timestamp
                        ? format(parseISO(editEntry.timestamp), "MMMM d, yyyy, h:mm a")
                        : "Unknown Date"}
                    </Typography>
                  </motion.div>
                  <Box mb={3}>
                    <motion.div variants={textVariants} initial="hidden" animate="visible">
                      <Typography variant="h6" gutterBottom>
                        How are you feeling?
                      </Typography>
                    </motion.div>
                    <Grid container spacing={2} justifyContent="center">
                      {moodOptions.map((option) => (
                        <Grid item key={option.value}>
                          <Tooltip title={option.label}>
                            <IconButton
                              onClick={() => setEditEntry((prev) => ({ ...prev, mood: option.value }))}
                              sx={{
                                width: isMobile ? 50 : 60,
                                height: isMobile ? 50 : 60,
                                bgcolor: `${option.color}20`,
                                border: editEntry.mood === option.value ? `4px solid ${option.color}` : `2px solid ${theme.palette.divider}`,
                                borderRadius: "50%",
                                transition: "transform 0.2s, border 0.2s",
                                "&:hover": { transform: "scale(1.05)", bgcolor: `${option.color}30` },
                              }}
                              aria-label={option.label}
                            >
                              <motion.span variants={emojiVariants} initial="hidden" animate="visible" whileHover="hover" style={{ display: "inline-block" }}>
                                <Typography variant="h5">{option.label.split(" ")[0]}</Typography>
                              </motion.span>
                            </IconButton>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                  <Box>
                    <motion.div variants={textVariants} initial="hidden" animate="visible">
                      <Typography variant="h6" gutterBottom>
                        Journal Entry (optional)
                      </Typography>
                    </motion.div>
                    <TextField
                      value={editEntry.notes}
                      onChange={(e) => setEditEntry((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Write about your day, thoughts, or anything you want to remember..."
                      variant="outlined"
                      fullWidth
                      multiline
                      minRows={3}
                      sx={{
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 2,
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: theme.palette.divider },
                          "&:hover fieldset": { borderColor: theme.palette.primary.main },
                          "&.Mui-focused fieldset": {
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
              <Button onClick={handleUpdateMood} variant="contained" color="primary" disabled={loading || !editEntry?.mood}>
                {loading ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Enhancement Preview Dialog */}
          <Dialog open={openEnhancementPreview} onClose={() => setOpenEnhancementPreview(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Enhancement Preview</DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {enhancementPreview || "No enhancement available."}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEnhancementPreview(false)} color="secondary">
                Cancel
              </Button>
              <Button onClick={applyEnhancement} variant="contained" color="primary">
                Apply Enhancement
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
      <SplashScreenToggle onShowSplash={handleShowSplash} />
    </PageLayout>
  );
};

export default MoodTracker;
