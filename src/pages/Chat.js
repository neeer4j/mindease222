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
  Container,
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
import ImageIcon from '@mui/icons-material/Image';
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
import { storage } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
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

  // Outer container styles for mobile
  const outerContainerStyles = isMobile
    ? {
        position: 'relative',
        height: '100vh',
        width: '100vw',
        background: theme.palette.background.gradient,
        display: 'flex',
        flexDirection: 'column',
      }
    : { background: theme.palette.background.gradient };

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

  // Image upload handlers
  const fileInputRef = useRef(null);
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setSnackbar({
        open: true,
        message: 'Unsupported file type. Please upload an image.',
        severity: 'error',
      });
      return;
    }
    const filePath = `chat_images/${user.uid}/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, filePath);
    try {
      await uploadBytes(fileRef, file);
      const fileURL = await getDownloadURL(fileRef);
      const imageMessage = fileURL;
      const messageId = await addMessage(imageMessage, false, {
        type: 'image',
        timestamp: new Date().toISOString(),
      });
      if (!messageId) {
        setSnackbar({
          open: true,
          message: 'Failed to upload image.',
          severity: 'error',
        });
        return;
      }
      setSnackbar({
        open: true,
        message: 'Image uploaded successfully.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload image.',
        severity: 'error',
      });
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
        style={outerContainerStyles}
      >
        {/* Header (minimal) */}
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            backgroundColor: theme.palette.background.paper,
            boxShadow: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40,
                mr: 1,
              }}
            >
              <ChatIcon sx={{ color: 'white', fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" color="textPrimary" sx={{ fontWeight: 800 }}>
                MindEase
              </Typography>
              <Typography variant="caption" color="textSecondary">
                AI Therapist
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
            {/* Theme Toggle Button: Only on Mobile */}
            <Tooltip title="Toggle Theme">
              <IconButton onClick={toggleTheme} aria-label="toggle theme" color="inherit">
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
              px: 1,
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
                            sx={{ borderRadius: '20px', textTransform: 'none' }}
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
                      width: 12,
                      height: 12,
                      bgcolor: 'primary.main',
                      borderRadius: '50%',
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    MindEase is typing...
                  </Typography>
                </Box>
              )}
              {isFetchingQuickReplies && (
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Loading quick replies...
                  </Typography>
                </Box>
              )}
              {chatLoading && !isTyping && (
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" color="textSecondary">
                    Loading messages...
                  </Typography>
                </Box>
              )}
              {chatError && (
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" color="error">
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
              p: 1,
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
                    padding: '6px 12px',
                    '& fieldset': { borderColor: 'grey.400' },
                    '&:hover fieldset': { borderColor: theme.palette.primary.main },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  overflow: 'hidden',
                }}
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
              <Tooltip title="Upload Image">
                <IconButton onClick={handleImageUploadClick} aria-label="upload image" color="primary">
                  <ImageIcon />
                </IconButton>
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
            <MenuItem key={emoji} onClick={() => handleAddReaction(emoji)} sx={{ fontSize: '1.5rem', padding: '0.5rem' }}>
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
        <Dialog
          open={customInstructionsDialogOpen}
          onClose={closeCustomInstructionsDialog}
          aria-labelledby="custom-instructions-dialog-title"
        >
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
  }

  // ----------------------------
  // Desktop (or non-mobile) Layout
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
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
      }}
    >
      <Toolbar />
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pt: theme.spacing(4),
          pb: theme.spacing(4),
          px: theme.spacing(4),
          borderRadius: '16px',
          boxShadow: 6,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {/* Header Section */}
        <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={6} sx={{ textAlign: 'left' }}>
          <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 56,
                height: 56,
                boxShadow: theme.shadows[2],
                mr: 2,
              }}
            >
              <ChatIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" color="textPrimary" sx={{ fontWeight: 800 }}>
                MindEase
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Your AI Therapist
              </Typography>
            </Box>
          </Grid>
          <Grid item sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
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
          </Grid>
        </Grid>
        {/* Chat Messages Container */}
        <ErrorBoundary>
          <Box
            ref={chatContentRef}
            sx={{
              flexGrow: 1,
              height: { xs: '250px', sm: '300px', md: '500px' },
              overflowY: 'auto',
              mb: 4,
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: '16px',
              p: 2,
              backgroundColor: theme.palette.background.paper,
              boxShadow: 4,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: theme.palette.background.paper, borderRadius: '3px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.primary.main, borderRadius: '3px' },
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
                        <Button key={idx} variant="outlined" size="small" onClick={() => handleQuickReply(reply)} sx={{ borderRadius: '20px', textTransform: 'none' }}>
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
        {/* Desktop Chat Input Area */}
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            mb: 4,
          }}
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
                '& fieldset': { borderColor: 'grey.400' },
                '&:hover fieldset': { borderColor: theme.palette.primary.main },
                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
              },
            }}
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          <Tooltip title="Upload Image">
            <IconButton onClick={handleImageUploadClick} aria-label="upload image" color="primary">
              <ImageIcon />
            </IconButton>
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
        {/* Footer Disclaimer */}
        <Box mt={4}>
          <Typography variant="body2" color="textSecondary" align="center" fontStyle="italic">
            MindEase provides supportive listening, not professional therapy.
          </Typography>
        </Box>
      </Container>
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
