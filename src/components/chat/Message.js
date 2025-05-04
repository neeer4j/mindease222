import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import remarkGfm from 'remark-gfm';

import {
  MessageContainer,
  MessageBubble,
  StyledMarkdown,
  TimeStamp
} from './StyledComponents';

// Memoize the message component
const Message = React.memo(({ msg, index, showTimestamp, theme, handleQuickReply }) => {
  return (
    <React.Fragment>
      {showTimestamp && !msg.isWelcome && (
        <Box display="flex" justifyContent="center" my={2}>
          <TimeStamp variant="caption">
            {formatTime(msg.timestamp)}
          </TimeStamp>
        </Box>
      )}
      <motion.div
        initial={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <MessageContainer isBot={msg.isBot}>
          <MessageBubble isBot={msg.isBot}>
            <StyledMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <Typography variant="body1">
                    {children}
                  </Typography>
                ),
              }}
            >
              {typeof msg.text === 'string' ? msg.text : String(msg.text || '')}
            </StyledMarkdown>
          </MessageBubble>
        </MessageContainer>
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

// Utility function for time formatting
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

export default Message; 