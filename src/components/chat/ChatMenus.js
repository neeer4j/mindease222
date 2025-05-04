import React from 'react';
import {
  Menu,
  MenuItem,
  Chip,
  Typography,
  Box,
  alpha,
} from '@mui/material';

import { StyledMenuItem } from './StyledComponents';

export const EmojiReactionMenu = ({ anchorEl, handleClose, handleAddReaction }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={handleClose}
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
);

export const ApiToggleMenu = ({ 
  anchorEl, 
  handleClose, 
  setApiService,
  selectedServerIndex,
  serverConfig 
}) => {
  const serverKeys = Object.keys(serverConfig);

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
      PaperProps={{
        sx: {
          mt: 1,
          borderRadius: '12px',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
    >
      {serverKeys.map((key, index) => {
        const server = serverConfig[key];
        const isSelected = index === selectedServerIndex;

        if (!server) {
          console.warn(`Server configuration for key '${key}' not found.`);
          return null;
        }

        return (
          <MenuItem 
            key={key}
            onClick={() => {
              setApiService(index);
              handleClose();
            }}
            selected={isSelected}
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              gap: 2,
              minWidth: '250px'
            }}
          >
            <Box>
              <Typography variant="body1">{server.name || 'Unknown Server'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {server.description || 'No description'}
              </Typography>
            </Box>
            {isSelected && (
              <Chip 
                label="Active" 
                size="small" 
                color={server.color || 'default'}
                variant="outlined"
              />
            )}
          </MenuItem>
        );
      })}
    </Menu>
  );
}; 