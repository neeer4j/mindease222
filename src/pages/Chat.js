// src/pages/Chat.js

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Badge,
  Chip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ChatIcon from '@mui/icons-material/Chat';
import MoodIcon from '@mui/icons-material/Mood';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { motion } from 'framer-motion';
import { styled, alpha } from '@mui/system';

import { GoogleGenerativeAI } from '@google/generative-ai';
import ErrorBoundary from '../components/ErrorBoundary';
import Message from '../components/Message';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import { MoodContext } from "../contexts/MoodContext";
import { SleepContext } from "../contexts/SleepContext";
import { db } from '../firebase';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';

// *** Added from old code: run chat moderation in background ***
import useChatModeration from '../hooks/useChatModeration';

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
  { label: '😁 Excellent', value: 5 },  // Very Happy/Excellent
  { label: '🙂 Good', value: 4 },       // Good/Happy
  { label: '😐 Neutral', value: 3 },    // Neutral
  { label: '😔 Low', value: 2 },        // Low/Sad
  { label: '😢 Very Low', value: 1 }    // Very Low/Depressed
];

const BOTTOM_NAV_HEIGHT = 56;
const CHAT_INPUT_HEIGHT = 52;
const MOOD_PROMPT_INTERVAL = 15 * 60 * 1000; // 15 minutes

const GradientButton = motion(Button);

const StyledChatContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'light' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.15)} 100%)`,
  borderRadius: '28px',
  boxShadow: theme.palette.mode === 'light'
    ? '0 10px 40px -10px rgba(0,0,0,0.1)'
    : '0 10px 40px -10px rgba(0,0,0,0.3)',
  backdropFilter: 'blur(12px)',
  border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.2)}`,
  overflow: 'hidden',
}));

const MessageContainer = styled(Box)(({ theme, isBot }) => ({
  display: 'flex',
  justifyContent: isBot ? 'flex-start' : 'flex-end',
  marginBottom: theme.spacing(1.5),
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1),
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  '&:hover': {
    '& .message-actions': {
      opacity: 1,
      transform: 'translateX(0)',
    }
  }
}));

const MessageBubble = styled(Box)(({ theme, isBot }) => ({
  background: isBot
    ? theme.palette.mode === 'light'
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`
    : theme.palette.mode === 'light'
      ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.12)} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
  borderRadius: '24px',
  padding: '12px 20px',
  maxWidth: '85%',
  wordWrap: 'break-word',
  boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
  border: `1px solid ${alpha(
    isBot ? theme.palette.primary.main : theme.palette.secondary.main,
    0.15
  )}`,
  position: 'relative',
  transition: 'all 0.2s ease',
  [theme.breakpoints.down('sm')]: {
    padding: '10px 16px',
    maxWidth: '80%',
    borderRadius: isBot ? '20px 20px 20px 8px' : '20px 20px 8px 20px',
    marginLeft: isBot ? 0 : 'auto',
    marginRight: isBot ? 'auto' : 0,
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.12)}`,
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '24px',
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: 'blur(12px)',
    transition: 'all 0.3s ease',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.95),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.primary.main}`,
      boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
    '& fieldset': {
      border: 'none',
    }
  },
  '& .MuiInputBase-input': {
    padding: '16px 24px',
    fontSize: '1rem',
    lineHeight: '1.5',
  }
}));

const AnimatedButton = styled(motion(IconButton))(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  color: theme.palette.primary.contrastText,
  borderRadius: '50%',
  width: 52,
  height: 52,
  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
  border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`,
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
  },
  '&:disabled': {
    background: theme.palette.action.disabledBackground,
    boxShadow: 'none',
  }
}));

// Add these styled components after the existing styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    background: theme.palette.mode === 'light'
      ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.92)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.15)}`,
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  fontSize: '1.5rem',
  padding: theme.spacing(1, 3),
  transition: 'all 0.2s ease',
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.1),
  },
}));

// Add after the existing styled components
const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '12px 24px',
  maxWidth: 'fit-content',
  background: theme.palette.mode === 'light'
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
  borderRadius: '24px',
  marginLeft: theme.spacing(1),
  marginBottom: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
  boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
}));

const TypingDot = styled(motion.div)(({ theme }) => ({
  width: '10px',
  height: '10px',
  backgroundColor: theme.palette.primary.main,
  borderRadius: '50%',
  opacity: 0.7,
}));

// Add a new component for message timestamps
const TimeStamp = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: alpha(theme.palette.text.secondary, 0.7),
  padding: '4px 12px',
  borderRadius: '12px',
  background: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(8px)',
  marginBottom: theme.spacing(2),
  textAlign: 'center',
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    width: 8,
    height: 8,
    borderRadius: '50%',
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(1)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2)',
      opacity: 0,
    },
  },
}));

// Add after the existing constants
const SERVER_CONFIG = {
  primary: {
    name: 'Server 1',
    description: 'Primary Server',
    color: 'primary'
  },
  backup: {
    name: 'Server 2',
    description: 'Backup Server',
    color: 'secondary'
  }
};

const StyledMarkdown = styled(ReactMarkdown)(({ theme }) => ({
  '& p': {
    margin: 0,
    lineHeight: 1.6,
  },
  '& p:not(:last-child)': {
    marginBottom: '0.75em',
  },
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& code': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    padding: '2px 4px',
    borderRadius: '4px',
    fontSize: '0.9em',
    fontFamily: 'monospace',
  },
  '& pre': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    padding: '12px',
    borderRadius: '8px',
    overflow: 'auto',
    '& code': {
      backgroundColor: 'transparent',
      padding: 0,
    },
  },
  '& ul, & ol': {
    paddingLeft: '1.5em',
    marginTop: '0.5em',
    marginBottom: '0.5em',
  },
  '& blockquote': {
    borderLeft: `4px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    margin: '0.5em 0',
    padding: '0.5em 1em',
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    borderRadius: '4px',
    '& p': {
      margin: 0,
    },
  },
  '& img': {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
  },
  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
    marginTop: '0.5em',
    marginBottom: '0.5em',
  },
  '& th, & td': {
    border: `1px solid ${theme.palette.divider}`,
    padding: '8px',
    textAlign: 'left',
  },
  '& th': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
}));

// Add formatTime utility function before MemoizedMessage
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

// Memoize styled components that don't depend on props
const MemoizedMessageContainer = React.memo(MessageContainer);
const MemoizedMessageBubble = React.memo(MessageBubble);
const MemoizedStyledMarkdown = React.memo(StyledMarkdown);
const MemoizedTimeStamp = React.memo(TimeStamp);
const MemoizedTypingIndicator = React.memo(TypingIndicator);

// Memoize the message component
const MemoizedMessage = React.memo(({ msg, index, showTimestamp, theme, handleQuickReply }) => {
  return (
    <React.Fragment>
      {showTimestamp && !msg.isWelcome && (
        <Box display="flex" justifyContent="center" my={2}>
          <MemoizedTimeStamp variant="caption">
            {formatTime(msg.timestamp)}
          </MemoizedTimeStamp>
        </Box>
      )}
      <motion.div
        initial={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <MemoizedMessageContainer isBot={msg.isBot}>
          <MemoizedMessageBubble isBot={msg.isBot}>
            <MemoizedStyledMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <Typography variant="body1">
                    {children}
                  </Typography>
                ),
              }}
            >
              {msg.text}
            </MemoizedStyledMarkdown>
          </MemoizedMessageBubble>
        </MemoizedMessageContainer>
      </motion.div>
      {msg.isBot && msg.quickReplies && (
        <Box 
          display="flex" 
          flexWrap="wrap" 
          gap={1} 
          mt={1} 
          mb={2}
          sx={{
            justifyContent: 'flex-start',
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
            [theme.breakpoints.down('sm')]: {
              maxWidth: '80%',
            }
          }}
        >
          {msg.quickReplies.map((reply, idx) => (
            <Button
              key={idx}
              variant="outlined"
              size="small"
              onClick={() => handleQuickReply(reply)}
              sx={{ borderRadius: '16px', textTransform: 'none', padding: '4px 10px' }}
            >
              {reply}
            </Button>
          ))}
        </Box>
      )}
    </React.Fragment>
  );
});

// Add after the existing styled components and before the Chat component
const chatContentStyles = {
  flex: 1,
  overflowY: 'auto',
  px: 2,
  pt: 2,
  pb: `${BOTTOM_NAV_HEIGHT + CHAT_INPUT_HEIGHT + 32}px`,
  scrollBehavior: 'smooth',
  '::-webkit-scrollbar': {
    width: '4px',
  },
  '::-webkit-scrollbar-thumb': {
    background: 'rgba(128, 128, 128, 0.3)',
    borderRadius: '2px',
  },
  WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
  height: '100%', // Ensure container takes full height
  display: 'flex',
  flexDirection: 'column',
};

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
  const [useBackupApi, setUseBackupApi] = useState(false);
  const [apiToggleAnchorEl, setApiToggleAnchorEl] = useState(null);

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
    () => genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-lite-preview-02-05',
      generationConfig: {
        temperature: 0.7, // Makes responses more natural while maintaining coherence
        topP: 0.8, // Allows for some creative variation in responses
        topK: 40 // Helps maintain consistent therapeutic persona
      }
    }),
    [genAI]
  );

  // Add OpenRouter API configuration
  const openRouterApi = useMemo(() => ({
    url: "https://openrouter.ai/api/v1/chat/completions",
    headers: {
      "Authorization": `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "MindEase",
      "Content-Type": "application/json"
    },
    model: "meta-llama/llama-3-8b-instruct:free"
  }), []);

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

  // Memoize expensive computations
  const memoizedSystemInstructions = useMemo(() => {
    let instructions = `You are MindEase, a warm, empathetic, and supportive AI therapist with expertise in cognitive behavioral therapy, mindfulness, and positive psychology. When responding:
- Use a warm, conversational tone like a caring human therapist
- Show genuine empathy and understanding
- Validate the user's feelings before offering guidance
- Ask thoughtful follow-up questions to better understand their situation
- Offer practical, actionable suggestions when appropriate
- Use therapeutic techniques like reframing, active listening, and gentle challenging
- Be patient and non-judgmental
- Mirror the user's language style while maintaining professionalism
- Avoid clinical or overly formal language
- Remember past context to provide continuity of care

The user's name is ${userName}. You have access to their mood and sleep history. Use this information subtly to personalize your responses and track their progress over time.`;
    if (customInstructions && customInstructions.trim() !== '') {
      instructions += ` ${customInstructions}`;
    }
    return instructions;
  }, [userName, customInstructions]);

  // Add local storage sync for messages
  useEffect(() => {
    if (!user) return;
    
    // Save messages to local storage whenever they change
    if (messages.length > 0) {
      localStorage.setItem(`mindease_messages_${user.uid}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  // Load cached messages on mount
  useEffect(() => {
    if (!user) return;
    
    const cachedMessages = localStorage.getItem(`mindease_messages_${user.uid}`);
    if (cachedMessages) {
      try {
        const parsedMessages = JSON.parse(cachedMessages);
        // Only set cached messages if there are no messages yet
        if (messages.length === 0 && parsedMessages.length > 0) {
          parsedMessages.forEach(msg => {
            addMessage(msg.text, msg.isBot, {
              isWelcome: msg.isWelcome,
              timestamp: msg.timestamp,
              quickReplies: msg.quickReplies,
              isEmergency: msg.isEmergency,
              isError: msg.isError
            });
          });
        }
      } catch (error) {
        console.error('Error parsing cached messages:', error);
      }
    }
  }, [user, addMessage, messages.length]);

  // Load custom instructions from Firestore
  useEffect(() => {
    const loadCustomInstructions = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists() && doc.data().customInstructions) {
            setCustomInstructions(doc.data().customInstructions);
            setCustomInstructionsInput(doc.data().customInstructions);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading custom instructions:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load custom instructions.',
          severity: 'error',
        });
      }
    };

    loadCustomInstructions();
  }, [user]);

  // Modified welcome message logic
  useEffect(() => {
    if (chatLoading || !user) return;
    
    const sessionKey = `mindease_welcomed_${user.uid}`;
    const lastWelcomeKey = `mindease_last_welcome_${user.uid}`;
    
    // Function to check if we should show welcome message
    const shouldShowWelcome = () => {
      // Get the timestamp of the last welcome message
      const lastWelcomeTime = localStorage.getItem(lastWelcomeKey);
      const hasRecentWelcome = lastWelcomeTime && 
        (Date.now() - new Date(lastWelcomeTime).getTime() < 1000 * 60 * 5); // 5 minutes
      
      // Check if there are any non-welcome user messages
      const hasUserMessages = messages.some(msg => !msg.isBot && !msg.isWelcome);
      
      // Don't show welcome if:
      // 1. There's a recent welcome message
      // 2. There are existing messages but no user replies
      // 3. There's already a welcome message in the current session
      return !hasRecentWelcome && 
             !(messages.length > 0 && !hasUserMessages) &&
             !messages.some(msg => msg.isWelcome);
    };

    // Only show welcome message if conditions are met
    if (shouldShowWelcome()) {
      const greetingMessage = `Hello ${userName}! I'm MindEase, your AI therapist. How can I assist you today?`;
      addMessage(greetingMessage, true, {
        isWelcome: true,
        timestamp: new Date().toISOString(),
      });
      
      // Store the welcome message timestamp
      localStorage.setItem(lastWelcomeKey, new Date().toISOString());
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [user, addMessage, userName, chatLoading, messages]);

  // Update the scrollToBottom function
  const scrollToBottom = useCallback(() => {
    if (chatContentRef.current) {
      const messageContainers = chatContentRef.current.querySelectorAll('.MuiBox-root motion.div');
      if (messageContainers.length > 0) {
        const lastMessage = messageContainers[messageContainers.length - 1];
        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback: scroll to bottom of container if no messages found
        chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
      }
    }
  }, []);

  // Add this effect to scroll to the last message when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Add this effect to scroll to the last message when typing state changes
  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping, scrollToBottom]);

  // Add this effect to scroll to the last message on initial load
  useEffect(() => {
    setTimeout(scrollToBottom, 100); // Small delay to ensure content is rendered
  }, [scrollToBottom]);

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

  // Modified handleSend function to use selected API
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
    const userMessageId = await addMessage(
      userMessage.text,
      userMessage.isBot,
      { timestamp: userMessage.timestamp }
    );
    if (!userMessageId) {
      setSnackbar({
        open: true,
        message: 'Failed to send message.',
        severity: 'error',
      });
      return;
    }
    setUserInput('');
    setIsTyping(true);

    const tryServer = async (isPrimary) => {
      try {
        let response;
        
        if (isPrimary) {
          // Use Gemini API (Server 1)
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
              parts: [{ text: memoizedSystemInstructions }],
            },
            ...filteredMessages.map((msg) => ({
              role: msg.isBot ? 'model' : 'user',
              parts: [{ text: msg.text }],
            })),
          ];

          const chat = model.startChat({ history: updatedChatHistory });
          const result = await chat.sendMessage(trimmedInput);
          response = await result.response;
          return response.text();
        } else {
          // Use OpenRouter API (Server 2)
          const chatHistory = messages
            .filter(msg => !msg.isWelcome)
            .map(msg => ({
              role: msg.isBot ? 'assistant' : 'user',
              content: msg.text
            }));

          const openRouterResponse = await fetch(openRouterApi.url, {
            method: "POST",
            headers: openRouterApi.headers,
            body: JSON.stringify({
              model: openRouterApi.model,
              messages: [
                {
                  role: "system",
                  content: memoizedSystemInstructions
                },
                ...chatHistory,
                {
                  role: "user",
                  content: trimmedInput
                }
              ]
            })
          });

          if (!openRouterResponse.ok) {
            throw new Error('Server 2 request failed');
          }

          const data = await openRouterResponse.json();
          return data.choices[0].message.content;
        }
      } catch (error) {
        console.error(`Error with ${isPrimary ? 'Server 1' : 'Server 2'}:`, error);
        throw error;
      }
    };

    try {
      // Try current server first
      const currentServer = !useBackupApi;
      let response;
      
      try {
        response = await tryServer(currentServer);
      } catch (error) {
        // If current server fails, auto-switch to other server
        setUseBackupApi(!currentServer);
        setSnackbar({
          open: true,
          message: `Automatically switched to ${currentServer ? 'Server 2' : 'Server 1'} due to error`,
          severity: 'info',
        });
        response = await tryServer(!currentServer);
      }

      const botMessage = {
        text: response,
        isBot: true,
        timestamp: new Date().toISOString(),
        isEmergency: false,
        server: useBackupApi ? 'Server 2' : 'Server 1'
      };
      const botMessageId = await addMessage(botMessage.text, botMessage.isBot, {
        isEmergency: false,
        timestamp: botMessage.timestamp,
        server: botMessage.server
      });
      if (!botMessageId) {
        setSnackbar({
          open: true,
          message: 'Failed to receive AI response.',
          severity: 'error',
        });
        return;
      }
      const quickReplies = await fetchQuickReplies(trimmedInput, response);
      if (quickReplies && quickReplies.length > 0) {
        await addQuickReplies(botMessageId, quickReplies);
      }
    } catch (error) {
      console.error('Error fetching AI response from both servers:', error);
      const errorMessage = {
        text: "Sorry, I'm having trouble connecting to both servers. Please try again later.",
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
    memoizedSystemInstructions,
    useBackupApi,
    openRouterApi,
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
    if (user) {
      localStorage.removeItem(`mindease_messages_${user.uid}`);
      localStorage.removeItem(`mindease_last_welcome_${user.uid}`);
      sessionStorage.removeItem(`mindease_welcomed_${user.uid}`);
    }
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
    const moodOption = MOOD_OPTIONS.find(option => option.value === mood);
    if (moodOption) {
      addMood(moodOption.value, 'Logged via chat interface');
      addMessage(`Mood "${moodOption.label.split(' ')[1]}" logged.`, false, {
        timestamp: new Date().toISOString(),
      });
    }
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
Based on this therapeutic conversation, suggest 3-4 natural, empathetic responses the user might want to say next. These should feel like organic continuations of the conversation, not generic options.

User: ${userMessage}
Therapist: ${botResponse}

Provide brief, conversational replies that could help the user:
- Express their feelings more deeply
- Explore the topic further
- Respond to your therapeutic suggestions
- Share more about their experience

Format as simple reply options without bullets or numbers.`;

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
    setCustomInstructionsInput(customInstructions || '');
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
      
      // Clear chat after setting custom instructions
      await clearChat();
      if (user) {
        localStorage.removeItem(`mindease_messages_${user.uid}`);
        localStorage.removeItem(`mindease_last_welcome_${user.uid}`);
        sessionStorage.removeItem(`mindease_welcomed_${user.uid}`);
      }
      
      setSnackbar({
        open: true,
        message: 'Custom instructions saved and chat history cleared.',
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

  // Add API toggle menu handlers
  const handleApiToggleClick = (event) => {
    setApiToggleAnchorEl(event.currentTarget);
  };

  const handleApiToggleClose = () => {
    setApiToggleAnchorEl(null);
  };

  const handleApiChange = (useBackup) => {
    setUseBackupApi(useBackup);
    handleApiToggleClose();
    setSnackbar({
      open: true,
      message: `Switched to ${useBackup ? 'Server 2' : 'Server 1'} API`,
      severity: 'info',
    });
  };

  // Memoize handlers
  const memoizedHandleQuickReply = useCallback(async (reply) => {
    setUserInput(reply);
    await handleSend();
  }, [handleSend]);

  const memoizedHandleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      setUserIsTyping(true);
    }
  }, [handleSend]);

  const memoizedHandleVoiceInput = useCallback(() => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening]);

  // Memoize message rendering logic
  const renderMessages = useCallback(() => {
    return messages.map((msg, index) => {
      const showTimestamp = !isSameTimeGroup(messages[index - 1], msg);
      return (
        <MemoizedMessage
          key={msg.id || index}
          msg={msg}
          index={index}
          showTimestamp={showTimestamp}
          theme={theme}
          handleQuickReply={memoizedHandleQuickReply}
        />
      );
    });
  }, [messages, theme, memoizedHandleQuickReply]);

  // Update the chat input section to use memoized handlers
  const renderChatInput = useMemo(() => (
    <Box
      sx={{
        padding: '24px',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.5),
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <StyledTextField
          inputRef={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={`How are you feeling today, ${userName}?`}
          variant="outlined"
          multiline
          minRows={1}
          maxRows={4}
          fullWidth
          onKeyDown={memoizedHandleKeyDown}
        />
        <AnimatedButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={memoizedHandleVoiceInput}
        >
          {isListening ? <MicOffIcon /> : <MicIcon />}
        </AnimatedButton>
        <AnimatedButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={isTyping || !userInput.trim()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            width={24}
            height={24}
          >
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.169-1.408l-7-14z" />
          </svg>
        </AnimatedButton>
      </Box>
    </Box>
  ), [userInput, userName, isTyping, isListening, memoizedHandleKeyDown, memoizedHandleVoiceInput, handleSend, theme]);

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
              <Tooltip title={`Current: ${useBackupApi ? SERVER_CONFIG.backup.name : SERVER_CONFIG.primary.name}`}>
                <IconButton
                  size="small"
                  onClick={handleApiToggleClick}
                  sx={{ color: useBackupApi ? 'secondary.main' : 'primary.main' }}
                >
                  <SyncAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
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
          sx={chatContentStyles}
          role="log"
          aria-live="polite"
        >
          <Box sx={{ flex: 1 }}>
            <ErrorBoundary>
              {renderMessages()}
              {isTyping && (
                <Box display="flex" alignItems="center" mb={1} pl={4}>
                  <Box
                    component={motion.div}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    sx={{
                      display: 'flex',
                      gap: 0.5,
                      alignItems: 'center',
                      background: alpha(theme.palette.primary.main, 0.1),
                      borderRadius: '16px',
                      padding: '8px 12px',
                    }}
                  >
                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.875rem' }}>
                      MindEase is typing
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: theme.palette.primary.main,
                        animation: 'pulse 1s infinite',
                      }}
                    />
                  </Box>
                </Box>
              )}
            </ErrorBoundary>
          </Box>
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
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            px: 2,
            py: 1.5,
            pb: 2,
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
              mb: 0.5,
            }}
          >
            <TextField
              inputRef={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={`How are you feeling today?`}
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
                    aria-hidden="true"
                    focusable="false"
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
          anchorEl={apiToggleAnchorEl}
          open={Boolean(apiToggleAnchorEl)}
          onClose={handleApiToggleClose}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '12px',
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
            },
          }}
        >
          <MenuItem 
            onClick={() => handleApiChange(false)}
            selected={!useBackupApi}
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              gap: 2,
              minWidth: '200px'
            }}
          >
            <Box>
              <Typography variant="body1">{SERVER_CONFIG.primary.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {SERVER_CONFIG.primary.description}
              </Typography>
            </Box>
            {!useBackupApi && (
              <Chip 
                label="Active" 
                size="small" 
                color={SERVER_CONFIG.primary.color}
                variant="outlined"
              />
            )}
          </MenuItem>
          <MenuItem 
            onClick={() => handleApiChange(true)}
            selected={useBackupApi}
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              gap: 2,
              minWidth: '200px'
            }}
          >
            <Box>
              <Typography variant="body1">{SERVER_CONFIG.backup.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {SERVER_CONFIG.backup.description}
              </Typography>
            </Box>
            {useBackupApi && (
              <Chip 
                label="Active" 
                size="small" 
                color={SERVER_CONFIG.backup.color}
                variant="outlined"
              />
            )}
          </MenuItem>
        </Menu>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleReactionClose}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: '12px',
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
            },
          }}
        >
          {['👍', '❤️', '😂', '😮', '😢', '👏'].map((emoji) => (
            <StyledMenuItem key={emoji} onClick={() => handleAddReaction(emoji)}>
              {emoji}
            </StyledMenuItem>
          ))}
        </Menu>
        <StyledDialog open={clearConfirmationOpen} onClose={cancelClearChat}>
          <DialogTitle sx={{ fontSize: '1.5rem', pb: 1 }}>
            Clear Chat History?
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '1rem', opacity: 0.8 }}>
              Are you sure you want to clear the chat history? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button 
              onClick={cancelClearChat} 
              variant="outlined" 
              sx={{ borderRadius: '12px' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmClearChat} 
              variant="contained" 
              sx={{ 
                borderRadius: '12px',
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              Clear Chat
            </Button>
          </DialogActions>
        </StyledDialog>
        <StyledDialog 
          open={customInstructionsDialogOpen} 
          onClose={closeCustomInstructionsDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontSize: '1.5rem', pb: 1 }}>
            Set Custom Instructions
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontSize: '1rem', opacity: 0.8, mb: 2 }}>
              Add custom instructions to tailor the AI's responses to better suit your needs. 
              <Box component="span" sx={{ color: 'warning.main', mt: 1, display: 'block' }}>
                Note: Changing custom instructions will clear your chat history to ensure consistent AI behavior.
              </Box>
            </DialogContentText>
            <StyledTextField
              autoFocus
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              value={customInstructionsInput}
              onChange={(e) => setCustomInstructionsInput(e.target.value)}
              placeholder="e.g., Focus more on cognitive behavioral techniques..."
            />
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button 
              onClick={closeCustomInstructionsDialog} 
              variant="outlined"
              sx={{ borderRadius: '12px' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCustomInstructionsSave} 
              variant="contained"
              sx={{ 
                borderRadius: '12px',
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}
            >
              Save & Clear Chat
            </Button>
          </DialogActions>
        </StyledDialog>
        <StyledDialog open={moodDialogOpen} onClose={closeMoodDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontSize: '1.5rem', pb: 1 }}>
            How Are You Feeling?
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              {MOOD_OPTIONS.map((mood) => (
                <Grid item xs={6} sm={4} key={mood.value}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleMoodSelect(mood.value)}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      height: '60px',
                      fontSize: '1rem',
                      border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      '&:hover': {
                        background: (theme) => alpha(theme.palette.primary.main, 0.1),
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
                        {mood.label.split(' ')[0]}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {mood.label.split(' ')[1]}
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px' }}>
            <Button 
              onClick={closeMoodDialog} 
              variant="outlined"
              sx={{ borderRadius: '12px' }}
            >
              Cancel
            </Button>
          </DialogActions>
        </StyledDialog>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity={snackbar.severity} 
            variant="filled" 
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.15)}`,
            }}
          >
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
        paddingTop: theme.spacing(12),
        paddingBottom: theme.spacing(4),
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
      }}
    >
      <Toolbar 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
        }} 
      />
      <StyledChatContainer
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '82vh',
          width: '100%',
          maxWidth: '900px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Desktop Header */}
        <Box
          sx={{
            padding: '24px',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.5),
            backdropFilter: 'blur(8px)',
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
            <Tooltip title={`Current: ${useBackupApi ? SERVER_CONFIG.backup.name : SERVER_CONFIG.primary.name}`}>
              <Box sx={{ position: 'relative' }}>
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                >
                  <IconButton
                    onClick={handleApiToggleClick}
                    color={useBackupApi ? 'secondary' : 'primary'}
                    sx={{ ml: 1 }}
                  >
                    <SyncAltIcon />
                  </IconButton>
                </StyledBadge>
              </Box>
            </Tooltip>
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
            sx={chatContentStyles}
            role="log"
            aria-live="polite"
          >
            <Box sx={{ flex: 1 }}>
              {renderMessages()}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <MemoizedTypingIndicator>
                    <TypingDot
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.2 }}
                    />
                    <TypingDot
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.2, delay: 0.2 }}
                    />
                    <TypingDot
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.2, delay: 0.4 }}
                    />
                  </MemoizedTypingIndicator>
                </motion.div>
              )}
            </Box>
          </Box>
        </ErrorBoundary>

        {renderChatInput}
      </StyledChatContainer>
      
      {/* Menus and Dialogs */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleReactionClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: '12px',
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
          },
        }}
      >
        {['👍', '❤️', '😂', '😮', '😢', '👏'].map((emoji) => (
          <StyledMenuItem key={emoji} onClick={() => handleAddReaction(emoji)}>
            {emoji}
          </StyledMenuItem>
        ))}
      </Menu>

      <StyledDialog open={clearConfirmationOpen} onClose={cancelClearChat}>
        <DialogTitle sx={{ fontSize: '1.5rem', pb: 1 }}>
          Clear Chat History?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem', opacity: 0.8 }}>
            Are you sure you want to clear the chat history? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={cancelClearChat} 
            variant="outlined" 
            sx={{ borderRadius: '12px' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmClearChat} 
            variant="contained" 
            sx={{ 
              borderRadius: '12px',
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            }}
          >
            Clear Chat
          </Button>
        </DialogActions>
      </StyledDialog>

      <StyledDialog 
        open={customInstructionsDialogOpen} 
        onClose={closeCustomInstructionsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1.5rem', pb: 1 }}>
          Set Custom Instructions
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '1rem', opacity: 0.8, mb: 2 }}>
            Add custom instructions to tailor the AI's responses to better suit your needs. 
            <Box component="span" sx={{ color: 'warning.main', mt: 1, display: 'block' }}>
              Note: Changing custom instructions will clear your chat history to ensure consistent AI behavior.
            </Box>
          </DialogContentText>
          <StyledTextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            value={customInstructionsInput}
            onChange={(e) => setCustomInstructionsInput(e.target.value)}
            placeholder="e.g., Focus more on cognitive behavioral techniques..."
          />
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={closeCustomInstructionsDialog} 
            variant="outlined"
            sx={{ borderRadius: '12px' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCustomInstructionsSave} 
            variant="contained"
            sx={{ 
              borderRadius: '12px',
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            }}
          >
            Save & Clear Chat
          </Button>
        </DialogActions>
      </StyledDialog>

      <StyledDialog open={moodDialogOpen} onClose={closeMoodDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '1.5rem', pb: 1 }}>
          How Are You Feeling?
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            {MOOD_OPTIONS.map((mood) => (
              <Grid item xs={6} sm={4} key={mood.value}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleMoodSelect(mood.value)}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    height: '60px',
                    fontSize: '1rem',
                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    '&:hover': {
                      background: (theme) => alpha(theme.palette.primary.main, 0.1),
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" component="div" sx={{ mb: 0.5 }}>
                      {mood.label.split(' ')[0]}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mood.label.split(' ')[1]}
                    </Typography>
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={closeMoodDialog} 
            variant="outlined"
            sx={{ borderRadius: '12px' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </StyledDialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled" 
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.15)}`,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Add the apiToggleMenu to the Menus and Dialogs section */}
      <Menu
        anchorEl={apiToggleAnchorEl}
        open={Boolean(apiToggleAnchorEl)}
        onClose={handleApiToggleClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: '12px',
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
          },
        }}
      >
        <MenuItem 
          onClick={() => handleApiChange(false)}
          selected={!useBackupApi}
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: 2,
            minWidth: '250px'
          }}
        >
          <Box>
            <Typography variant="body1">{SERVER_CONFIG.primary.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {SERVER_CONFIG.primary.description}
            </Typography>
          </Box>
          {!useBackupApi && (
            <Chip 
              label="Active" 
              size="small" 
              color={SERVER_CONFIG.primary.color}
              variant="outlined"
            />
          )}
        </MenuItem>
        <MenuItem 
          onClick={() => handleApiChange(true)}
          selected={useBackupApi}
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: 2,
            minWidth: '250px'
          }}
        >
          <Box>
            <Typography variant="body1">{SERVER_CONFIG.backup.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {SERVER_CONFIG.backup.description}
            </Typography>
          </Box>
          {useBackupApi && (
            <Chip 
              label="Active" 
              size="small" 
              color={SERVER_CONFIG.backup.color}
              variant="outlined"
            />
          )}
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

// Memoize the entire Chat component
export default React.memo(Chat);