import React from 'react';
import { Box, alpha, useTheme } from '@mui/material';
import { StyledTextField, AnimatedButton } from './StyledComponents';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

const ChatInput = React.memo(({ 
  userInput, 
  setUserInput, 
  handleSend, 
  isTyping, 
  handleKeyDown, 
  isListening, 
  handleVoiceInput, 
  inputRef 
}) => {
  const theme = useTheme();

  return (
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
          placeholder="How are you feeling today?"
          variant="outlined"
          multiline
          minRows={1}
          maxRows={4}
          fullWidth
          onKeyDown={handleKeyDown}
        />
        <AnimatedButton
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleVoiceInput}
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
  );
});

export default ChatInput; 