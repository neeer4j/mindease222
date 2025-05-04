// src/pages/Chat.js

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';
import {
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  alpha,
} from '@mui/material';

import ErrorBoundary from '../components/ErrorBoundary';
import { AuthContext } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import { MoodContext } from "../contexts/MoodContext";
import { SleepContext } from "../contexts/SleepContext";
import { db } from '../firebase';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';

// Import refactored components
import Message from '../components/chat/Message';
import DesktopChatLayout from '../components/chat/DesktopChatLayout';
import MobileChatLayout from '../components/chat/MobileChatLayout';
import { ClearChatDialog, CustomInstructionsDialog, MoodDialog } from '../components/chat/ChatDialogs';
import { EmojiReactionMenu, ApiToggleMenu } from '../components/chat/ChatMenus';

// Import custom hooks
import useSystemInstructions from '../hooks/useSystemInstructions';
import useChatApiService from '../hooks/useChatApiService';
import useChatModeration from '../hooks/useChatModeration';

// Crisis detection constants
const CRISIS_KEYWORDS = ['suicide', 'self-harm', 'kill myself'];
const EMERGENCY_RESOURCES = [
  'DISHA Helpline: 1056/ 104 (24X7)',
  '0471-2552056, 0471-2551056',
];

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

  // API service hook
  const {
    getChatResponse,
    generateQuickReplies,
    setApiService,
    selectedServerIndex,
    isLoading,
    SERVER_CONFIG,
    getCurrentServerInfo
  } = useChatApiService();

  // Run the moderation hook (analyzes messages silently)
  useChatModeration();

  // State to store complete user profile
  const [userProfile, setUserProfile] = useState(null);

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
  const [apiToggleAnchorEl, setApiToggleAnchorEl] = useState(null);

  // Refs and responsive helpers
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const chatContentRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const userName = user?.displayName || 'there';

  // System instructions
  const systemInstructions = useSystemInstructions(userName, customInstructions, userProfile);

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
          // Check if session welcome message was already shown
          const sessionKey = `mindease_welcomed_${user.uid}`;
          const alreadyWelcomedThisSession = sessionStorage.getItem(sessionKey);

          parsedMessages.forEach(msg => {
            // Don't add cached welcome message if a welcome was already shown this session
            if (msg.isWelcome && alreadyWelcomedThisSession) {
              console.log("Skipping cached welcome message as session already welcomed.");
              return; // Skip adding this cached welcome message
            }

            addMessage(msg.text, msg.isBot, {
              isWelcome: msg.isWelcome,
              timestamp: msg.timestamp, // Keep timestamp from cache
              quickReplies: msg.quickReplies, // Keep quick replies if any
              isEmergency: msg.isEmergency,
              isError: msg.isError
            });
          });
        }
      } catch (error) {
        console.error('Error parsing cached messages:', error);
        // Clear potentially corrupted cache
        localStorage.removeItem(`mindease_messages_${user.uid}`);
        setSnackbar({ open: true, message: 'Error loading cached messages. Cache cleared.', severity: 'warning' });
        // Ensure session welcome state is reset if cache fails
        sessionStorage.removeItem(`mindease_welcomed_${user.uid}`);
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

  // Load user profile data when the component mounts
  useEffect(() => {
    const fetchUserProfileData = async () => {
      if (!user || !user.uid) return;
      
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
          const newProfileData = userSnapshot.data();
          
          // Only log once rather than on every render
          if (!userProfile) {
            console.log("User profile data loaded:", newProfileData);
          }
          
          // Check if habits or hobbies have been updated - only if userProfile already exists
          if (userProfile) {
            const habitsChanged = 
              JSON.stringify(userProfile.preferredHabits) !== JSON.stringify(newProfileData.preferredHabits);
            const hobbiesChanged = 
              JSON.stringify(userProfile.hobbies) !== JSON.stringify(newProfileData.hobbies);
            
            // Only update and clear chat if there are actual changes
            if ((habitsChanged && newProfileData.preferredHabits && newProfileData.preferredHabits.length > 0) ||
                (hobbiesChanged && newProfileData.hobbies && newProfileData.hobbies.length > 0)) {
              console.log("Habits or hobbies changed, clearing chat history");
              
              // Set profile data first, then clear chat to prevent extra rerenders
              setUserProfile(newProfileData);
              clearChat();
              
              setSnackbar({
                open: true,
                message: 'Your profile has been updated! Chat history cleared to ensure the AI considers your new preferences.',
                severity: 'success',
              });
              return; // Exit early to prevent setting profile again
            }
          }
          
          // First time loading profile with data
          if (!userProfile && (newProfileData.occupation || 
                  (newProfileData.preferredHabits && newProfileData.preferredHabits.length > 0) ||
                  (newProfileData.hobbies && newProfileData.hobbies.length > 0))) {
            setUserProfile(newProfileData);
            setSnackbar({
              open: true,
              message: 'Your personal information like occupation, habits, and hobbies will be considered to provide more personalized support. Try clearing the chat for fully personalized responses!',
              severity: 'info',
            });
            return; // Exit early
          }
          
          // Set profile data if not already set or returned early
          if (!userProfile) {
            setUserProfile(newProfileData);
          }
        }
      } catch (error) {
        console.error("Error fetching complete user profile:", error);
      }
    };
    
    fetchUserProfileData();
    
    // Set up a listener for profile changes instead of repeatedly fetching
    const userDocRef = doc(db, "users", user?.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        fetchUserProfileData();
      }
    });
    
    return () => unsubscribe();
  }, [user]); // Only depend on user, not userProfile or clearChat

  // Modified welcome message logic
  useEffect(() => {
    const shouldShowWelcome = () => {
      // Don't show welcome if no user, messages exist, or welcome already shown
      if (!user || messages.length > 0) return false;
      
      // Check if we've already welcomed this user in this session
      const sessionKey = `mindease_welcomed_${user.uid}`;
      return !sessionStorage.getItem(sessionKey);
    };
    
    const addWelcomeMessage = async () => {
      if (!shouldShowWelcome()) return;
      
      // Mark as welcomed for this session
      sessionStorage.setItem(`mindease_welcomed_${user.uid}`, 'true');
      
      let welcomeMessage = `Hi ${userName || 'there'}! I'm MindEase, your AI therapist. How are you feeling today?`;
      
      // Add personalized habit and hobby reference if available
      if ((userProfile?.preferredHabits && Array.isArray(userProfile.preferredHabits) && userProfile.preferredHabits.length > 0) ||
          (userProfile?.hobbies && Array.isArray(userProfile.hobbies) && userProfile.hobbies.length > 0)) {
        
        welcomeMessage = `Hi ${userName || 'there'}! I'm MindEase, your AI therapist. `;
        
        if (userProfile?.preferredHabits && userProfile.preferredHabits.length > 0) {
          welcomeMessage += `I see you're interested in ${userProfile.preferredHabits.join(', ')}. These are great habits for mental wellbeing!`;
        }
        
        if (userProfile?.hobbies && userProfile.hobbies.length > 0) {
          welcomeMessage += ` ${userProfile?.preferredHabits?.length > 0 ? 'Also, I' : 'I'} notice you enjoy ${userProfile.hobbies.join(', ')} as hobbies. It's wonderful to have activities you're passionate about.`;
        }
        
        welcomeMessage += ' How are you feeling today?';
      }
      
      try {
        await addMessage(welcomeMessage, true, {
          id: 'welcome',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isWelcome: true
        });
      } catch (error) {
        console.error('Error adding welcome message:', error);
      }
    };
    
    addWelcomeMessage();
  }, [user, messages.length, userName, addMessage, userProfile]);

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

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening]);

  // Mood prompting logic
  const lastMoodPromptTimeRef = useRef(0);
  const checkAndPromptMood = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastMoodPromptTimeRef.current < 15 * 60 * 1000) return; // 15 minutes
    const today = new Date().toDateString();
    const lastMood = moodEntries[moodEntries.length - 1];
    const hasLoggedToday =
      lastMood && new Date(lastMood.timestamp).toDateString() === today;
    let negativeDetected = false;
    const lastUserMessage = messages.slice().reverse().find((msg) => !msg.isBot);
    if (lastUserMessage && typeof lastUserMessage.text === 'string') {
      const text = lastUserMessage.text.toLowerCase();
      const negativeWords = ['sad', 'depressed', 'lonely', 'miserable', 'down', 'unhappy', 'anxious'];
      for (let word of negativeWords) {
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

    try {
      // Get response from the chat API service
      const response = await getChatResponse(trimmedInput, systemInstructions, messages);
      
      const botMessage = {
        text: response.text,
        isBot: true,
        timestamp: new Date().toISOString(),
        isEmergency: false,
        server: response.server
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
      
      // Generate quick replies
      const quickReplies = await generateQuickReplies(trimmedInput, response.text);
      if (quickReplies && quickReplies.length > 0) {
        await addQuickReplies(botMessageId, quickReplies);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage = {
        text: "Sorry, I'm having trouble connecting to the servers. Please try again later.",
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
    userName,
    isMobile,
    addMessage,
    checkAndPromptMood,
    messages,
    systemInstructions,
    getChatResponse,
    generateQuickReplies
  ]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      setUserIsTyping(true);
    }
  }, [handleSend]);

  // Clear chat handlers
  const handleClearChat = useCallback(() => setClearConfirmationOpen(true), []);
  const confirmClearChat = useCallback(async () => {
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
  }, [clearChat, user]);
  const cancelClearChat = useCallback(() => setClearConfirmationOpen(false), []);

  // Reaction handlers
  const handleReactionClick = useCallback((event, messageId) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  }, []);
  const handleReactionClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedMessageId(null);
  }, []);
  const handleAddReaction = useCallback((emoji) => {
    if (selectedMessageId) {
      addReaction(selectedMessageId, emoji);
      setSnackbar({
        open: true,
        message: 'Reaction added.',
        severity: 'success',
      });
    }
    handleReactionClose();
  }, [selectedMessageId, addReaction, handleReactionClose]);

  // Mood dialog handlers
  const openMoodDialog = useCallback(() => setMoodDialogOpen(true), []);
  const closeMoodDialog = useCallback(() => setMoodDialogOpen(false), []);
  const handleMoodSelect = useCallback((mood) => {
    addMood(mood, 'Logged via chat interface');
    addMessage(`Mood level ${mood} logged.`, false, {
      timestamp: new Date().toISOString(),
    });
    closeMoodDialog();
  }, [addMood, addMessage, closeMoodDialog]);

  // Quick replies functions
  const handleQuickReply = useCallback(async (reply) => {
    setUserInput(reply);
    await handleSend();
  }, [handleSend]);

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
  const openCustomInstructionsDialog = useCallback(() => {
    setCustomInstructionsInput(customInstructions || '');
    setCustomInstructionsDialogOpen(true);
  }, [customInstructions]);

  const closeCustomInstructionsDialog = useCallback(() => {
    setCustomInstructionsDialogOpen(false);
    setCustomInstructionsInput('');
  }, []);

  const handleCustomInstructionsSave = useCallback(async () => {
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
  }, [user, customInstructionsInput, clearChat, closeCustomInstructionsDialog]);

  // API toggle menu handlers
  const handleApiToggleClick = useCallback((event) => {
    setApiToggleAnchorEl(event.currentTarget);
  }, []);

  const handleApiToggleClose = useCallback(() => {
    setApiToggleAnchorEl(null);
  }, []);

  // Update snackbar when server index changes (e.g., via menu selection or auto-switch)
  useEffect(() => {
    const currentServer = getCurrentServerInfo();
    if (currentServer) { // Ensure currentServer is defined
        setSnackbar({
            open: true,
            message: `Switched to ${currentServer.name} API`,
            severity: 'info',
        });
    }
  }, [selectedServerIndex, getCurrentServerInfo]); // Add getCurrentServerInfo dependency

  // Helper: determine if two messages are in the same time group
  const isSameTimeGroup = useCallback((prevMsg, curMsg) => {
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
  }, []);

  // Memoize message rendering logic
  const renderMessages = useCallback(() => {
    return messages.map((msg, index) => {
      const showTimestamp = !isSameTimeGroup(messages[index - 1], msg);
      return (
        <Message
          key={msg.id || index}
          msg={msg}
          index={index}
          showTimestamp={showTimestamp}
          theme={theme}
          handleQuickReply={handleQuickReply}
        />
      );
    });
  }, [messages, theme, handleQuickReply, isSameTimeGroup]);

  // Close snackbar handler
  const handleSnackbarClose = () => {
    setSnackbar((s) => ({ ...s, open: false }));
  };

  // Render appropriate layout based on screen size
  if (isMobile) {
    return (
      <ErrorBoundary>
        <MobileChatLayout
          messages={messages}
          renderMessages={renderMessages}
          isTyping={isTyping}
          userInput={userInput}
          setUserInput={setUserInput}
          handleSend={handleSend}
          handleKeyDown={handleKeyDown}
          isListening={isListening}
          handleVoiceInput={handleVoiceInput}
          inputRef={inputRef}
          chatContentRef={chatContentRef}
          openMoodDialog={openMoodDialog}
          handleClearChat={handleClearChat}
          openCustomInstructionsDialog={openCustomInstructionsDialog}
          handleApiToggleClick={handleApiToggleClick}
          selectedServerIndex={selectedServerIndex}
          currentServerInfo={getCurrentServerInfo()}
          toggleTheme={toggleTheme}
        />

        {/* Menus and Dialogs */}
        <EmojiReactionMenu
          anchorEl={anchorEl}
          handleClose={handleReactionClose}
          handleAddReaction={handleAddReaction}
        />

        <ApiToggleMenu
          anchorEl={apiToggleAnchorEl}
          handleClose={handleApiToggleClose}
          setApiService={setApiService}
          selectedServerIndex={selectedServerIndex}
          serverConfig={SERVER_CONFIG}
        />

        <ClearChatDialog
          open={clearConfirmationOpen}
          handleCancel={cancelClearChat}
          handleConfirm={confirmClearChat}
        />

        <CustomInstructionsDialog
          open={customInstructionsDialogOpen}
          handleClose={closeCustomInstructionsDialog}
          handleSave={handleCustomInstructionsSave}
          value={customInstructionsInput}
          onChange={setCustomInstructionsInput}
        />

        <MoodDialog
          open={moodDialogOpen}
          handleClose={closeMoodDialog}
          handleMoodSelect={handleMoodSelect}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
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
      </ErrorBoundary>
    );
  }

  // Desktop layout
  return (
    <ErrorBoundary>
      <DesktopChatLayout
        messages={messages}
        renderMessages={renderMessages}
        isTyping={isTyping}
        userInput={userInput}
        setUserInput={setUserInput}
        handleSend={handleSend}
        handleKeyDown={handleKeyDown}
        isListening={isListening}
        handleVoiceInput={handleVoiceInput}
        inputRef={inputRef}
        chatContentRef={chatContentRef}
        openMoodDialog={openMoodDialog}
        handleClearChat={handleClearChat}
        openCustomInstructionsDialog={openCustomInstructionsDialog}
        handleApiToggleClick={handleApiToggleClick}
        selectedServerIndex={selectedServerIndex}
        currentServerInfo={getCurrentServerInfo()}
      />

      {/* Menus and Dialogs */}
      <EmojiReactionMenu
        anchorEl={anchorEl}
        handleClose={handleReactionClose}
        handleAddReaction={handleAddReaction}
      />

      <ApiToggleMenu
        anchorEl={apiToggleAnchorEl}
        handleClose={handleApiToggleClose}
        setApiService={setApiService}
        selectedServerIndex={selectedServerIndex}
        serverConfig={SERVER_CONFIG}
      />

      <ClearChatDialog
        open={clearConfirmationOpen}
        handleCancel={cancelClearChat}
        handleConfirm={confirmClearChat}
      />

      <CustomInstructionsDialog
        open={customInstructionsDialogOpen}
        handleClose={closeCustomInstructionsDialog}
        handleSave={handleCustomInstructionsSave}
        value={customInstructionsInput}
        onChange={setCustomInstructionsInput}
      />

      <MoodDialog
        open={moodDialogOpen}
        handleClose={closeMoodDialog}
        handleMoodSelect={handleMoodSelect}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
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
    </ErrorBoundary>
  );
};

export default React.memo(Chat);