// src/components/Message.jsx

import React, { useContext, useMemo } from 'react';
import { Box, Typography, Avatar, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../contexts/AuthContext'; // Adjust the path as needed
dayjs.extend(localizedFormat);

/**
 * Message Component
 *
 * Displays a single chat message, rendering different styles based on whether
 * the message is from a bot or the user. Supports text, images, and mood messages,
 * displays timestamps, and renders reactions.
 *
 * @component
 * @param {object} props - Component properties.
 * @param {object} props.msg - Message object with the following structure:
 *   - {string} id - Unique message ID.
 *   - {string} text - The content of the message.
 *   - {boolean} isBot - Indicates if the message is from the bot (true) or the user (false).
 *   - {boolean} isEmergency - True if the message is an emergency alert, for special styling.
 *   - {string} type - Message type: 'text', 'image', or 'mood'.
 *   - {array<string>} reactions - List of reaction emojis for the message.
 *   - {string|Date|object} timestamp - Message timestamp, can be a string, Date object, or Firestore Timestamp.
 *   - {array<string>} quickReplies -  (Currently not rendered in this component, description for documentation purposes).
 *   - {string} mood - User's mood, applicable if the message type is 'mood'.
 */

// Base options for all avatars, can be extended for bot and user specific settings
const avatarBaseOptions = {
  seed: 'mindEase-default-seed', // Fallback seed for avatar generation
};

// Bot specific avatar options, inheriting from base options
const botAvatarOptions = {
  ...avatarBaseOptions,
  // Add any bot-specific customizations here, if needed in future
};

// User specific avatar options, inheriting from base options
const userAvatarOptions = {
  ...avatarBaseOptions,
  // Add any user-specific customizations here, such as accessories
};

const Message = ({ msg }) => {
  const theme = useTheme();
  const { user } = useContext(AuthContext); // Get the authenticated user from context
  const isBot = msg.isBot;
  const isEmergency = msg.isEmergency;

  // Memoize DiceBear avatar URL generation for bot avatars ONLY
  const botAvatarDiceBearUrl = useMemo(() => {
    if (!isBot) return null; // Only generate for bot messages
    const baseUrl = 'https://api.dicebear.com/6.x';
    const style = 'bottts';
    const options = { ...botAvatarOptions, seed: `mindEase-bot-${msg.userId || avatarBaseOptions.seed}` };
    const params = new URLSearchParams();
    params.append('seed', options.seed);
    return `${baseUrl}/${style}/svg?${params.toString()}`;
  }, [isBot, msg.userId]);

  // Memoize DiceBear avatar URL generation for user fallback avatars
  const userAvatarDiceBearFallbackUrl = useMemo(() => {
    if (isBot) return null; // Only generate for user messages (fallback)
    const baseUrl = 'https://api.dicebear.com/6.x';
    const style = 'micah';
    const options = { ...userAvatarOptions, seed: `user-${msg.userId || Math.random().toString(36).substr(2, 5)}` };
    const params = new URLSearchParams();
    params.append('seed', options.seed);
    return `${baseUrl}/${style}/svg?${params.toString()}`;
  }, [isBot, msg.userId]);

  // Animation variants for smooth message entry
  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  // Function to format timestamp for display, with error handling
  const formatTimestamp = (timestamp) => {
    try {
      if (!timestamp) {
        console.warn("Timestamp is undefined or null in Message component:", msg);
        return '—'; // Placeholder if timestamp is missing
      }

      // Convert Firestore Timestamp to Date if necessary
      const date = timestamp.toDate ? timestamp.toDate() : timestamp instanceof Date ? timestamp : new Date(timestamp);

      if (isNaN(date.getTime())) {
        console.error("Invalid Date object created from timestamp:", timestamp, msg);
        return 'Invalid Date';
      }
      return dayjs(date).format('LT'); // Format to localized time, e.g., 10:30 PM
    } catch (error) {
      console.error("Error formatting timestamp in Message component:", error, msg, typeof timestamp, timestamp);
      return 'Invalid Date';
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={messageVariants}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        display: 'flex',
        justifyContent: isBot ? 'flex-start' : 'flex-end', // Bot messages to the left, user to the right
        marginBottom: theme.spacing(2),
        alignItems: 'flex-start', // Align avatars and message bubbles at the top
      }}
    >
      {/* Bot Avatar - displayed for bot messages */}
      {isBot && (
        <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
          <Avatar
            src={botAvatarDiceBearUrl} // Use botAvatarDiceBearUrl for bot avatars
            alt="Bot Avatar"
            sx={{
              width: 45,
              height: 45,
              mr: 1.5, // Right margin for spacing between avatar and message bubble
              border: `2px solid ${theme.palette.primary.light}`, // Visual distinction for bot avatar
              boxShadow: 2,
            }}
          />
        </motion.div>
      )}

      {/* Chat Bubble - contains the message content */}
      <motion.div whileHover={{ scale: 1.01, boxShadow: 5 }} transition={{ duration: 0.15 }}>
        <Box
          sx={{
            position: 'relative', // Needed for bubble tail positioning
            padding: `${theme.spacing(1.75)} ${theme.spacing(2.5)}`, // Vertical and horizontal padding inside bubble
            borderRadius: '25px', // Rounded corners for chat bubble
            maxWidth: '75%', // Maximum width of the bubble
            background: isEmergency
              ? theme.palette.error.main // Red background for emergency messages
              : isBot
              ? `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})` // Gradient for bot messages
              : `linear-gradient(135deg, ${theme.palette.success.light}, ${theme.palette.success.main})`, // Gradient for user messages
            color: theme.palette.background.paper, // Text color for contrast
            boxShadow: 3, // Subtle shadow for depth
            transformOrigin: isBot ? 'bottom left' : 'bottom right', // Animation origin for scaling

            // Bubble tail (triangle) using pseudo-element ':before'
            '&:before': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              [isBot ? 'left' : 'right']: isBot ? '-12px' : '-10px', // Position tail based on message sender
              width: '12px',
              height: '12px',
              background: 'inherit', // Tail background same as bubble
              clipPath: isBot
                ? 'polygon(0 0, 100% 50%, 0 100%)' // Triangle shape for bot bubble tail
                : 'polygon(100% 0, 0 50%, 100% 100%)', // Triangle shape for user bubble tail
            },
          }}
        >
          {/* Message content based on type */}
          {msg.type === 'image' ? (
            <img
              src={msg.text}
              alt="User upload"
              style={{ maxWidth: '100%', borderRadius: '8px' }}
            />
          ) : msg.type === 'mood' ? (
            <Typography variant="body1">I am feeling {msg.mood}.</Typography>
          ) : (
            // For text messages, render with React Markdown if it's an AI message.
            isBot ? (
              <ReactMarkdown
                components={{
                  // Use MUI Typography for paragraph elements
                  p: ({ node, ...props }) => (
                    <Typography
                      variant="body1"
                      sx={{
                        lineHeight: 1.5,
                        fontWeight: 400,
                        whiteSpace: 'pre-line',
                        wordBreak: 'break-word',
                        fontSize: '0.9rem',
                      }}
                      {...props}
                    />
                  ),
                  // You can add additional custom renderers here if needed
                }}
              >
                {msg.text}
              </ReactMarkdown>
            ) : (
              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.5,
                  fontWeight: 400,
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word',
                  fontSize: '0.9rem',
                }}
              >
                {msg.text}
              </Typography>
            )
          )}

          {/* Reactions rendering */}
          {msg.reactions && msg.reactions.length > 0 && (
            <Box mt={1} display="flex" flexWrap="wrap">
              {msg.reactions.map((reaction, index) => (
                <Box
                  key={index}
                  sx={{
                    marginRight: '4px',
                    fontSize: '1.2rem', // Size of reaction emojis
                  }}
                >
                  {reaction}
                </Box>
              ))}
            </Box>
          )}

          {/* Timestamp - always displayed at the bottom of the message */}
          <Typography
            variant="caption"
            sx={{
              display: 'block', // Ensure timestamp is on a new line
              textAlign: isBot ? 'left' : 'right', // Align timestamp with message text
              marginTop: theme.spacing(0.75), // Space between message text and timestamp
              opacity: 0.8, // Make timestamp slightly less prominent
              fontSize: '0.7rem', // Smaller font size for timestamp
            }}
          >
            {formatTimestamp(msg.timestamp)}
          </Typography>
        </Box>
      </motion.div>

      {/* User Avatar - displayed for user messages */}
      {!isBot && (
        <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
          <Avatar
            // Use the authenticated user's avatar from AuthContext.
            // Falls back to a generated DiceBear avatar if not available.
            src={(user && user.avatar) || userAvatarDiceBearFallbackUrl}
            alt="User Avatar"
            sx={{
              width: 45,
              height: 45,
              ml: 1.5, // Left margin for spacing
              border: `2px solid ${theme.palette.success.light}`, // Visual distinction for user avatar
              boxShadow: 2,
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

// Memoize the Message component for performance optimization.
// It re-renders only if props (msg) change.
export default React.memo(Message);
