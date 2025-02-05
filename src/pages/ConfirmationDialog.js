// src/components/ConfirmationDialog.jsx

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { motion } from 'framer-motion';
import { styled } from '@mui/system';

// Styled Gradient Button using MUI's styled API
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  color: '#fff',
  borderRadius: '8px',
  padding: '6px 16px',
  boxShadow: theme.shadows[4],
  transition: 'background 0.5s, box-shadow 0.3s, transform 0.2s',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
    boxShadow: theme.shadows[6],
    transform: 'scale(1.05)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

const ConfirmationDialog = ({ open, onClose, onConfirm, bookingDetails }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      TransitionComponent={React.forwardRef(function Transition(props, ref) {
        return (
          <motion.div
            ref={ref}
            {...props}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          />
        );
      })}
    >
      <DialogTitle id="confirm-dialog-title">Confirm Booking</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          Please review and confirm your booking details:
        </DialogContentText>
        <Box mt={2}>
          <Typography>
            <strong>Facility:</strong> {bookingDetails.facility}
          </Typography>
          <Typography>
            <strong>Date:</strong> {bookingDetails.date}
          </Typography>
          <Typography>
            <strong>Time Slot:</strong> {bookingDetails.timeSlot}
          </Typography>
          <Typography>
            <strong>Price:</strong> {bookingDetails.price}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <GradientButton onClick={onConfirm} variant="contained">
          Confirm
        </GradientButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
