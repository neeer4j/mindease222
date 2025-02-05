// src/pages/ComplaintsPage.jsx

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
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { styled } from '@mui/system';
import {
  ReportProblem as ComplaintIcon,
  ErrorOutline as StatusIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Motion-enhanced Grid component
const MotionGrid = motion(Grid);

// Styled Gradient Button with Enhanced Styles using theme variables
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

// Complaint categories
const categories = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'noise', label: 'Noise' },
  { value: 'safety', label: 'Safety' },
  { value: 'billing', label: 'Billing' },
];

// Status color mapping for better visualization using theme palette
const statusColorMapping = {
  Pending: 'warning',
  Resolved: 'success',
  Rejected: 'error',
};

// Animation variants for the page
const pageVariants = {
  initial: {
    opacity: 0,
    y: 50,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
  out: {
    opacity: 0,
    y: -50,
    transition: {
      duration: 0.4,
      ease: 'easeIn',
    },
  },
};

// Animation variants for individual complaint cards
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  }),
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

// Sub-component for Complaint Card
const ComplaintCard = ({ complaint, onViewDetails, onDelete, index }) => {
  const theme = useTheme();

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Card
        variant="outlined"
        sx={{
          borderLeft: `6px solid ${theme.palette[statusColorMapping[complaint.status]]?.main || theme.palette.grey[500]}`,
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
              <ComplaintIcon />
            </Avatar>
          }
          action={
            <Box>
              <Tooltip title="View Details">
                <IconButton onClick={() => onViewDetails(complaint)}>
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Complaint">
                <IconButton color="error" onClick={() => onDelete(complaint.id)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
          title={
            <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
              {complaint.subject || 'No Subject'}
            </Typography>
          }
          subheader={
            <Chip
              label={complaint.category || 'Uncategorized'}
              color="primary"
              size="small"
              variant="outlined"
            />
          }
        />
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <StatusIcon fontSize="small" color="action" />
            <Chip
              label={complaint.status}
              color={statusColorMapping[complaint.status] || 'default'}
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {complaint.description.length > 100
              ? `${complaint.description.substring(0, 100)}...`
              : complaint.description || 'No Description Provided.'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Submitted on:{' '}
            {complaint.created_at
              ? new Date(complaint.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Invalid date'}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ComplaintsPage = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const theme = useTheme();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);

  // Fetch user's complaints from backend
  useEffect(() => {
    const fetchComplaints = async () => {
      setLoadingComplaints(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoadingComplaints(false);
          return;
        }

        const response = await axios.get('http://localhost:5000/api/complaints/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComplaints(response.data);
      } catch (error) {
        console.error('Error fetching complaints:', error);
        setError(error.response?.data?.message || 'Failed to load complaints.');
      } finally {
        setLoadingComplaints(false);
      }
    };

    if (isAuthenticated) {
      fetchComplaints();
    }
  }, [isAuthenticated]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!subject.trim()) newErrors.subject = 'Complaint subject is required.';
    if (!description.trim()) newErrors.description = 'Complaint description is required.';
    if (!category) newErrors.category = 'Please select a category.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Please correct the errors in the form.');
      return;
    }
    setError('');
    setOpenConfirm(true);
  };

  // Confirm complaint submission
  const confirmComplaint = async () => {
    setOpenConfirm(false);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:5000/api/complaints',
        { description, category, subject },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        setSuccess(true);
        handleReset();
        setComplaints((prevComplaints) => [response.data, ...prevComplaints]);
      } else {
        setError(response.data.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
      setError(err.response?.data?.message || 'Failed to lodge complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields
  const handleReset = () => {
    setDescription('');
    setSubject('');
    setCategory('');
    setErrors({});
    setError('');
  };

  // Handle viewing complaint details
  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setOpenDetail(true);
  };

  // Close details modal
  const handleCloseDetail = () => {
    setSelectedComplaint(null);
    setOpenDetail(false);
  };

  // Delete complaint handler with custom confirmation
  const handleDeleteComplaint = (complaintId) => {
    setSelectedComplaint(complaintId);
    setOpenDeleteConfirm(true);
  };

  const confirmDeleteComplaint = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setOpenDeleteConfirm(false);
        return;
      }

      const response = await axios.delete(`http://localhost:5000/api/complaints/${selectedComplaint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        setComplaints((prevComplaints) =>
          prevComplaints.filter((complaint) => complaint.id !== selectedComplaint)
        );
        setDeleteSuccess('Complaint deleted successfully');
      } else {
        setError('Failed to delete complaint. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting complaint:', err);
      setError('Failed to delete complaint. Please try again.');
    } finally {
      setOpenDeleteConfirm(false);
    }
  };

  // Animations and layout logic
  const complaintListVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 80, damping: 20 },
    },
  };

  // If the user is not authenticated, prompt them to log in
  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: theme.spacing(10), textAlign: 'center' }}>
        <Paper elevation={3} sx={{ padding: theme.spacing(6), borderRadius: theme.shape.borderRadius }}>
          <Avatar sx={{ bgcolor: theme.palette.secondary.main, margin: '0 auto', mb: theme.spacing(2) }}>
            <ComplaintIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            Access Restricted
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Please log in to lodge a complaint.
          </Typography>
          <GradientButton variant="contained" onClick={() => navigate('/login')}>
            Login
          </GradientButton>
        </Paper>
      </Container>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        background: theme.palette.background.gradient,
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="lg">
        <MotionGrid
          container
          spacing={4}
          justifyContent={complaints.length > 0 ? 'flex-start' : 'center'}
          layout
        >
          {/* Complaint Form */}
          <Grid
            item
            xs={12}
            md={5} // Adjusted for better spacing
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Paper
              elevation={6}
              sx={{
                padding: theme.spacing(3),
                borderRadius: theme.shape.borderRadius,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[4],
                width: '100%',
                maxWidth: '650px', // Increased maxWidth for a bigger form
              }}
            >
              <Stack spacing={2} alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                  <ComplaintIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  Lodge a Complaint
                </Typography>
              </Stack>

              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    fullWidth
                    required
                    error={Boolean(errors.subject)}
                    helperText={errors.subject}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: theme.shape.borderRadius },
                    }}
                  />
                  <TextField
                    label="Complaint Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={5}
                    required
                    error={Boolean(errors.description)}
                    helperText={errors.description}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: theme.shape.borderRadius },
                    }}
                  />
                  <TextField
                    select
                    label="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    fullWidth
                    required
                    error={Boolean(errors.category)}
                    helperText={errors.category}
                    variant="outlined"
                    InputProps={{
                      sx: { borderRadius: theme.shape.borderRadius },
                    }}
                  >
                    {categories.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <GradientButton variant="contained" type="submit" disabled={loading}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                    </GradientButton>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleReset}
                      disabled={loading}
                      sx={{
                        borderColor: theme.palette.error.main,
                        color: theme.palette.error.main,
                        borderRadius: theme.shape.borderRadius,
                        padding: theme.spacing(1.25, 2.5),
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
          </Grid>

          {/* Complaints List */}
          <AnimatePresence>
            {complaints.length > 0 && (
              <Grid item xs={12} md={6}>
                <motion.div
                  variants={complaintListVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <Typography variant="h5" gutterBottom color="text.primary">
                    Your Complaints
                  </Typography>

                  {loadingComplaints ? (
                    <Grid container justifyContent="center" sx={{ mt: 3 }}>
                      <CircularProgress />
                    </Grid>
                  ) : (
                    <Box
                      sx={{
                        maxHeight: '500px',
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
                        {complaints.map((complaint, index) => (
                          <ComplaintCard
                            key={complaint.id}
                            complaint={complaint}
                            onViewDetails={handleViewDetails}
                            onDelete={handleDeleteComplaint}
                            index={index}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </motion.div>
              </Grid>
            )}
          </AnimatePresence>
        </MotionGrid>

        {/* Complaint Details Modal */}
        <AnimatePresence>
          {selectedComplaint && openDetail && (
            <Dialog
              open={openDetail}
              onClose={handleCloseDetail}
              aria-labelledby="complaint-details-title"
              fullWidth
              maxWidth="sm"
              TransitionComponent={motion.div}
              transition={{ duration: 0.3 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <DialogTitle id="complaint-details-title">Complaint Details</DialogTitle>
              <DialogContent dividers>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" color="text.primary">
                    <strong>Subject:</strong> {selectedComplaint.subject || 'No Subject'}
                  </Typography>
                  <Typography variant="subtitle1" color="text.primary">
                    <strong>Category:</strong> {selectedComplaint.category || 'Uncategorized'}
                  </Typography>
                  <Typography variant="subtitle1" color="text.primary">
                    <strong>Description:</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedComplaint.description || 'No Description Provided.'}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={2}>
                    <StatusIcon fontSize="small" color="action" />
                    <Chip
                      label={selectedComplaint.status}
                      color={statusColorMapping[selectedComplaint.status] || 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Submitted on:{' '}
                    {selectedComplaint.created_at
                      ? new Date(selectedComplaint.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Invalid date'}
                  </Typography>
                  {selectedComplaint.reason && (
                    <Typography variant="subtitle1" color="text.primary">
                      <strong>Reason:</strong> {selectedComplaint.reason}
                    </Typography>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDetail} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Success Snackbar */}
        <Snackbar
          open={success}
          autoHideDuration={6000}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionComponent={motion.div}
          transition={{ duration: 0.5 }}
        >
          <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
            Complaint lodged successfully!
          </Alert>
        </Snackbar>

        {/* Delete Success Snackbar */}
        <Snackbar
          open={Boolean(deleteSuccess)}
          autoHideDuration={6000}
          onClose={() => setDeleteSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionComponent={motion.div}
          transition={{ duration: 0.5 }}
        >
          <Alert onClose={() => setDeleteSuccess(false)} severity="success" sx={{ width: '100%' }}>
            {deleteSuccess}
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          TransitionComponent={motion.div}
          transition={{ duration: 0.5 }}
        >
          <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        {/* Confirmation Dialog */}
        <AnimatePresence>
          {openConfirm && (
            <Dialog
              open={openConfirm}
              onClose={() => setOpenConfirm(false)}
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-description"
              TransitionComponent={motion.div}
              transition={{ duration: 0.3 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <DialogTitle id="confirm-dialog-title">Confirm Complaint</DialogTitle>
              <DialogContent>
                <Typography>Are you sure you want to lodge the following complaint?</Typography>
                <Box mt={2}>
                  <Typography variant="body2" color="text.primary">
                    <strong>Subject:</strong> {subject}
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    <strong>Category:</strong> {category}
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    <strong>Description:</strong> {description}
                  </Typography>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenConfirm(false)} color="error" startIcon={<CancelIcon />}>
                  Cancel
                </Button>
                <GradientButton onClick={confirmComplaint} variant="contained" startIcon={<SaveIcon />}>
                  Confirm
                </GradientButton>
              </DialogActions>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AnimatePresence>
          {openDeleteConfirm && (
            <Dialog
              open={openDeleteConfirm}
              onClose={() => setOpenDeleteConfirm(false)}
              aria-labelledby="delete-dialog-title"
              aria-describedby="delete-dialog-description"
              TransitionComponent={motion.div}
              transition={{ duration: 0.3 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
              <DialogContent>
                <Typography>Are you sure you want to delete this complaint?</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDeleteConfirm(false)} color="primary" startIcon={<CancelIcon />}>
                  Cancel
                </Button>
                <Button onClick={confirmDeleteComplaint} color="error" startIcon={<DeleteIcon />}>
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </AnimatePresence>
      </Container>
    </motion.div>
  );
};

export default ComplaintsPage;
