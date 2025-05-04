import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Typography,
  Box,
  alpha,
} from '@mui/material';

import { StyledDialog, StyledTextField } from './StyledComponents';

// Constants
const MOOD_OPTIONS = [
  { label: '😁 Excellent', value: 5 },  // Very Happy/Excellent
  { label: '🙂 Good', value: 4 },       // Good/Happy
  { label: '😐 Neutral', value: 3 },    // Neutral
  { label: '😔 Low', value: 2 },        // Low/Sad
  { label: '😢 Very Low', value: 1 }    // Very Low/Depressed
];

export const ClearChatDialog = ({ open, handleCancel, handleConfirm }) => (
  <StyledDialog open={open} onClose={handleCancel}>
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
        onClick={handleCancel} 
        variant="outlined" 
        sx={{ borderRadius: '12px' }}
      >
        Cancel
      </Button>
      <Button 
        onClick={handleConfirm} 
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
);

export const CustomInstructionsDialog = ({ 
  open, 
  handleClose, 
  handleSave, 
  value, 
  onChange 
}) => (
  <StyledDialog 
    open={open} 
    onClose={handleClose}
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Focus more on cognitive behavioral techniques..."
      />
    </DialogContent>
    <DialogActions sx={{ padding: '16px 24px' }}>
      <Button 
        onClick={handleClose} 
        variant="outlined"
        sx={{ borderRadius: '12px' }}
      >
        Cancel
      </Button>
      <Button 
        onClick={handleSave} 
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
);

export const MoodDialog = ({ open, handleClose, handleMoodSelect }) => (
  <StyledDialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
        onClick={handleClose} 
        variant="outlined"
        sx={{ borderRadius: '12px' }}
      >
        Cancel
      </Button>
    </DialogActions>
  </StyledDialog>
); 