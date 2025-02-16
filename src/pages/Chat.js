// src/pages/Chat.js

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
} from 'react';
import {
  Typography,
  Button,
  Grid,
  Box,
  TextField,
  useTheme,
  useMediaQuery,
  Tooltip,
  Avatar,
  Toolbar,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ChatIcon from '@mui/icons-material/Chat';
import MoodIcon from '@mui/icons-material/Mood';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ErrorBoundary from '../components/ErrorBoundary';
import Message from '../components/Message';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import { MoodContext } from "../contexts/MoodContext";
import { SleepContext } from "../contexts/SleepContext";
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// *** Added from old code: run chat moderation in background ***
import useChatModeration from '../hooks/useChatModeration';

const GradientButton = motion(Button);

// Constants
const CRISIS_KEYWORDS = ['suicide', 'self-harm', 'kill myself'];
const EMERGENCY_RESOURCES = [
  'DISHA Helpline: 1056/ 104 (24X7)',
  '0471-2552056, 0471-2551056',
];
const NEGATIVE_SENTIMENT_WORDS = [
  'sad',
  'depressed',
  'lonely',
  'miserable',
  'down',
  'unhappy',
  'anxious',
];
const MOOD_OPTIONS = [
  { label: '😊 Happy', value: 'happy' },
  { label: '😔 Sad', value: 'sad' },
  { label: '😠 Angry', value: 'angry' },
  { label: '😨 Anxious', value: 'anxious' },
  { label: '😴 Tired', value: 'tired' },
  { label: '😕 Neutral', value: 'neutral' },
];

// You can choose to use the updated dimensions or revert to the old ones.
// Updated dimensions from the merge:
const BOTTOM_NAV_HEIGHT = 48;
const CHAT_INPUT_HEIGHT = 52;
// (MOOD_PROMPT_INTERVAL is used in the mood prompting logic)
const MOOD_PROMPT_INTERVAL = 15 * 60 * 1000; // 15 minutes

const Chat = ({ toggleTheme }) => {
  // Contexts
  const { user } = useContext(AuthContext);
  const {
    messages,
    addMessage,
    loading: chatLoading,
    error: chatError,
    clearChat,
    addReaction,
  } = useContext(ChatContext);
  const { moodEntries, addMood } = useContext(MoodContext);
  const { sleepLogs } = useContext(SleepContext);

  // *** Run the moderation hook (analyzes messages silently) ***
  useChatModeration();

  // Local state
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isFetchingQuickReplies, setIsFetchingQuickReplies] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [customInstructionsDialogOpen, setCustomInstructionsDialogOpen] = useState(false);
  const [customInstructionsInput, setCustomInstructionsInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Refs and responsive helpers
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const chatContentRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const userName = user?.displayName || 'there';

  // Gemini API
  const genAI = useMemo(
    () => new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY),
    []
  );
  const model = useMemo(
    () => genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }),
    [genAI]
  );

  // Build full mood and sleep data strings
  const fullMoodData = useMemo(() => {
    if (moodEntries && moodEntries.length > 0) {
      return moodEntries
        .map((entry) => {
          const dateStr = new Date(entry.timestamp).toLocaleString();
          const notes = entry.notes ? `, Notes: ${entry.notes}` : '';
          return `Date: ${dateStr}, Mood: ${entry.mood}${notes}`;
        })
        .join(' | ');
    } else {
      return 'No mood entries logged.';
    }
  }, [moodEntries]);

  const fullSleepData = useMemo(() => {
    if (sleepLogs && sleepLogs.length > 0) {
      return sleepLogs
        .map((log) => {
          const dateStr = new Date(log.timestamp).toLocaleString();
          const duration = log.duration ? `, Duration: ${log.duration}` : '';
          const notes = log.notes ? `, Notes: ${log.notes}` : '';
          return `Date: ${dateStr}, SLEPT from ${log.startTime} to ${log.endTime} with quality ${log.qualityRating}${duration}${notes}`;
        })
        .join(' | ');
    } else {
      return 'No sleep logs recorded.';
    }
  }, [sleepLogs]);

  // System instructions for the AI
  const systemInstructionContent = useMemo(() => {
    let instructions = `You are MindEase, a warm, empathetic, and supportive AI therapist. The user's name is ${userName}. You have full access to the user's mood and sleep history. Use this information subtly to offer personalized, gentle, and practical guidance—just like a caring human therapist would. Avoid explicitly mentioning the raw data unless the user specifically asks for insights.`;
    if (customInstructions && customInstructions.trim() !== '') {
      instructions += ` ${customInstructions}`;
    }
    return instructions;
  }, [userName, customInstructions]);

  // Send greeting message if none has been sent.
  useEffect(() => {
    if (chatLoading) return;
    const hasGreeting = messages.some((msg) => msg.isBot && msg.isWelcome);
    if (user && !hasGreeting) {
      const greetingMessage = `Hello ${userName}! I'm MindEase, your AI therapist. How can I assist you today?`;
      addMessage(greetingMessage, true, {
        isWelcome: true,
        timestamp: new Date().toISOString(),
      });
    }
  }, [user, messages, addMessage, userName, chatLoading]);

  // Fetch custom instructions from Firestore.
  useEffect(() => {
    const fetchCustomInstructions = async () => {
      if (!user) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.customInstructions) {
            setCustomInstructions(data.customInstructions);
          }
        }
      } catch (error) {
        console.error('Error fetching custom instructions:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load custom instructions.',
          severity: 'error',
        });
      }
    };
    fetchCustomInstructions();
  }, [user]);

  // Auto-scroll the chat messages area whenever new messages are added.
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);

  // Setup voice-to-text (Chrome Web Speech API)
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setUserInput(finalTranscript || interimTranscript);
      };
      recognitionRef.current = recognition;
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }
  }, []);

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Mood prompting logic
  const lastMoodPromptTimeRef = useRef(0);
  const checkAndPromptMood = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastMoodPromptTimeRef.current < MOOD_PROMPT_INTERVAL) return;
    const today = new Date().toDateString();
    const lastMood = moodEntries[moodEntries.length - 1];
    const hasLoggedToday =
      lastMood && new Date(lastMood.timestamp).toDateString() === today;
    let negativeDetected = false;
    const lastUserMessage = messages.slice().reverse().find((msg) => !msg.isBot);
    if (lastUserMessage && typeof lastUserMessage.text === 'string') {
      const text = lastUserMessage.text.toLowerCase();
      for (let word of NEGATIVE_SENTIMENT_WORDS) {
        if (text.includes(word)) {
          negativeDetected = true;
          break;
        }
      }
    }
    if ((!hasLoggedToday || negativeDetected) && !moodDialogOpen) {
      setMoodDialogOpen(true);
      lastMoodPromptTimeRef.current = now;
    }
  }, [user, moodEntries, messages, moodDialogOpen]);

  // Handler for sending a message
  const handleSend = useCallback(async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isTyping) return;
    setUserIsTyping(false);

    // Check for crisis keywords
    const containsCrisis = CRISIS_KEYWORDS.some((kw) =>
      trimmedInput.toLowerCase().includes(kw)
    );
    if (containsCrisis) {
      const emergencyMessage = {
        text: `Your safety matters, ${userName}. Please contact ASAP!:\n${EMERGENCY_RESOURCES.join(
          '\n'
        )}`,
        isBot: true,
        timestamp: new Date().toISOString(),
        isEmergency: true,
      };
      const messageId = await addMessage(emergencyMessage.text, true, {
        isEmergency: true,
        timestamp: emergencyMessage.timestamp,
      });
      if (!messageId) {
        setSnackbar({
          open: true,
          message: 'Failed to send emergency message.',
          severity: 'error',
        });
        return;
      }
      setUserInput('');
      if (!isMobile) inputRef.current?.focus();
      return;
    }

    // Add the user message
    const userMessage = {
      text: trimmedInput,
      isBot: false,
      timestamp: new Date().toISOString(),
    };
    const messageId = await addMessage(
      userMessage.text,
      userMessage.isBot,
      { timestamp: userMessage.timestamp }
    );
    if (!messageId) {
      setSnackbar({
        open: true,
        message: 'Failed to send message.',
        severity: 'error',
      });
      return;
    }
    setUserInput('');
    setIsTyping(true);

    try {
      const lastMoodTimestamp =
        moodEntries.length > 0
          ? new Date(moodEntries[moodEntries.length - 1].timestamp)
          : null;
      const filteredMessages = lastMoodTimestamp
        ? messages.filter(
            (msg) =>
              !msg.isWelcome && new Date(msg.timestamp) > lastMoodTimestamp
          )
        : messages.filter((msg) => !msg.isWelcome);
      const updatedChatHistory = [
        {
          role: 'user',
          parts: [{ text: systemInstructionContent }],
        },
        ...filteredMessages.map((msg) => ({
          role: msg.isBot ? 'model' : 'user',
          parts: [{ text: msg.text }],
        })),
      ];

      const chat = model.startChat({ history: updatedChatHistory });
      const result = await chat.sendMessage(trimmedInput);
      const response = await result.response;
      const text = response.text();
      const botMessage = {
        text,
        isBot: true,
        timestamp: new Date().toISOString(),
        isEmergency: false,
      };
      const botMessageId = await addMessage(botMessage.text, botMessage.isBot, {
        isEmergency: false,
        timestamp: botMessage.timestamp,
      });
      if (!botMessageId) {
        setSnackbar({
          open: true,
          message: 'Failed to receive AI response.',
          severity: 'error',
        });
        return;
      }
      const quickReplies = await fetchQuickReplies(trimmedInput, text);
      if (quickReplies && quickReplies.length > 0) {
        await addQuickReplies(botMessageId, quickReplies);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = {
        text: "Sorry, I'm having trouble connecting. Please try again.",
        isBot: true,
        timestamp: new Date().toISOString(),
        isEmergency: false,
        isError: true,
      };
      await addMessage(errorMessage.text, errorMessage.isBot, {
        isError: true,
        timestamp: errorMessage.timestamp,
      });
    } finally {
      setIsTyping(false);
      if (!isMobile) inputRef.current?.focus();
      checkAndPromptMood();
    }
  }, [
    userInput,
    isTyping,
    model,
    isMobile,
    addMessage,
    userName,
    checkAndPromptMood,
    moodEntries,
    messages,
    systemInstructionContent,
  ]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      setUserIsTyping(true);
    }
  };

  // Clear chat handlers
  const handleClearChat = () => setClearConfirmationOpen(true);
  const confirmClearChat = async () => {
    await clearChat();
    setClearConfirmationOpen(false);
    setSnackbar({
      open: true,
      message: 'Chat history cleared.',
      severity: 'info',
    });
  };
  const cancelClearChat = () => setClearConfirmationOpen(false);

  // Reaction handlers
  const handleReactionClick = (event, messageId) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };
  const handleReactionClose = () => {
    setAnchorEl(null);
    setSelectedMessageId(null);
  };
  const handleAddReaction = (emoji) => {
    if (selectedMessageId) {
      addReaction(selectedMessageId, emoji);
      setSnackbar({
        open: true,
        message: 'Reaction added.',
        severity: 'success',
      });
    }
    handleReactionClose();
  };

  // Mood dialog handlers
  const openMoodDialog = () => setMoodDialogOpen(true);
  const closeMoodDialog = () => setMoodDialogOpen(false);
  const handleMoodSelect = (mood) => {
    addMood(mood, 'Logged via chat interface');
    addMessage(`Mood "${mood}" logged.`, false, {
      timestamp: new Date().toISOString(),
    });
    closeMoodDialog();
  };

  // Quick replies functions
  const handleQuickReply = async (reply) => {
    setUserInput(reply);
    await handleSend();
  };

  const fetchQuickReplies = async (userMessage, botResponse) => {
    try {
      setIsFetchingQuickReplies(true);
      const prompt = `
Based on the following conversation, provide 3-5 concise and relevant quick reply options for the user to choose from.
Only list the replies without any extra text or formatting.

User: ${userMessage}
AI: ${botResponse}

Quick Replies:
`;
      const quickReplyChat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [
              {
                text: 'You are an assistant that provides quick reply options based on the conversation context.',
              },
            ],
          },
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });
      const quickReplyResult = await quickReplyChat.sendMessage('');
      const quickRepliesText = await quickReplyResult.response.text();
      const quickReplies = quickRepliesText
        .split('\n')
        .map((reply) =>
          reply.replace(/^\s*[-•]\s?/, '').replace(/\*/g, '').trim()
        )
        .filter(
          (reply) =>
            reply.length > 0 &&
            !reply.toLowerCase().includes('quick replies') &&
            !reply.toLowerCase().includes('provide')
        );
      return quickReplies.slice(0, 5);
    } catch (error) {
      console.error('Error fetching quick replies:', error);
      return [];
    } finally {
      setIsFetchingQuickReplies(false);
    }
  };

  const addQuickReplies = async (messageId, quickReplies) => {
    if (!user) return;
    try {
      const messageRef = doc(db, 'users', user.uid, 'messages', messageId);
      await updateDoc(messageRef, { quickReplies });
    } catch (error) {
      console.error('Error adding quick replies:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load quick replies.',
        severity: 'error',
      });
    }
  };

  // Custom instructions handlers
  const openCustomInstructionsDialog = () => {
    setCustomInstructionsInput(customInstructions);
    setCustomInstructionsDialogOpen(true);
  };
  const closeCustomInstructionsDialog = () => {
    setCustomInstructionsDialogOpen(false);
    setCustomInstructionsInput('');
  };
  const handleCustomInstructionsSave = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        customInstructions: customInstructionsInput.trim(),
      });
      setCustomInstructions(customInstructionsInput.trim());
      setSnackbar({
        open: true,
        message: 'Custom instructions saved successfully.',
        severity: 'success',
      });
      closeCustomInstructionsDialog();
    } catch (error) {
      console.error('Error saving custom instructions:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save custom instructions.',
        severity: 'error',
      });
    }
  };

  // Helper: determine if two messages are in the same time group
  const isSameTimeGroup = (prevMsg, curMsg) => {
    if (!prevMsg || !curMsg) return false;
    try {
      const prevDate = new Date(prevMsg.timestamp);
      const curDate = new Date(curMsg.timestamp);
      return (
        prevDate.getHours() === curDate.getHours() &&
        prevDate.getMinutes() === curDate.getMinutes()
      );
    } catch (error) {
      console.error('Error parsing time:', error);
      return false;
    }
  };

  const formatTime = (ts) => {
    try {
      if (!ts) return '—';
      const date = ts.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid Date';
    }
  };

  // ----------------------------
  // Mobile Layout
  // ----------------------------
  if (isMobile) {
    const MOBILE_MAX_ROWS = 3;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Mobile Header */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background:
              theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.8)'
                : 'rgba(18, 18, 18, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              gap: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 38,
                  height: 38,
                }}
              >
                <ChatIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="600">
                  MindEase
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  AI Therapist
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={openMoodDialog}
                sx={{ color: 'primary.main' }}
              >
                <MoodIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={openCustomInstructionsDialog}
                sx={{ color: 'text.secondary' }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleClearChat}
                sx={{ color: 'text.secondary' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={toggleTheme}
                sx={{ color: 'text.secondary' }}
              >
                <Brightness4Icon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Mobile Chat Messages */}
        <Box
          ref={chatContentRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 2,
            pt: 2,
            pb: `${BOTTOM_NAV_HEIGHT + CHAT_INPUT_HEIGHT - 32}px`,
            scrollBehavior: 'smooth',
            '::-webkit-scrollbar': {
              width: '6px',
            },
            '::-webkit-scrollbar-thumb': {
              background: 'rgba(128, 128, 128, 0.3)',
              borderRadius: '3px',
            },
          }}
          role="log"
          aria-live="polite"
        >
          <ErrorBoundary>
            {messages.map((msg, index) => {
              const showTimestamp = !isSameTimeGroup(messages[index - 1], msg);
              return (
                <React.Fragment key={msg.id || index}>
                  {showTimestamp && !msg.isWelcome && (
                    <Box textAlign="center" my={1}>
                      <Typography variant="caption" color="textSecondary">
                        {formatTime(msg.timestamp)}
                      </Typography>
                    </Box>
                  )}
                  <motion.div
                    initial={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleReactionClick(e, msg.id);
                    }}
                  >
                    <Message msg={msg} />
                  </motion.div>
                  {msg.isBot && msg.quickReplies && (
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1} mb={1}>
                      {msg.quickReplies.map((reply, idx) => (
                        <Button
                          key={idx}
                          variant="outlined"
                          size="small"
                          onClick={() => handleQuickReply(reply)}
                          sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontSize: '0.875rem',
                            padding: '4px 10px',
                          }}
                        >
                          {reply}
                        </Button>
                      ))}
                    </Box>
                  )}
                </React.Fragment>
              );
            })}
            {isTyping && (
              <Box display="flex" alignItems="center" mb={1}>
                <Box
                  component={motion.div}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  sx={{
                    width: 10,
                    height: 10,
                    bgcolor: 'primary.main',
                    borderRadius: '50%',
                    mr: 1,
                  }}
                />
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                  MindEase is typing...
                </Typography>
              </Box>
            )}
            {isFetchingQuickReplies && (
              <Box mb={1}>
                <Typography variant="body2" color="textSecondary">
                  Loading quick replies...
                </Typography>
              </Box>
            )}
            {chatLoading && !isTyping && (
              <Box mb={1}>
                <Typography variant="body2" color="textSecondary">
                  Loading messages...
                </Typography>
              </Box>
            )}
            {chatError && (
              <Box mb={1}>
                <Typography variant="body2" color="error">
                  Error: {chatError}
                </Typography>
              </Box>
            )}
            <Box sx={{ height: CHAT_INPUT_HEIGHT + 8 }} />
          </ErrorBoundary>
        </Box>

        {/* Mobile Chat Input */}
        <Box
          sx={{
            position: 'fixed',
            bottom: BOTTOM_NAV_HEIGHT,
            left: 0,
            right: 0,
            background:
              theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.8)'
                : 'rgba(18, 18, 18, 0.8)',
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${theme.palette.divider}`,
            px: 2,
            py: 1,
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
            }}
          >
            <TextField
              inputRef={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={`How are you feeling today, ${userName}?`}
              multiline
              maxRows={MOBILE_MAX_ROWS}
              fullWidth
              variant="outlined"
              size="small"
              onKeyDown={handleKeyDown}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  backgroundColor: theme.palette.background.paper,
                  fontSize: '0.925rem',
                  '& fieldset': {
                    borderWidth: '1px',
                    borderColor: 'divider',
                  },
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, pb: 0.5 }}>
              <Tooltip title={isListening ? 'Stop Listening' : 'Start Listening'}>
                <GradientButton
                  variant="contained"
                  onClick={handleVoiceInput}
                  aria-label="Voice Input"
                  sx={{
                    borderRadius: '50%',
                    padding: 0.5,
                    minWidth: 'auto',
                    width: 40,
                    height: 40,
                    boxShadow: 3,
                    background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    },
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isListening ? <MicOffIcon /> : <MicIcon />}
                </GradientButton>
              </Tooltip>
              <Tooltip title="Send Message">
                <GradientButton
                  variant="contained"
                  onClick={handleSend}
                  disabled={isTyping || !userInput.trim()}
                  aria-label="Send message"
                  sx={{
                    borderRadius: '50%',
                    padding: 0.5,
                    minWidth: 'auto',
                    width: 40,
                    height: 40,
                    boxShadow: 3,
                    background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    },
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    width={20}
                    height={20}
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.169-1.408l-7-14z" />
                  </svg>
                </GradientButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Mobile Menus and Dialogs */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleReactionClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {['👍', '❤️', '😂', '😮', '😢', '👏'].map((emoji) => (
            <MenuItem
              key={emoji}
              onClick={() => handleAddReaction(emoji)}
              sx={{ fontSize: '1.25rem', padding: '0.4rem' }}
            >
              {emoji}
            </MenuItem>
          ))}
        </Menu>
        <Dialog
          open={clearConfirmationOpen}
          onClose={cancelClearChat}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title" sx={{ fontSize: '1.25rem' }}>
            {"Clear Chat History?"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description" sx={{ fontSize: '1rem' }}>
              Are you sure you want to clear the chat history? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelClearChat} color="primary" size="small">
              Cancel
            </Button>
            <Button onClick={confirmClearChat} color="primary" autoFocus size="small">
              Clear Chat
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={customInstructionsDialogOpen}
          onClose={closeCustomInstructionsDialog}
          aria-labelledby="custom-instructions-dialog-title"
        >
          <DialogTitle id="custom-instructions-dialog-title" sx={{ fontSize: '1.25rem' }}>
            Set Custom Instructions
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '1rem' }}>
              You can add custom instructions to tailor the AI's responses to better suit your needs. These instructions will be appended to the existing system instructions.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="custom-instructions"
              label="Custom Instructions"
              type="text"
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              value={customInstructionsInput}
              onChange={(e) => setCustomInstructionsInput(e.target.value)}
              variant="outlined"
              placeholder="e.g., Please focus more on cognitive behavioral techniques."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCustomInstructionsDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleCustomInstructionsSave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={moodDialogOpen} onClose={closeMoodDialog} aria-labelledby="mood-dialog-title">
          <DialogTitle id="mood-dialog-title">How Are You Feeling?</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              {MOOD_OPTIONS.map((mood) => (
                <Grid item xs={6} sm={4} key={mood.value}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EmojiEmotionsIcon />}
                    onClick={() => handleMoodSelect(mood.value)}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    {mood.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeMoodDialog} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontSize: '0.9rem' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    );
  }

  // ----------------------------
  // Desktop Layout
  // ----------------------------
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        background: theme.palette.background.gradient,
        paddingTop: theme.spacing(5.5),
        paddingBottom: theme.spacing(4),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Toolbar />
      <Box
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: '24px',
          boxShadow: '0px 10px 30px rgba(0,0,0,0.1)',
          backgroundColor: theme.palette.background.paper,
          overflow: 'hidden',
          height: '90vh',
          width: '100%',
          maxWidth: '800px',
          marginTop: theme.spacing(4),
        }}
      >
        {/* Desktop Header */}
        <Box
          sx={{
            padding: '24px',
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 60,
                height: 60,
                boxShadow: theme.shadows[2],
                mr: 2,
              }}
            >
              <ChatIcon sx={{ color: 'white', fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" color="textPrimary" sx={{ fontWeight: 700 }}>
                MindEase
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Your AI Companion
              </Typography>
            </Box>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5 }}>
            <Tooltip title="Log Your Mood">
              <IconButton onClick={openMoodDialog} aria-label="log mood" color="inherit">
                <MoodIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Chat History">
              <IconButton onClick={handleClearChat} aria-label="clear chat history" color="inherit">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Set Custom Instructions">
              <IconButton onClick={openCustomInstructionsDialog} aria-label="set custom instructions" color="inherit">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Desktop Chat Messages */}
        <ErrorBoundary>
          <Box
            ref={chatContentRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              padding: '24px',
            }}
            role="log"
            aria-live="polite"
          >
            {messages.map((msg, index) => {
              const showTimestamp = !isSameTimeGroup(messages[index - 1], msg);
              return (
                <React.Fragment key={msg.id || index}>
                  {showTimestamp && !msg.isWelcome && (
                    <Box textAlign="center" my={2}>
                      <Typography variant="caption" color="textSecondary">
                        {formatTime(msg.timestamp)}
                      </Typography>
                    </Box>
                  )}
                  <motion.div
                    initial={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleReactionClick(e, msg.id);
                    }}
                  >
                    <Message msg={msg} />
                  </motion.div>
                  {msg.isBot && msg.quickReplies && (
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1} mb={2} ml={8}>
                      {msg.quickReplies.map((reply, idx) => (
                        <Button
                          key={idx}
                          variant="outlined"
                          size="small"
                          onClick={() => handleQuickReply(reply)}
                          sx={{ borderRadius: '24px', textTransform: 'none', padding: '6px 16px' }}
                        >
                          {reply}
                        </Button>
                      ))}
                    </Box>
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        </ErrorBoundary>

        {/* Desktop Chat Input */}
        <Box sx={{ padding: '24px', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <TextField
              inputRef={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={`How are you feeling today, ${userName}?`}
              variant="outlined"
              multiline
              minRows={1}
              maxRows={4}
              fullWidth
              onKeyDown={handleKeyDown}
              aria-label="User input"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '30px',
                  backgroundColor: theme.palette.background.paper,
                  '& fieldset': { borderColor: 'grey.400', borderRadius: '30px' },
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                  '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                },
              }}
            />
            <Tooltip title={isListening ? 'Stop Listening' : 'Start Listening'}>
              <GradientButton
                variant="contained"
                onClick={handleVoiceInput}
                aria-label="Voice Input"
                sx={{
                  borderRadius: '50%',
                  padding: 1,
                  minWidth: 'auto',
                  width: 48,
                  height: 48,
                  boxShadow: 3,
                  background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  },
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isListening ? <MicOffIcon /> : <MicIcon />}
              </GradientButton>
            </Tooltip>
            <Tooltip title="Send Message">
              <GradientButton
                variant="contained"
                onClick={handleSend}
                disabled={isTyping || !userInput.trim()}
                aria-label="Send message"
                sx={{
                  borderRadius: '50%',
                  padding: 1,
                  minWidth: 'auto',
                  width: 48,
                  height: 48,
                  boxShadow: 3,
                  background: `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  },
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  width={24}
                  height={24}
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.169-1.408l-7-14z" />
                </svg>
              </GradientButton>
            </Tooltip>
          </Box>
          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="textSecondary" fontStyle="italic">
              MindEase provides supportive listening, not professional therapy.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Desktop Menus & Dialogs */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleReactionClose}
      >
        {['👍', '❤️', '😂', '😮', '😢', '👏'].map((emoji) => (
          <MenuItem
            key={emoji}
            onClick={() => handleAddReaction(emoji)}
            sx={{ fontSize: '1.5rem' }}
          >
            {emoji}
          </MenuItem>
        ))}
      </Menu>
      <Dialog open={clearConfirmationOpen} onClose={cancelClearChat}>
        <DialogTitle>Clear Chat History?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear the chat history? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelClearChat} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmClearChat} color="primary" autoFocus>
            Clear Chat
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={customInstructionsDialogOpen} onClose={closeCustomInstructionsDialog}>
        <DialogTitle>Set Custom Instructions</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Add custom instructions to tailor the AI's responses.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            value={customInstructionsInput}
            onChange={(e) => setCustomInstructionsInput(e.target.value)}
            variant="outlined"
            label="Custom Instructions"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCustomInstructionsDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleCustomInstructionsSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={moodDialogOpen} onClose={closeMoodDialog}>
        <DialogTitle>How Are You Feeling?</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {MOOD_OPTIONS.map((m) => (
              <Grid item xs={6} sm={4} key={m.value}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<EmojiEmotionsIcon />}
                  onClick={() => handleMoodSelect(m.value)}
                >
                  {m.label}
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMoodDialog} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default Chat;
