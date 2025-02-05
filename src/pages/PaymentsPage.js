// src/pages/PaymentsPage.js

import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Avatar,
  Chip,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Box,
  MenuItem,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence, AnimateSharedLayout } from 'framer-motion';
import axios from 'axios';
import { styled } from '@mui/system';
import {
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Motion-enhanced Grid components
const MotionGrid = motion(Grid);
const MotionGridItem = motion(Grid);

// Styled Gradient Button with Enhanced Styles
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5, 3),
  boxShadow: theme.shadows[4],
  transition: 'background 0.3s, box-shadow 0.3s, transform 0.2s',
  fontWeight: 700,
  textTransform: 'none',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    boxShadow: theme.shadows[6],
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

// Payment Status Colors
const paymentStatusColors = {
  Pending: 'warning',
  Accepted: 'success',
  Rejected: 'error',
};

// Payment Categories (Assuming similar to Complaints)
const paymentCategories = [
  { value: 'membership', label: 'Membership' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

// Sub-component for Payment Card
const PaymentCard = ({ payment, isAdmin, onUpdateStatus }) => {
  const theme = useTheme();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <Card
        variant="outlined"
        sx={{
          borderLeft: `6px solid ${theme.palette[paymentStatusColors[payment.status]]?.main || 'grey'}`,
          boxShadow: theme.shadows[2],
          borderRadius: theme.shape.borderRadius,
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              <PaymentIcon />
            </Avatar>
          }
          action={
            isAdmin && (
              <Tooltip title="Update Status">
                <IconButton onClick={() => onUpdateStatus(payment)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )
          }
          title={
            <Typography variant="subtitle1" fontWeight="bold">
              Payment ID: {payment.id}
            </Typography>
          }
          subheader={
            <Chip
              label={payment.category || 'Uncategorized'}
              color="primary"
              size="small"
              variant="outlined"
            />
          }
        />
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            {payment.status === 'Accepted' ? (
              <CheckCircleIcon color="success" />
            ) : payment.status === 'Rejected' ? (
              <CancelIcon color="error" />
            ) : (
              <CheckCircleIcon color="warning" />
            )}
            <Chip
              label={payment.status}
              color={paymentStatusColors[payment.status] || 'default'}
              size="small"
            />
          </Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            <strong>Amount:</strong> ${payment.amount.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            <strong>Payment Date:</strong>{' '}
            {payment.payment_date
              ? new Date(payment.payment_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A'}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            <strong>Created At:</strong>{' '}
            {payment.created_at
              ? new Date(payment.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A'}
          </Typography>
          {payment.reason && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>Reason:</strong> {payment.reason}
            </Typography>
          )}
          {payment.response_reason && (
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>Response:</strong> {payment.response_reason}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Sub-component for Update Status Dialog
const UpdateStatusDialog = ({ open, handleClose, payment, handleStatusUpdate }) => {
  const theme = useTheme();
  const [status, setStatus] = useState(payment.status);
  const [reason, setReason] = useState(payment.response_reason || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setStatus(payment.status);
    setReason(payment.response_reason || '');
    setErrors({});
  }, [payment]);

  const validate = () => {
    const tempErrors = {};
    if (!status) tempErrors.status = 'Status is required.';
    if (!reason.trim()) tempErrors.reason = 'Reason is required.';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const submitHandler = () => {
    if (validate()) {
      handleStatusUpdate({ status, reason });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="update-status-dialog-title"
      fullWidth
      maxWidth="sm"
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
      <DialogTitle id="update-status-dialog-title">Update Payment Status</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth
            required
            error={Boolean(errors.status)}
            helperText={errors.status}
            variant="outlined"
          >
            <MenuItem value="Accepted">Accepted</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </TextField>
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            error={Boolean(errors.reason)}
            helperText={errors.reason}
            variant="outlined"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="error">
          Cancel
        </Button>
        <GradientButton onClick={submitHandler} variant="contained">
          Update
        </GradientButton>
      </DialogActions>
    </Dialog>
  );
};

// Sub-component for Financial Summary
const FinancialSummary = ({ summary }) => {
  const theme = useTheme();
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Financial Summary
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              padding: theme.spacing(2),
              borderRadius: theme.shape.borderRadius,
              backgroundColor: theme.palette.background.paper,
              textAlign: 'center',
              boxShadow: theme.shadows[2],
            }}
          >
            <Typography variant="subtitle1">Total Collected</Typography>
            <Typography variant="h6" color="primary">
              ${summary.total_collected ? summary.total_collected.toFixed(2) : '0.00'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              padding: theme.spacing(2),
              borderRadius: theme.shape.borderRadius,
              backgroundColor: theme.palette.background.paper,
              textAlign: 'center',
              boxShadow: theme.shadows[2],
            }}
          >
            <Typography variant="subtitle1">Total Pending</Typography>
            <Typography variant="h6" color="warning.main">
              ${summary.total_pending ? summary.total_pending.toFixed(2) : '0.00'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              padding: theme.spacing(2),
              borderRadius: theme.shape.borderRadius,
              backgroundColor: theme.palette.background.paper,
              textAlign: 'center',
              boxShadow: theme.shadows[2],
            }}
          >
            <Typography variant="subtitle1">Total Rejected</Typography>
            <Typography variant="h6" color="error">
              ${summary.total_rejected ? summary.total_rejected.toFixed(2) : '0.00'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const PaymentsPage = () => {
  const { isAuthenticated, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fetch payments based on user role
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchPayments = async () => {
      setLoadingPayments(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in.');
          setLoadingPayments(false);
          return;
        }

        const endpoint = isAdmin
          ? `${process.env.REACT_APP_API_BASE_URL}/api/payments`
          : `${process.env.REACT_APP_API_BASE_URL}/api/payments/user`;

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPayments(response.data);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || 'Failed to fetch payments. Please try again.'
        );
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [isAuthenticated, isAdmin]);

  // Fetch financial summary for admins
  useEffect(() => {
    if (!isAdmin) return;

    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in.');
          setLoadingSummary(false);
          return;
        }

        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/payments/summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setSummary(response.data);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || 'Failed to fetch financial summary.'
        );
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [isAdmin]);

  // Handle Update Status Dialog
  const handleUpdateStatus = (payment) => {
    setSelectedPayment(payment);
    setOpenUpdateDialog(true);
  };

  const handleCloseUpdateDialog = () => {
    setSelectedPayment(null);
    setOpenUpdateDialog(false);
  };

  const handleStatusUpdate = async ({ status, reason }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in.');
        return;
      }

      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/payments/${selectedPayment.id}`,
        { status, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Payment ${status.toLowerCase()} successfully.`);
      setPayments((prevPayments) =>
        prevPayments.map((payment) =>
          payment.id === selectedPayment.id
            ? { ...payment, status, response_reason: reason }
            : payment
        )
      );

      if (isAdmin) {
        // Update summary if admin
        setLoadingSummary(true);
        const summaryResponse = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/payments/summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSummary(summaryResponse.data);
        setLoadingSummary(false);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to update payment status.'
      );
    } finally {
      handleCloseUpdateDialog();
    }
  };

  // Admin: Create Payment Form States
  const [createPaymentData, setCreatePaymentData] = useState({
    member_id: '',
    amount: '',
    payment_date: '',
  });
  const [createPaymentErrors, setCreatePaymentErrors] = useState({});
  const [creatingPayment, setCreatingPayment] = useState(false);

  const validateCreatePayment = () => {
    const errors = {};
    if (!createPaymentData.member_id.trim()) {
      errors.member_id = 'Member ID is required.';
    }
    if (
      !createPaymentData.amount ||
      isNaN(createPaymentData.amount) ||
      Number(createPaymentData.amount) <= 0
    ) {
      errors.amount = 'Valid amount is required.';
    }
    if (!createPaymentData.payment_date) {
      errors.payment_date = 'Payment date is required.';
    }
    setCreatePaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!validateCreatePayment()) {
      setError('Please correct the errors in the form.');
      return;
    }

    setCreatingPayment(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setCreatingPayment(false);
        return;
      }

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/payments`,
        {
          member_id: createPaymentData.member_id,
          amount: parseFloat(createPaymentData.amount),
          payment_date: createPaymentData.payment_date,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Payment created successfully.');
      setPayments((prevPayments) => [response.data, ...prevPayments]);
      setCreatePaymentData({ member_id: '', amount: '', payment_date: '' });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to create payment. Please try again.'
      );
    } finally {
      setCreatingPayment(false);
    }
  };

  // If the user is not authenticated, prompt them to log in
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: theme.spacing(20), textAlign: 'center' }}>
        <Paper elevation={3} sx={{ padding: theme.spacing(6), borderRadius: theme.shape.borderRadius }}>
          <Avatar sx={{ bgcolor: 'secondary.main', margin: '0 auto', mb: 2 }}>
            <PaymentIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            Access Restricted
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Please log in to view your payments.
          </Typography>
          <GradientButton variant="contained" onClick={() => navigate('/login')}>
            Login
          </GradientButton>
        </Paper>
      </Container>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{
          minHeight: '100vh',
          background: theme.palette.background.gradient, // Using the gradient from the theme
          paddingTop: theme.spacing(20), // Increased paddingTop for more spacing from navbar
          paddingBottom: theme.spacing(8),
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="lg">
          <MotionGrid
            container
            spacing={4}
            justifyContent={isAdmin ? 'flex-start' : 'center'}
            layout
          >
            {/* Admin: Create Payment Form */}
            {isAdmin && (
              <MotionGridItem
                item
                xs={12}
                md={6}
                layout
                transition={{ type: 'spring', stiffness: 60, damping: 25 }}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Paper
                  elevation={6}
                  sx={{
                    padding: theme.spacing(4),
                    borderRadius: theme.shape.borderRadius,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[4],
                    width: '100%',
                    maxWidth: '650px',
                  }}
                  layout
                  layoutId="createPaymentForm"
                >
                  <Stack spacing={2} alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <PaymentIcon />
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold">
                      Create Payment
                    </Typography>
                  </Stack>

                  <form onSubmit={handleCreatePaymentSubmit}>
                    <Stack spacing={3}>
                      <TextField
                        label="Member ID"
                        value={createPaymentData.member_id}
                        onChange={(e) =>
                          setCreatePaymentData({
                            ...createPaymentData,
                            member_id: e.target.value,
                          })
                        }
                        fullWidth
                        required
                        error={Boolean(createPaymentErrors.member_id)}
                        helperText={createPaymentErrors.member_id}
                        variant="outlined"
                      />
                      <TextField
                        label="Amount"
                        type="number"
                        value={createPaymentData.amount}
                        onChange={(e) =>
                          setCreatePaymentData({
                            ...createPaymentData,
                            amount: e.target.value,
                          })
                        }
                        fullWidth
                        required
                        error={Boolean(createPaymentErrors.amount)}
                        helperText={createPaymentErrors.amount}
                        variant="outlined"
                        inputProps={{ min: '0', step: '0.01' }}
                      />
                      <TextField
                        label="Payment Date"
                        type="date"
                        value={createPaymentData.payment_date}
                        onChange={(e) =>
                          setCreatePaymentData({
                            ...createPaymentData,
                            payment_date: e.target.value,
                          })
                        }
                        fullWidth
                        required
                        InputLabelProps={{
                          shrink: true,
                        }}
                        error={Boolean(createPaymentErrors.payment_date)}
                        helperText={createPaymentErrors.payment_date}
                        variant="outlined"
                      />
                      <Stack direction="row" spacing={2} justifyContent="center">
                        <GradientButton
                          variant="contained"
                          type="submit"
                          disabled={creatingPayment}
                        >
                          {creatingPayment ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            'Create'
                          )}
                        </GradientButton>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() =>
                            setCreatePaymentData({
                              member_id: '',
                              amount: '',
                              payment_date: '',
                            })
                          }
                          disabled={creatingPayment}
                          sx={{
                            borderRadius: theme.shape.borderRadius,
                            padding: theme.spacing(1.5, 3),
                            fontWeight: 600,
                            transition: 'background-color 0.3s, color 0.3s',
                            '&:hover': {
                              backgroundColor: theme.palette.error.main,
                              color: theme.palette.error.contrastText,
                            },
                          }}
                        >
                          Reset
                        </Button>
                      </Stack>
                    </Stack>
                  </form>
                </Paper>
              </MotionGridItem>
            )}

            {/* Payments List */}
            <MotionGridItem
              item
              xs={12}
              md={isAdmin ? 6 : 12}
              layout
              transition={{ type: 'spring', stiffness: 60, damping: 25 }}
            >
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                layout
              >
                <Typography variant="h5" gutterBottom>
                  {isAdmin ? 'All Payments' : 'My Payments'}
                </Typography>

                {loadingPayments ? (
                  <Grid container justifyContent="center" sx={{ mt: 3 }}>
                    <CircularProgress />
                  </Grid>
                ) : payments.length === 0 ? (
                  <Typography variant="body1" color="textSecondary">
                    {isAdmin
                      ? 'No payments found.'
                      : 'You have not made any payments yet.'}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      maxHeight: '600px',
                      overflowY: 'auto',
                      paddingRight: theme.spacing(1),
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: theme.palette.grey[200],
                        borderRadius: theme.shape.borderRadius,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: theme.palette.primary.main,
                        borderRadius: theme.shape.borderRadius,
                        border: `2px solid ${theme.palette.grey[200]}`,
                        transition: 'background 0.3s',
                      },
                      '&::-webkit-scrollbar-thumb:hover': {
                        background: theme.palette.primary.dark,
                      },
                      scrollbarWidth: 'thin',
                      scrollbarColor: `${theme.palette.primary.main} ${theme.palette.grey[200]}`,
                    }}
                  >
                    <Stack spacing={2}>
                      {payments.map((payment) => (
                        <PaymentCard
                          key={payment.id}
                          payment={payment}
                          isAdmin={isAdmin}
                          onUpdateStatus={handleUpdateStatus}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Financial Summary (Admin Only) */}
                {isAdmin && (
                  <>
                    {loadingSummary ? (
                      <Grid container justifyContent="center" sx={{ mt: 4 }}>
                        <CircularProgress />
                      </Grid>
                    ) : (
                      summary && <FinancialSummary summary={summary} />
                    )}
                  </>
                )}
              </motion.div>
            </MotionGridItem>
          </MotionGrid>

          {/* Update Status Dialog */}
          <AnimatePresence>
            {openUpdateDialog && selectedPayment && (
              <UpdateStatusDialog
                open={openUpdateDialog}
                handleClose={handleCloseUpdateDialog}
                payment={selectedPayment}
                handleStatusUpdate={handleStatusUpdate}
              />
            )}
          </AnimatePresence>

          {/* Success Snackbar */}
          <Snackbar
            open={Boolean(success)}
            autoHideDuration={6000}
            onClose={() => setSuccess('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            TransitionComponent={motion.div}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Alert
              onClose={() => setSuccess('')}
              severity="success"
              sx={{ width: '100%' }}
            >
              {success}
            </Alert>
          </Snackbar>

          {/* Error Snackbar */}
          <Snackbar
            open={Boolean(error)}
            autoHideDuration={6000}
            onClose={() => setError('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            TransitionComponent={motion.div}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Alert
              onClose={() => setError('')}
              severity="error"
              sx={{ width: '100%' }}
            >
              {error}
            </Alert>
          </Snackbar>
        </Container>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentsPage;
