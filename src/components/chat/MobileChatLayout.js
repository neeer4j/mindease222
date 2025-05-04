import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Avatar, 
  Tooltip,
  TextField,
  alpha,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import ChatIcon from '@mui/icons-material/Chat';
import MoodIcon from '@mui/icons-material/Mood';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import Brightness4Icon from '@mui/icons-material/Brightness4';

import { GradientButton, chatContentStyles } from './StyledComponents';
import ErrorBoundary from '../ErrorBoundary';

const BOTTOM_NAV_HEIGHT = 56;

const MobileChatLayout = ({
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
  toggleTheme
}) => {
  const theme = useTheme();
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
            <Tooltip title={`Switch AI Server`}>
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
    </motion.div>
  );
};

export default React.memo(MobileChatLayout); 