// src/components/BookFacility.jsx

import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { styled } from '@mui/system';
import {
  Book as BookIcon,
  FitnessCenter as FitnessCenterIcon,
  Pool as PoolIcon,
  MeetingRoom as MeetingRoomIcon,
  AccessTime as TimeIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import debounce from 'lodash.debounce';

// Facility options with corresponding icons
const facilities = [
  { value: 1, label: 'Gym', icon: <FitnessCenterIcon /> },
  { value: 2, label: 'Pool', icon: <PoolIcon /> },
  { value: 3, label: 'Community Hall', icon: <MeetingRoomIcon /> },
];

// Time slots for booking
const timeSlots = [
  { value: 'morning', label: 'Morning (8:00 AM - 12:00 PM)' },
  { value: 'afternoon', label: 'Afternoon (12:00 PM - 4:00 PM)' },
  { value: 'evening', label: 'Evening (4:00 PM - 8:00 PM)' },
];

// Styled Gradient Button using MUI's styled API
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  color: '#fff',
  borderRadius: '12px',
  padding: '10px 20px',
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

const BookFacility = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    facility: '',
    date: '',
    timeSlot: '',
  });

  // Pricing and availability
  const [price, setPrice] = useState(null);
  const [availability, setAvailability] = useState(null);

  // Loading and notifications
  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    type: 'success',
    message: '',
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Current bookings state
  const [currentBookings, setCurrentBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState('');

  // Cancellation dialog state
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    bookingId: null,
  });

  // Deletion dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    bookingId: null,
  });

  // Calculate dynamic pricing based on facility and time slot
  useEffect(() => {
    const { facility, timeSlot, date } = formData;
    if (facility && timeSlot && date) {
      const facilityDetails = facilities.find(f => f.value === parseInt(facility));
      if (facilityDetails) {
        // Assuming pricing is handled in the backend, but if frontend needs to show estimates:
        // For demonstration, assign arbitrary prices
        let estimatedPrice = 0;
        switch (timeSlot) {
          case 'morning':
            estimatedPrice = 50;
            break;
          case 'afternoon':
            estimatedPrice = 60;
            break;
          case 'evening':
            estimatedPrice = 70;
            break;
          default:
            estimatedPrice = 0;
        }
        setPrice(estimatedPrice);
      }
    } else {
      setPrice(null);
    }
  }, [formData]);

  // Debounced availability check to prevent excessive API calls
  const checkAvailability = useCallback(
    debounce(async (facility, date, timeSlot) => {
      try {
        const response = await axios.post(
          'http://localhost:5000/api/bookings/check-availability',
          {
            facility_id: facility,
            date,
            time_slot: timeSlot,
          }
        );
        setAvailability(response.data.available);
      } catch (err) {
        console.error('Error checking availability', err);
        setAvailability(null);
      }
    }, 500),
    []
  );

  // Check availability whenever facility, date, or timeSlot changes
  useEffect(() => {
    const { facility, date, timeSlot } = formData;
    if (facility && date && timeSlot) {
      checkAvailability(facility, date, timeSlot);
    } else {
      setAvailability(null);
    }
  }, [formData, checkAvailability]);

  // Fetch current bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/bookings/user', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        console.log('Fetched Bookings:', response.data); // Debugging log
        setCurrentBookings(response.data);
        setBookingsLoading(false);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setBookingsError('Failed to load bookings. Please try again later.');
        setBookingsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchBookings();
    } else {
      setBookingsLoading(false);
    }
  }, [isAuthenticated]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validate form inputs
  const validateForm = () => {
    const { facility, date, timeSlot } = formData;
    const newErrors = {};

    if (!facility) newErrors.facility = 'Please select a facility.';
    if (!date) newErrors.date = 'Please select a date.';
    if (!timeSlot) newErrors.timeSlot = 'Please select a time slot.';
    if (date && new Date(date) < new Date().setHours(0, 0, 0, 0))
      newErrors.date = 'Date cannot be in the past.';
    if (availability === false)
      newErrors.availability = 'Selected time slot is not available.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setOpenConfirm(true);
    } else {
      setNotification({
        open: true,
        type: 'error',
        message: 'Please correct the errors in the form.',
      });
    }
  };

  // Confirm booking after user approval
  const confirmBooking = async () => {
    setOpenConfirm(false);
    setLoading(true);
    try {
      console.log('Attempting to book facility:', formData); // Debugging log
      const response = await axios.post(
        'http://localhost:5000/api/bookings',
        {
          facility_id: formData.facility,
          date: formData.date,
          time_slot: formData.timeSlot,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Booking Response:', response); // Debugging log

      if (response.status === 201) {
        setNotification({
          open: true,
          type: 'success',
          message: 'Facility booked successfully!',
        });
        handleReset();
        // Refresh current bookings
        fetchCurrentBookings();
      } else {
        setNotification({
          open: true,
          type: 'error',
          message: response.data.message || 'Something went wrong.',
        });
      }
    } catch (err) {
      console.error('Error during booking:', err); // Debugging log
      setNotification({
        open: true,
        type: 'error',
        message:
          err.response?.data?.message ||
          'Booking failed. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch current bookings (used after booking)
  const fetchCurrentBookings = async () => {
    setBookingsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/bookings/user', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Fetched Bookings:', response.data); // Debugging log
      setCurrentBookings(response.data);
      setBookingsLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookingsError('Failed to load bookings. Please try again later.');
      setBookingsLoading(false);
    }
  };

  // Reset form fields
  const handleReset = () => {
    setFormData({
      facility: '',
      date: '',
      timeSlot: '',
    });
    setErrors({});
    setAvailability(null);
    setPrice(null);
  };

  // Close notification snackbar
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Open cancellation dialog
  const handleOpenCancelDialog = (bookingId) => {
    setCancelDialog({ open: true, bookingId });
  };

  // Close cancellation dialog
  const handleCloseCancelDialog = () => {
    setCancelDialog({ open: false, bookingId: null });
  };

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    const { bookingId } = cancelDialog;
    setCancelDialog({ open: false, bookingId: null });
    setLoading(true);
    try {
      console.log(`Attempting to cancel booking with ID: ${bookingId}`); // Debugging log
      const response = await axios.delete(
        `http://localhost:5000/api/bookings/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Cancellation Response:', response); // Debugging log

      if (response.status === 200) {
        setNotification({
          open: true,
          type: 'success',
          message: 'Booking canceled successfully!',
        });
        // Remove canceled booking from currentBookings with animation
        setCurrentBookings((prevBookings) =>
          prevBookings.filter((booking) => booking.id !== bookingId) // Adjust 'id' if necessary
        );
      } else {
        setNotification({
          open: true,
          type: 'error',
          message: response.data.message || 'Failed to cancel booking.',
        });
      }
    } catch (err) {
      console.error('Error during cancellation:', err); // Debugging log
      setNotification({
        open: true,
        type: 'error',
        message:
          err.response?.data?.message ||
          'Cancellation failed. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Open deletion dialog for permanent removal
  const handleOpenDeleteDialog = (bookingId) => {
    setDeleteDialog({ open: true, bookingId });
  };

  // Close deletion dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, bookingId: null });
  };

  // Handle permanent booking deletion
  const handleDeleteBooking = async () => {
    const { bookingId } = deleteDialog;
    setDeleteDialog({ open: false, bookingId: null });
    setLoading(true);
    try {
      console.log(`Attempting to delete booking with ID: ${bookingId}`); // Debugging log
      const response = await axios.delete(
        `http://localhost:5000/api/bookings/${bookingId}/delete`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      console.log('Deletion Response:', response); // Debugging log

      if (response.status === 200) {
        setNotification({
          open: true,
          type: 'success',
          message: 'Booking removed successfully!',
        });
        // Remove booking from currentBookings with animation
        setCurrentBookings((prevBookings) =>
          prevBookings.filter((booking) => booking.id !== bookingId) // Adjust 'id' if necessary
        );
      } else {
        setNotification({
          open: true,
          type: 'error',
          message: response.data.message || 'Failed to remove booking.',
        });
      }
    } catch (err) {
      console.error('Error during deletion:', err); // Debugging log
      setNotification({
        open: true,
        type: 'error',
        message:
          err.response?.data?.message ||
          'Removal failed. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  // If the user is not authenticated, prompt them to log in
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: 'center' }}>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Please log in to book a facility.
        </Typography>
        <GradientButton variant="contained" onClick={() => navigate('/login')}>
          Login
        </GradientButton>
      </Container>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.8 }}
        style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)`,
          paddingTop: '4rem',
          paddingBottom: '4rem',
          display: 'flex',
          alignItems: 'flex-start', // Align items to the top
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={6}
            sx={{
              padding: '2rem',
              borderRadius: '16px',
              background: '#fff',
              boxShadow:
                '0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05)',
            }}
          >
            <Typography variant="h4" align="center" gutterBottom>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
              >
                <BookIcon color="primary" />
                Book a Facility
              </Box>
            </Typography>

            {/* Booking Form Container */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ mt: 4 }}
              noValidate
            >
              <Grid container spacing={4}>
                {/* Facility Selection */}
                <Grid item xs={12} sm={6}>
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <TextField
                      select
                      label="Select Facility"
                      name="facility"
                      value={formData.facility}
                      onChange={handleChange}
                      fullWidth
                      required
                      error={Boolean(errors.facility)}
                      helperText={errors.facility}
                      InputProps={{
                        startAdornment: (
                          <Box mr={1} color="primary.main">
                            {
                              facilities.find(
                                (f) => f.value === parseInt(formData.facility)
                              )?.icon
                            }
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                        },
                      }}
                    >
                      {facilities.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {option.icon}
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </motion.div>
                </Grid>

                {/* Date Selection */}
                <Grid item xs={12} sm={6}>
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <TextField
                      type="date"
                      label="Select Date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      fullWidth
                      required
                      error={Boolean(errors.date)}
                      helperText={errors.date}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: new Date().toISOString().split('T')[0], // Disable past dates
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                        },
                      }}
                    />
                  </motion.div>
                </Grid>

                {/* Time Slot Selection */}
                <Grid item xs={12} sm={6}>
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <TextField
                      select
                      label="Select Time Slot"
                      name="timeSlot"
                      value={formData.timeSlot}
                      onChange={handleChange}
                      fullWidth
                      required
                      error={Boolean(errors.timeSlot)}
                      helperText={errors.timeSlot}
                      InputProps={{
                        startAdornment: (
                          <Box mr={1} color="primary.main">
                            <TimeIcon />
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                        },
                      }}
                    >
                      {timeSlots.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </motion.div>
                </Grid>

                {/* Price Display */}
                {price && (
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Typography
                        variant="h6"
                        align="center"
                        color="textPrimary"
                      >
                        Estimated Price: ${price.toFixed(2)}
                      </Typography>
                    </motion.div>
                  </Grid>
                )}

                {/* Availability Message */}
                {availability !== null && (
                  <Grid item xs={12}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Typography
                        variant="h6"
                        align="center"
                        color={
                          availability ? 'success.main' : 'error.main'
                        }
                      >
                        {availability
                          ? 'Facility is available!'
                          : 'Facility is not available.'}
                      </Typography>
                    </motion.div>
                  </Grid>
                )}

                {/* Display Form Validation Error for Availability */}
                {errors.availability && (
                  <Grid item xs={12}>
                    <Typography color="error" align="center">
                      {errors.availability}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Action Buttons */}
              <Box mt={4} display="flex" justifyContent="center" gap={2}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <GradientButton
                    variant="contained"
                    type="submit"
                    disabled={loading}
                    startIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <BookIcon />
                      )
                    }
                  >
                    {loading ? 'Booking...' : 'Book Now'}
                  </GradientButton>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleReset}
                    disabled={loading}
                    sx={{
                      borderRadius: '12px',
                      padding: '10px 20px',
                    }}
                  >
                    Reset
                  </Button>
                </motion.div>
              </Box>
            </Box>

            {/* Confirmation Dialog for Booking */}
            <Dialog
              open={openConfirm}
              onClose={() => setOpenConfirm(false)}
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
                    <strong>Facility:</strong> {facilities.find((f) => f.value === parseInt(formData.facility))?.label || ''}
                  </Typography>
                  <Typography>
                    <strong>Date:</strong> {new Date(formData.date).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    <strong>Time Slot:</strong> {timeSlots.find((t) => t.value === formData.timeSlot)?.label || ''}
                  </Typography>
                  <Typography>
                    <strong>Price:</strong> {price ? `$${price.toFixed(2)}` : 'N/A'}
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenConfirm(false)} color="secondary">
                  Cancel
                </Button>
                <GradientButton onClick={confirmBooking} variant="contained">
                  Confirm
                </GradientButton>
              </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
              open={notification.open}
              autoHideDuration={6000}
              onClose={handleCloseNotification}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert
                onClose={handleCloseNotification}
                severity={notification.type}
                sx={{ width: '100%' }}
                variant="filled"
              >
                {notification.message}
              </Alert>
            </Snackbar>

            {/* Current Booking Details Container */}
            <Box mt={8}>
              <Typography variant="h5" gutterBottom>
                Your Current Bookings
              </Typography>

              {bookingsLoading ? (
                <Box display="flex" justifyContent="center" mt={4}>
                  <CircularProgress />
                </Box>
              ) : bookingsError ? (
                <Typography color="error" align="center">
                  {bookingsError}
                </Typography>
              ) : currentBookings.length === 0 ? (
                <Typography align="center" color="textSecondary">
                  You have no current bookings.
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '12px' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Facility</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Time Slot</strong></TableCell>
                        <TableCell><strong>Price</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <AnimatePresence>
                        {currentBookings.map((booking) => (
                          <motion.tr
                            key={booking.id} // Ensure 'id' is unique and consistent
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <TableCell>{booking.facility_name}</TableCell>
                            <TableCell>{new Date(booking.date).toLocaleDateString()}</TableCell>
                            <TableCell style={{ textTransform: 'capitalize' }}>
                              {booking.time_slot}
                            </TableCell>
                            <TableCell>
                              {booking.price != null ? `$${booking.price.toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Typography
                                color={
                                  booking.status === 'Accepted'
                                    ? 'success.main'
                                    : booking.status === 'Rejected'
                                    ? 'error.main'
                                    : booking.status === 'Canceled'
                                    ? 'error.main'
                                    : 'warning.main'
                                }
                                variant="body2"
                                fontWeight="bold"
                              >
                                {booking.status}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {/* Only allow cancellation if status is Pending or Accepted */}
                              {(booking.status === 'Pending' || booking.status === 'Accepted') && (
                                <IconButton
                                  color="error"
                                  onClick={() => handleOpenCancelDialog(booking.id)} // Ensure 'id' is correct
                                >
                                  <CancelIcon />
                                </IconButton>
                              )}
                              {/* Allow permanent deletion for Canceled bookings */}
                              {booking.status === 'Canceled' && (
                                <IconButton
                                  color="secondary"
                                  onClick={() => handleOpenDeleteDialog(booking.id)} // Ensure 'id' is correct
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* Cancellation Confirmation Dialog */}
            <Dialog
              open={cancelDialog.open}
              onClose={handleCloseCancelDialog}
              aria-labelledby="cancel-dialog-title"
              aria-describedby="cancel-dialog-description"
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
              <DialogTitle id="cancel-dialog-title">Cancel Booking</DialogTitle>
              <DialogContent>
                <DialogContentText id="cancel-dialog-description">
                  Are you sure you want to cancel this booking? This action cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseCancelDialog} color="secondary">
                  No
                </Button>
                <Button onClick={handleCancelBooking} color="error" variant="contained">
                  Yes, Cancel
                </Button>
              </DialogActions>
            </Dialog>

            {/* Deletion Confirmation Dialog */}
            <Dialog
              open={deleteDialog.open}
              onClose={handleCloseDeleteDialog}
              aria-labelledby="delete-dialog-title"
              aria-describedby="delete-dialog-description"
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
              <DialogTitle id="delete-dialog-title">Delete Booking</DialogTitle>
              <DialogContent>
                <DialogContentText id="delete-dialog-description">
                  Are you sure you want to permanently remove this canceled booking? This action cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDeleteDialog} color="secondary">
                  No
                </Button>
                <Button onClick={handleDeleteBooking} color="secondary" variant="contained">
                  Yes, Delete
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Container>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookFacility;
