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
import Brightness4Icon from '@mui/icons-material/Brightness4'; // Theme toggle icon
import { GoogleGenerativeAI } from '@google/generative-ai';
import ErrorBoundary from '../components/ErrorBoundary';
import Modal from '../components/Modal';
import Message from '../components/Message';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const GradientButton = motion(Button);

const CRISIS_KEYWORDS = ['suicide', 'self-harm', 'kill myself'];
const EMERGENCY_RESOURCES = [
  'DISHA Helpline: 1056/ 104 (24X7)',
  ' 0471-2552056, 0471-2551056',
];

const MOOD_OPTIONS = [
  { label: '😊 Happy', value: 'happy' },
  { label: '😔 Sad', value: 'sad' },
  { label: '😠 Angry', value: 'angry' },
  { label: '😨 Anxious', value: 'anxious' },
  { label: '😴 Tired', value: 'tired' },
  { label: '😕 Neutral', value: 'neutral' },
];

// Define the BottomNav and Chat Input heights (in pixels)
const BOTTOM_NAV_HEIGHT = 56;
const CHAT_INPUT_HEIGHT = 60; // Adjust as needed

const Chat = ({ toggleTheme }) => {
  const { user } = useContext(AuthContext);
  const {
    messages,
    addMessage,
    loading: chatLoading,
    error: chatError,
    clearChat,
    addReaction,
  } = useContext(ChatContext);

  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [clearConfirmationOpen, setClearConfirmationOpen] = useState(false);
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null); // For reactions
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Create the GenAI model instance.
  const genAI = useMemo(
    () => new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY),
    []
  );
  const model = useMemo(
    () =>
      genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
      }),
    [genAI]
  );

  const inputRef = useRef(null);
  const chatContentRef = useRef(null);

  // Access user's display name
  const userName = user?.displayName || 'there';

  const systemInstructionContent = useMemo(() => {
    let instructions = `You are MindEase, a compassionate AI therapist. The user's name is ${userName}. Provide empathetic and supportive responses, offer general advice and coping strategies when appropriate, and ask open-ended questions to understand the user's feelings. Always act like a good dear friend.`;
    if (customInstructions && customInstructions.trim() !== '') {
      instructions += ` ${customInstructions}`;
    }
    return instructions;
  }, [userName, customInstructions]);

  const chatHistory = useMemo(() => {
    const historyMessages = messages
      .filter((msg) => !msg.isWelcome)
      .map((msg) => ({
        role: msg.isBot ? 'model' : 'user',
        parts: [{ text: msg.text }],
      }));

    return [
      {
        role: 'user',
        parts: [{ text: systemInstructionContent }],
      },
      ...historyMessages,
    ];
  }, [messages, systemInstructionContent]);

  // Send greeting if not already present
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

  // Fetch custom instructions from Firestore on mount
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

  // Auto-scroll: scroll the messages container to the bottom whenever messages update.
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isTyping) return;
    setUserIsTyping(false);

    const containsCrisis = CRISIS_KEYWORDS.some((kw) =>
      trimmedInput.toLowerCase().includes(kw)
    );
    if (containsCrisis) {
      const emergencyMessage = {
        text: `Your safety matters, ${userName}. Please contact ASAP!:\n${EMERGENCY_RESOURCES.join('\n')}`,
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

    const newMessageText = trimmedInput;
    const userMessage = {
      text: newMessageText,
      isBot: false,
      timestamp: new Date().toISOString(),
    };
    const messageId = await addMessage(userMessage.text, userMessage.isBot, {
      timestamp: userMessage.timestamp,
    });
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
      const chat = model.startChat({ history: chatHistory });
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
    }
  }, [userInput, isTyping, chatHistory, model, isMobile, addMessage, userName]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      setUserIsTyping(true);
    }
  };

  const handleClearChat = () => {
    setClearConfirmationOpen(true);
  };

  const confirmClearChat = async () => {
    await clearChat();
    setClearConfirmationOpen(false);
    setSnackbar({
      open: true,
      message: 'Chat history cleared.',
      severity: 'info',
    });
  };

  const cancelClearChat = () => {
    setClearConfirmationOpen(false);
  };

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const isSameTimeGroup = (prevMessage, currentMessage) => {
    if (!prevMessage || !currentMessage) return false;
    try {
      const prevDate = new Date(prevMessage.timestamp);
      const currentDate = new Date(currentMessage.timestamp);
      return (
        prevDate.getHours() === currentDate.getHours() &&
        prevDate.getMinutes() === currentDate.getMinutes()
      );
    } catch (error) {
      console.error('Error parsing date in isSameTimeGroup:', error, { prevMessage, currentMessage });
      return false;
    }
  };

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) {
        console.warn('Timestamp is undefined or null:', timestamp);
        return '—';
      }
      const date = timestamp.toDate
        ? timestamp.toDate()
        : timestamp instanceof Date
        ? timestamp
        : new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid Date';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting time:', error, { timestamp });
      return 'Invalid Date';
    }
  };

  // Mood tracking handlers
  const openMoodDialog = () => {
    setMoodDialogOpen(true);
  };

  const closeMoodDialog = () => {
    setMoodDialogOpen(false);
  };

  const handleMoodSelect = (mood) => {
    addMessage(`I am feeling "${mood}" logged.`, false, {
      timestamp: new Date().toISOString(),
    });
  };

  const handleQuickReply = async (reply) => {
    setUserInput(reply);
    await handleSend();
  };

  // Reaction handlers
  const handleReactionClick = (event, messageId) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleReactionClose = () => {
    setAnchorEl(null);
    setSelectedMessageId(null);
  };

  const handleAddReaction = (reaction) => {
    if (selectedMessageId) {
      addReaction(selectedMessageId, reaction);
      setSnackbar({
        open: true,
        message: 'Reaction added.',
        severity: 'success',
      });
    }
    handleReactionClose();
  };

  // Snackbar handler
  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchQuickReplies = async (userMessage, botResponse) => {
    try {
      setIsFetchingQuickReplies(true);
      const prompt = `
Based on the following conversation, provide 3-5 concise and relevant quick reply options for the user to choose from.
Only list the replies without any additional text, numbering, or formatting.

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
        .map((reply) => reply.replace(/^\s*[-•]\s/, '').replace(/\*/g, '').trim())
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
      await updateDoc(messageRef, {
        quickReplies: quickReplies,
      });
    } catch (error) {
      console.error('Error adding quick replies:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load quick replies.',
        severity: 'error',
      });
    }
  };

  // Handlers for Custom Instructions Dialog
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

  // ----------------------------
  // Mobile Layout
  // ----------------------------
  if (isMobile) {
    // Define a slightly lower maxRows for the TextField so it doesn’t expand too far on mobile.
    const MOBILE_MAX_ROWS = 3;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: 'relative',
          height: '100vh',
          width: '100vw',
          background: theme.palette.background.gradient,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: theme.spacing(1), // Added padding at the top for mobile
        }}
      >
        {/* Header (minimal) - Mobile */}
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px', // Reduced padding for mobile header
            backgroundColor: theme.palette.background.paper,
            boxShadow: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 36, // Smaller avatar size for mobile
                height: 36,
                mr: 1,
              }}
            >
              <ChatIcon sx={{ color: 'white', fontSize: 22 }} /> {/* Smaller icon size */}
            </Avatar>
            <Box>
              <Typography variant="h6" color="textPrimary" sx={{ fontWeight: 800, fontSize: '1.1rem' }}> {/* Reduced font size */}
                MindEase
              </Typography>
              <Typography variant="caption" color="textSecondary">
                AI Therapist
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Log Mood">
              <IconButton onClick={openMoodDialog} aria-label="log mood" color="inherit" size="small">
                <MoodIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear Chat">
              <IconButton onClick={handleClearChat} aria-label="clear chat history" color="inherit" size="small">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Custom Instructions">
              <IconButton onClick={openCustomInstructionsDialog} aria-label="set custom instructions" color="inherit" size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Toggle Theme">
              <IconButton onClick={toggleTheme} aria-label="toggle theme" color="inherit" size="small">
                <Brightness4Icon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Container wrapping messages and chat input */}
        <Box sx={{ position: 'relative', flexGrow: 1 }}>
          {/* Scrollable Chat Messages Area */}
          <Box
            ref={chatContentRef}
            sx={{
              overflowY: 'auto',
              height: `calc(100vh - ${BOTTOM_NAV_HEIGHT + CHAT_INPUT_HEIGHT}px)`,
              padding: '8px 16px', // Reduced padding for mobile chat area
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
                            sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.875rem', padding: '4px 10px' }} // Smaller button styles
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
                      width: 10, // Smaller typing indicator for mobile
                      height: 10,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}> {/* Smaller text */}
                    MindEase is typing...
                  </Typography>
                </Box>
              )}
              {isFetchingQuickReplies && (
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}> {/* Smaller text */}
                    Loading quick replies...
                  </Typography>
                </Box>
              )}
              {chatLoading && !isTyping && (
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}> {/* Smaller text */}
                    Loading messages...
                  </Typography>
                </Box>
              )}
              {chatError && (
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" color="error" sx={{ fontSize: '0.875rem' }}> {/* Smaller text */}
                    Error: {chatError}
                  </Typography>
                </Box>
              )}
              {/* Extra spacer so messages are not hidden behind the input */}
              <Box sx={{ height: CHAT_INPUT_HEIGHT + 20 }} />
            </ErrorBoundary>
          </Box>

          {/* Chat Input Area: Fixed above the BottomNav */}
          <Box
            sx={{
              position: 'absolute',
              bottom: BOTTOM_NAV_HEIGHT,
              left: 0,
              right: 0,
              backgroundColor: theme.palette.background.paper,
              boxShadow: 4,
              padding: '8px 16px', // Reduced padding for mobile input area
              height: CHAT_INPUT_HEIGHT,
              zIndex: 10,
            }}
          >
            <Box
              component={motion.div}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              display="flex"
              flexDirection="row"
              alignItems="center"
              gap={1}
              sx={{ height: '100%' }}
            >
              <TextField
                inputRef={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`How are you feeling today, ${userName}?`}
                variant="outlined"
                multiline
                minRows={1}
                maxRows={MOBILE_MAX_ROWS}
                fullWidth
                onKeyDown={handleKeyDown}
                aria-label="User input"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '30px',
                    backgroundColor: theme.palette.background.paper,
                    padding: '4px 12px', // Reduced padding for mobile input
                    fontSize: '0.875rem', // Smaller font size
                    '& fieldset': { borderColor: 'grey.400' },
                    '&:hover fieldset': { borderColor: theme.palette.primary.main },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  overflow: 'hidden',
                }}
              />
              <Tooltip title="Send Message">
                <GradientButton
                  variant="contained"
                  onClick={handleSend}
                  disabled={isTyping || !userInput.trim()}
                  aria-label="Send message"
                  sx={{
                    borderRadius: '50%',
                    padding: 0.5, // Reduced padding for mobile button
                    minWidth: 'auto',
                    width: 40, // Smaller button size
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
                    aria-hidden="true"
                    width={20} // Smaller icon size
                    height={20}
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.169-1.408l-7-14z" />
                  </svg>
                </GradientButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Reaction Menu, Dialogs, and Snackbar */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleReactionClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {['👍', '❤️', '😂', '😮', '😢', '👏'].map((emoji) => (
            <MenuItem key={emoji} onClick={() => handleAddReaction(emoji)} sx={{ fontSize: '1.25rem', padding: '0.4rem' }}> {/* Reduced reaction menu item size */}
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
          <DialogTitle id="alert-dialog-title" sx={{ fontSize: '1.25rem' }}>{"Clear Chat History?"}</DialogTitle> {/* Reduced dialog title size */}
          <DialogContent>
            <DialogContentText id="alert-dialog-description" sx={{ fontSize: '1rem' }}> {/* Reduced dialog content text size */}
              Are you sure you want to clear the chat history? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelClearChat} color="primary" size="small"> {/* Reduced button size */}
              Cancel
            </Button>
            <Button onClick={confirmClearChat} color="primary" autoFocus size="small"> {/* Reduced button size */}
              Clear Chat
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={customInstructionsDialogOpen}
          onClose={closeCustomInstructionsDialog}
          aria-labelledby="custom-instructions-dialog-title"
        >
          <DialogTitle id="custom-instructions-dialog-title" sx={{ fontSize: '1.25rem' }}>Set Custom Instructions</DialogTitle> {/* Reduced dialog title size */}
          <DialogContent>
            <DialogContentText sx={{ fontSize: '1rem' }}> {/* Reduced dialog content text size */}
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
              InputProps={{ style: { fontSize: '0.9rem' } }} // Smaller input text size
              InputLabelProps={{ style: { fontSize: '1rem' } }} // Smaller label size
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCustomInstructionsDialog} color="primary" size="small"> {/* Reduced button size */}
              Cancel
            </Button>
            <Button onClick={handleCustomInstructionsSave} color="primary" size="small"> {/* Reduced button size */}
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={moodDialogOpen} onClose={closeMoodDialog} aria-labelledby="mood-dialog-title">
          <DialogTitle id="mood-dialog-title" sx={{ fontSize: '1.25rem' }}>How Are You Feeling?</DialogTitle> {/* Reduced dialog title size */}
          <DialogContent>
            <Grid container spacing={2}>
              {MOOD_OPTIONS.map((mood) => (
                <Grid item xs={6} sm={4} key={mood.value}>
                  <Button variant="outlined" fullWidth startIcon={<EmojiEmotionsIcon />} onClick={() => handleMoodSelect(mood.value)} sx={{ justifyContent: 'flex-start', textTransform: 'none', fontSize: '0.875rem', padding: '6px 12px' }}> {/* Smaller mood button styles */}
                    {mood.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeMoodDialog} color="primary" size="small"> {/* Reduced button size */}
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
        {isModalOpen && modalContent && (
          <Modal onClose={closeModal}>
            {modalContent}
          </Modal>
        )}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%', fontSize: '0.9rem' }} variant="filled"> {/* Reduced snackbar text size */}
            {snackbar.message}
          </Alert>
        </Snackbar>
      </motion.div>
    );
  }

  // ----------------------------
  // Desktop (or non-mobile) Layout - Modern & Elegant
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
        justifyContent: 'center', // Center the chat box on desktop
        alignItems: 'center',
      }}
    >
      <Toolbar />
      <Box // Using Box instead of Container, for more flexible layout control
        maxWidth="md" // Still limit width for larger screens, but more control
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRadius: '24px', // More rounded corners for a softer look
          boxShadow: '0px 10px 30px rgba(0,0,0,0.1)', // Refined shadow for depth
          backgroundColor: theme.palette.background.paper,
          overflow: 'hidden', // Clip content for rounded corners to work properly
          height: '90vh', // Occupy most of the viewport height
          width: '100%', // Take full width within maxWidth
          maxWidth: '800px', // Define max width here
          marginTop: theme.spacing(4), // **Added marginTop here for desktop layout**
        }}
      >
        {/* Modern Header Section - Desktop */}
        <Box
          sx={{
            padding: '24px', // Increased header padding for desktop
            borderBottom: `1px solid ${theme.palette.divider}`, // Subtler divider
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 60, // Slightly larger avatar for desktop
                height: 60,
                boxShadow: theme.shadows[2],
                mr: 2,
              }}
            >
              <ChatIcon sx={{ color: 'white', fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" color="textPrimary" sx={{ fontWeight: 700 }}> {/* Slightly less bold */}
                MindEase
              </Typography>
              <Typography variant="subtitle2" color="textSecondary"> {/* Subtler subtitle */}
                Your AI Companion
              </Typography>
            </Box>
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5 }}> {/* Increased gap between icons */}
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
            <Tooltip title="Toggle Theme">
              <IconButton onClick={toggleTheme} aria-label="toggle theme" color="inherit">
                <Brightness4Icon />
              </IconButton>
            </Tooltip> {/* Theme toggle for desktop too if desired */}
          </Box>
        </Box>

        {/* Chat Messages Container - Desktop - Modernized Box */}
        <ErrorBoundary>
          <Box
            ref={chatContentRef}
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              padding: '24px', // Increased chat area padding for desktop
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
                        <Button key={idx} variant="outlined" size="small" onClick={() => handleQuickReply(reply)} sx={{ borderRadius: '24px', textTransform: 'none', padding: '6px 16px' }}> {/* Slightly more padded buttons */}
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

        {/* Desktop Chat Input Area - Modernized Box */}
        <Box
          sx={{
            padding: '24px', // Increased input area padding
            borderTop: `1px solid ${theme.palette.divider}`, // Subtler divider
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1.5} // Increased gap in input area
          >
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
                  '& fieldset': { borderColor: 'grey.400', borderRadius: '30px' }, // Rounded border for input
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                  '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
                },
              }}
            />
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
          {/* Footer Disclaimer - Moved to input area for better visual grouping*/}
          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="textSecondary" fontStyle="italic">
              MindEase provides supportive listening, not professional therapy.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Dialogs and Menus are the same as before */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleReactionClose} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        {['👍', '❤️', '😂', '😮', '😢', '👏'].map((emoji) => (
          <MenuItem key={emoji} onClick={() => handleAddReaction(emoji)} sx={{ fontSize: '1.5rem', padding: '0.5rem' }}>
            {emoji}
          </MenuItem>
        ))}
      </Menu>
      <Dialog open={clearConfirmationOpen} onClose={cancelClearChat} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{"Clear Chat History?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
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
      <Dialog open={customInstructionsDialogOpen} onClose={closeCustomInstructionsDialog} aria-labelledby="custom-instructions-dialog-title">
        <DialogTitle id="custom-instructions-dialog-title">Set Custom Instructions</DialogTitle>
        <DialogContent>
          <DialogContentText>
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
                <Button variant="outlined" fullWidth startIcon={<EmojiEmotionsIcon />} onClick={() => handleMoodSelect(mood.value)} sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
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
      {isModalOpen && modalContent && (
        <Modal onClose={closeModal}>
          {modalContent}
        </Modal>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default Chat;
