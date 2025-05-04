import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Avatar, 
  Tooltip, 
  alpha,
  useTheme 
} from '@mui/material';
import { motion } from 'framer-motion';
import ChatIcon from '@mui/icons-material/Chat';
import MoodIcon from '@mui/icons-material/Mood';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncAltIcon from '@mui/icons-material/SyncAlt';

import { StyledChatContainer, StyledBadge, chatContentStyles, TypingIndicator, TypingDot } from './StyledComponents';
import ChatInput from './ChatInput';
import ErrorBoundary from '../ErrorBoundary';

const DesktopChatLayout = ({ 
  messages, 
  renderMessages, 
  isTyping, 
  userInput, 
  setUserInput, 
  handleSend, 
  handleKeyDown, 
  isListening, 
  handleVoiceInput, 
  inputRef,
  chatContentRef,
  openMoodDialog,
  handleClearChat,
  openCustomInstructionsDialog,
  handleApiToggleClick,
  useBackupApi,
  currentServerInfo
}) => {
  const theme = useTheme();

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
      <StyledChatContainer
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '82vh',
          width: '100%',
          maxWidth: '1200px',
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
            <Tooltip title={`Current: ${currentServerInfo.name}`}>
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
                  <TypingIndicator>
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
                  </TypingIndicator>
                </motion.div>
              )}
            </Box>
          </Box>
        </ErrorBoundary>

        {/* Chat Input */}
        <ChatInput
          userInput={userInput}
          setUserInput={setUserInput}
          handleSend={handleSend}
          isTyping={isTyping}
          handleKeyDown={handleKeyDown}
          isListening={isListening}
          handleVoiceInput={handleVoiceInput}
          inputRef={inputRef}
        />
      </StyledChatContainer>
    </motion.div>
  );
};

export default React.memo(DesktopChatLayout); 