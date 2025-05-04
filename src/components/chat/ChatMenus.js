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
  handleApiChange, 
  useBackupApi, 
  serverConfig 
}) => (
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
        <Typography variant="body1">{serverConfig.primary.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {serverConfig.primary.description}
        </Typography>
      </Box>
      {!useBackupApi && (
        <Chip 
          label="Active" 
          size="small" 
          color={serverConfig.primary.color}
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
        <Typography variant="body1">{serverConfig.backup.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {serverConfig.backup.description}
        </Typography>
      </Box>
      {useBackupApi && (
        <Chip 
          label="Active" 
          size="small" 
          color={serverConfig.backup.color}
          variant="outlined"
        />
      )}
    </MenuItem>
  </Menu>
); 