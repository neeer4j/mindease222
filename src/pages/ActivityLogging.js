// src/pages/ActivityLogging.jsx

import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Button,
  TextField,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Chip,
  Card,
  CardContent,
  Divider,
  alpha, // Added alpha utility
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  GetApp as GetAppIcon,
  Refresh as RefreshIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon, // Example Icon for Empty State
  Category as CategoryIcon, // Icon for Category filter
  CalendarMonth as CalendarMonthIcon, // Icons for Date filters
  AccessTime as AccessTimeIcon, // Icon for time in list item
  TextFields as TextFieldsIcon, // Icon for search input
  DateRange as DateRangeIcon,
  KeyboardReturn as KeyboardReturnIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/system';
import { ActivityContext } from '../contexts/ActivityContext';
import { saveAs } from 'file-saver';
import Autocomplete from '@mui/material/Autocomplete';
import { format } from 'date-fns'; // Date formatting library
import PageLayout from '../components/PageLayout'; // Import PageLayout
import ActivityLoggingSplash from '../components/ActivityLoggingSplash';
import SplashScreenToggle from '../components/SplashScreenToggle';

// Quick Action FAB with speed dial
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import PostAddIcon from '@mui/icons-material/PostAdd';
import TimerIcon from '@mui/icons-material/Timer';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';

// **1. GradientButton - Styled Component (unchanged)**
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: '8px',
  padding: '8px 16px',
  boxShadow: theme.shadows[4],
  transition: 'background 0.5s, box-shadow 0.3s',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
    boxShadow: theme.shadows[6],
    transform: 'translateY(-2px)', // Added slight movement on hover
  },
}));

// **2. Motion Variants (unchanged)**
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Reduced stagger for a slightly faster animation
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 20 }, // Slight vertical movement
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 22, // Slightly higher damping for a snappier animation
    },
  },
  hover: {
    scale: 1.01, // Reduced scale on hover for subtlety
    boxShadow: '0px 6px 20px rgba(0,0,0,0.15)', // More pronounced but subtle shadow
    transition: { duration: 0.2 }, // Faster hover transition
  },
};

const formVariants = {
  hidden: { opacity: 0, scale: 0.97 }, // Slight scale down when hidden
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280, // Slightly softer spring
      damping: 24, // Adjusted damping
    },
  },
};

// Enhanced animations for better visual feedback
const cardAnimation = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { type: "spring", stiffness: 300, damping: 25 }
};

const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.4 }
};

// **3. ConfirmationDialog (unchanged)**
const ConfirmationDialog = ({ open, title, content, onConfirm, onCancel }) => (
  <Dialog
    open={open}
    onClose={onCancel}
    aria-labelledby="confirmation-dialog-title"
    aria-describedby="confirmation-dialog-description"
  >
    <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
    <DialogContent>
      <Typography id="confirmation-dialog-description">{content}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} color="secondary" variant="outlined">
        Cancel
      </Button>
      <GradientButton onClick={onConfirm} variant="contained">
        Confirm
      </GradientButton>
    </DialogActions>
  </Dialog>
);

// Quick category selection component
const QuickCategorySelect = ({ onSelect, selectedCategory }) => {
  const commonCategories = ['Work', 'Health', 'Leisure', 'Education', 'Personal'];
  
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
      {commonCategories.map((cat) => (
        <Chip
          key={cat}
          label={cat}
          clickable
          color={selectedCategory === cat ? "primary" : "default"}
          onClick={() => onSelect(cat)}
          sx={{
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2
            }
          }}
        />
      ))}
    </Box>
  );
};

// Loading skeleton for activities
const ActivitySkeleton = () => (
  <Box sx={{ mb: 2 }}>
    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
    <Box sx={{ pt: 1 }}>
      <Skeleton width="60%" />
      <Skeleton width="40%" />
    </Box>
  </Box>
);

const DialogHeader = styled(DialogTitle)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  '& .MuiSvgIcon-root': {
    fontSize: '2rem'
  }
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(4),
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.8)}, ${theme.palette.background.paper})`
    : `linear-gradient(to bottom, ${alpha(theme.palette.primary.light, 0.05)}, ${alpha(theme.palette.background.paper, 0.8)})`,
  position: 'relative',
  overflow: 'visible',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.08)}, transparent 70%)`,
    pointerEvents: 'none'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    transition: 'all 0.3s ease',
    background: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(8px)',
    '&:hover': {
      background: alpha(theme.palette.background.paper, 0.8),
    },
    '&.Mui-focused': {
      background: alpha(theme.palette.background.paper, 0.9),
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
    }
  }
}));

const ActivityLogging = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    activities,
    addActivity,
    editActivity,
    deleteActivity,
    loading,
    error,
    success,
    fetchActivities,
  } = useContext(ActivityContext);

  const [open, setOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortOption, setSortOption] = useState('date_desc');
  const [filterCategory, setFilterCategory] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 8; // Reduced items per page for better mobile view

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    activityId: null,
    title: '',
    content: '',
  });

  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenTutorial = localStorage.getItem('activityLoggingTutorialSeen');
    return !hasSeenTutorial;
  });

  const handleTutorialComplete = () => {
    localStorage.setItem('activityLoggingTutorialSeen', 'true');
    setShowSplash(false);
  };

  const handleShowSplash = () => {
    setShowSplash(true);
  };

  // **9. Effect to Handle Error and Success Messages (unchanged)**
  useEffect(() => {
    if (error) {
      setSnackbarSeverity('error');
      setSnackbarMessage(error);
      setOpenSnackbar(true);
    } else if (success) {
      setSnackbarSeverity('success');
      setSnackbarMessage(success);
      setOpenSnackbar(true);
    }
  }, [error, success]);

  // **Fetch Activities on Mount and on Refresh Click
  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch on component mount

  // **10. handleOpen, handleClose, handleDeleteActivity, confirmDelete, cancelDelete, handleSnackbarClose (unchanged)**
  const handleOpen = (activity = null) => {
    setCurrentActivity(activity);
    setOpen(true);
  };

  const handleClose = () => {
    setCurrentActivity(null);
    setOpen(false);
  };

  const handleDeleteActivity = (id, title) => {
    setConfirmDialog({
      open: true,
      activityId: id,
      title: title,
      content: `Are you sure you want to delete the activity "${title}"? This action cannot be undone.`,
    });
  };

  const confirmDelete = () => {
    deleteActivity(confirmDialog.activityId);
    setConfirmDialog({
      open: false,
      activityId: null,
      title: '',
      content: '',
    });
  };

  const cancelDelete = () => {
    setConfirmDialog({
      open: false,
      activityId: null,
      title: '',
      content: '',
    });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  // **14. Handle Search and Filter (unchanged)**
  const filteredActivities = activities
    .filter(activity =>
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(activity => {
      const activityDate = new Date(activity.date);
      const fromDate = filterDateFrom ? new Date(filterDateFrom) : null;
      const toDate = filterDateTo ? new Date(filterDateTo) : null;
      if (fromDate && activityDate < fromDate) return false;
      if (toDate && activityDate > toDate) return false;
      return true;
    })
    .filter(activity => {
      if (filterCategory && activity.category !== filterCategory) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'date_asc':
          return new Date(a.date) - new Date(b.date);
        case 'date_desc':
          return new Date(b.date) - new Date(a.date);
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

  // **15. Pagination Logic (unchanged but adjusted for new items per page)**
  const indexOfLastActivity = currentPage * activitiesPerPage;
  const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
  const currentActivities = filteredActivities.slice(indexOfFirstActivity, indexOfLastActivity);
  const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
  };

  // **16. Handle Exporting Activities as CSV (unchanged)**
  const exportToCSV = () => {
    const headers = ['Title', 'Description', 'Date', 'Category'];
    const rows = filteredActivities.map(activity => [
      `"${activity.title.replace(/"/g, '""')}"`,
      `"${activity.description.replace(/"/g, '""')}"`,
      format(new Date(activity.date), 'yyyy-MM-dd HH:mm:ss'), // Using date-fns for better formatting
      `"${activity.category ? activity.category.replace(/"/g, '""') : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'activities.csv');
  };

  // **17. Extract Unique Categories (unchanged)**
  const uniqueCategories = [...new Set(activities.map(activity => activity.category).filter(Boolean))];

  // Quick action state
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  // Quick activity logging
  const handleQuickLog = (type) => {
    const now = new Date().toISOString();
    handleOpen({
      title: '',
      description: '',
      date: now,
      category: type
    });
    setQuickActionOpen(false);
  };

  return (
    <PageLayout>
      {showSplash && <ActivityLoggingSplash onComplete={handleTutorialComplete} />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          minHeight: '100vh',
          background: theme.palette.background.gradient,
          paddingTop: theme.spacing(8),
          paddingBottom: theme.spacing(8),
          position: 'relative'
        }}
      >
        <Container maxWidth="md">
          {/* **Page Header with Animated Text (minor font size adjustment)** */}
          <Box textAlign="center" mb={6}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Typography
                  variant={isMobile ? 'h3' : 'h2'}
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.text.primary,
                    position: 'relative',
                    zIndex: 1,
                    textShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Activity Logging
                </Typography>
                <Typography 
                  variant={isMobile ? 'h3' : 'h2'}
                  sx={{ color: 'text.primary' }}
                >
                  
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.secondary,
                  maxWidth: 600,
                  margin: '0 auto',
                  position: 'relative',
                  zIndex: 1,
                  fontWeight: 400,
                  px: 2,
                }}
              >
                Record and review your daily activities to understand your time and improve your productivity.
              </Typography>
            </motion.div>
          </Box>

          {/* **Search, Filter, and Export Controls - Improved Icons and Spacing** */}
          <Box mb={4}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Search Activities"
                  variant="outlined"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TextFieldsIcon />
                      </InputAdornment>
                    ),
                  }}
                  disabled={loading}
                  aria-label="Search Activities"
                  size="small" // Add size prop for compact inputs
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="From Date" // More descriptive label
                  type="date"
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon />
                      </InputAdornment>
                    ),
                  }}
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  disabled={loading}
                  aria-label="Filter From Date"
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="To Date" // More descriptive label
                  type="date"
                  variant="outlined"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon />
                      </InputAdornment>
                    ),
                  }}
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  disabled={loading}
                  aria-label="Filter To Date"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={2} textAlign="right">
                <Tooltip title="Export as CSV">
                  <IconButton onClick={exportToCSV} color="primary" aria-label="Export Activities as CSV">
                    <GetAppIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh Activities">
                  <IconButton onClick={fetchActivities} color="primary" disabled={loading} aria-label="Refresh Activities">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center" mt={1}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="sort-label">
                    <SortIcon sx={{ mr: 1 }} /> Sort By
                  </InputLabel>
                  <Select
                    labelId="sort-label"
                    label={<><SortIcon sx={{ mr: 1 }} /> Sort By</>}
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    disabled={loading}
                    aria-label="Sort Activities"
                  >
                    <MenuItem value="date_desc">Date: Newest First</MenuItem>
                    <MenuItem value="date_asc">Date: Oldest First</MenuItem>
                    <MenuItem value="title_asc">Title: A-Z</MenuItem>
                    <MenuItem value="title_desc">Title: Z-A</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="category-filter-label">
                    <CategoryIcon sx={{ mr: 1 }} /> Category
                  </InputLabel>
                  <Select
                    labelId="category-filter-label"
                    label={<><CategoryIcon sx={{ mr: 1 }} /> Category</>}
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    disabled={loading}
                    aria-label="Filter by Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {uniqueCategories.map((category, index) => (
                      <MenuItem key={index} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Quick Category Filter */}
          <motion.div {...fadeInUp}>
            <QuickCategorySelect
              onSelect={(category) => setFilterCategory(category)}
              selectedCategory={filterCategory}
            />
          </motion.div>

          {/* **Add Activity Button - Centered on Mobile** */}
          <Box display="flex" justifyContent={isMobile ? 'center' : 'space-between'} mb={4}>
            <Tooltip title="Add New Activity">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <GradientButton
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpen()}
                  disabled={loading}
                  aria-label="Add Activity"
                >
                  Add Activity
                  {loading && (
                    <CircularProgress size={24} color="inherit" sx={{ marginLeft: 2 }} />
                  )}
                </GradientButton>
              </motion.div>
            </Tooltip>
          </Box>

          {/* **Activities List with Animated Cards - Using Cards for Visual Appeal** */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {loading ? (
              // Show loading skeletons
              [...Array(3)].map((_, index) => (
                <motion.div key={index} {...cardAnimation}>
                  <ActivitySkeleton />
                </motion.div>
              ))
            ) : currentActivities.length > 0 ? (
              <List>
                {currentActivities.map(activity => (
                  <motion.div
                    key={activity.id}
                    {...cardAnimation}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      elevation={3} // Added elevation for card effect
                      sx={{
                        marginBottom: theme.spacing(2),
                        borderRadius: 2, // Rounded corners for cards
                      }}
                    >
                      <CardContent>
                        <ListItem
                          secondaryAction={
                            <ListItemSecondaryAction> {/* Use ListItemSecondaryAction for alignment */}
                              <Tooltip title="Edit Activity">
                                <IconButton
                                  edge="end"
                                  onClick={() => handleOpen(activity)}
                                  aria-label="edit"
                                  disabled={loading}
                                >
                                  <EditIcon color="primary" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Activity">
                                <IconButton
                                  edge="end"
                                  onClick={() => handleDeleteActivity(activity.id, activity.title)}
                                  aria-label="delete"
                                  disabled={loading}
                                >
                                  <DeleteIcon color="error" />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          }
                          disableGutters // Remove ListItem gutters for cleaner card integration
                        >
                          <Avatar sx={{ bgcolor: theme.palette.primary.main, marginRight: theme.spacing(2) }}>
                            <EventIcon />
                          </Avatar>
                          <ListItemText
                            primary={
                              <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: theme.palette.text.primary }}> {/* Changed to component="div" for better structure */}
                                {activity.title}
                              </Typography>
                            }
                            secondary={
                              <Box component="div"> {/* Using Box for better layout control within secondary */}
                                <Typography variant="body2" color="textSecondary" component="div">
                                  {activity.description}
                                </Typography>
                                <Box mt={1} display="flex" alignItems="center" component="div">
                                  <AccessTimeIcon sx={{ mr: 0.5, fontSize: '1rem', color: theme.palette.text.secondary }} /> {/* Time icon */}
                                  <Typography variant="caption" color="textSecondary" component="span"> {/* Changed to component="span" for inline layout */}
                                    {format(new Date(activity.date), 'MMM d, yyyy h:mm a')} {/* Nicer date format using date-fns */}
                                  </Typography>
                                  {activity.category && (
                                    <Chip
                                      label={activity.category}
                                      size="small"
                                      sx={{ marginLeft: 1 }}
                                      color="primary"
                                      icon={<CategoryIcon />} // Category chip icon
                                      aria-label={`Category: ${activity.category}`}
                                    />
                                  )}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </List>
            ) : (
              // **Improved Empty State**
              <Box textAlign="center" py={6} color="text.secondary">
                <AssignmentTurnedInIcon sx={{ fontSize: 80, opacity: 0.6, display: 'block', margin: '0 auto 16px' }} />
                <Typography variant="h6" gutterBottom>
                  No activities logged yet.
                </Typography>
                <Typography variant="body2">
                  Click the "Add Activity" button to start tracking your activities.
                </Typography>
              </Box>
            )}
          </motion.div>

          {/* **Pagination Controls (unchanged)** */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4} mb={6}> {/* Added mb for bottom spacing */}
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                aria-label="Activity Pagination"
                variant="outlined" // Added outlined variant for a cleaner look
                shape="rounded" // Rounded pagination
              />
            </Box>
          )}

          {/* **Add/Edit Activity Dialog (unchanged)** */}
          <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            aria-labelledby="activity-dialog-title"
            PaperProps={{
              elevation: 24,
              sx: {
                borderRadius: 2,
                overflow: 'hidden',
                background: 'transparent'
              }
            }}
          >
            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
            >
              <DialogHeader id="activity-dialog-title">
                <motion.div
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  {currentActivity ? <EditIcon /> : <AddIcon />}
                </motion.div>
                <Typography variant="h6" component="span">
                  {currentActivity ? 'Edit Activity' : 'Add New Activity'}
                </Typography>
              </DialogHeader>
              <StyledDialogContent dividers>
                <ActivityForm
                  activity={currentActivity}
                  onSubmit={currentActivity ? editActivity : addActivity}
                  onCancel={handleClose}
                  loading={loading}
                  setSnackbar={(severity, message) => {
                    setSnackbarSeverity(severity);
                    setSnackbarMessage(message);
                    setOpenSnackbar(true);
                  }}
                />
              </StyledDialogContent>
            </motion.div>
          </Dialog>

          {/* **Confirmation Dialog for Deletion (unchanged)** */}
          <ConfirmationDialog
            open={confirmDialog.open}
            title="Delete Activity"
            content={confirmDialog.content}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />

          {/* **Snackbar for Error and Success Messages (unchanged)** */}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarSeverity}
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>

          {/* Quick Action Speed Dial - Modified for consistent behavior */}
          <SpeedDial
            ariaLabel="Quick Activity Actions"
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              left: 16,
              display: { xs: 'none', md: 'flex' } // Hide on mobile/tablet (xs,sm), show on md and up
            }}
            icon={<SpeedDialIcon />}
            open={quickActionOpen}
            onOpen={() => setQuickActionOpen(true)}
            onClose={() => setQuickActionOpen(false)}
          >
            <SpeedDialAction
              icon={<PostAddIcon />}
              tooltipTitle="New Activity"
              onClick={() => {
                handleOpen();
                setQuickActionOpen(false);
              }}
            />
          </SpeedDial>
        </Container>
      </motion.div>
      <SplashScreenToggle onShowSplash={handleShowSplash} />
    </PageLayout>
  );
};

// **18. Activity Form Component (minor visual adjustments, InputAdornment for category)**
const ActivityForm = ({ activity, onSubmit, onCancel, loading, setSnackbar }) => {
  const theme = useTheme();
  const [title, setTitle] = useState(activity ? activity.title : '');
  const [description, setDescription] = useState(activity ? activity.description : '');
  const [date, setDate] = useState(activity ? activity.date : new Date().toISOString().slice(0, 16));
  const [category, setCategory] = useState(activity ? activity.category : '');
  const [errors, setErrors] = useState({});
  const [showTips, setShowTips] = useState(false);

  const MAX_TITLE_LENGTH = 100;
  const MAX_DESCRIPTION_LENGTH = 500;
  const MIN_DESCRIPTION_LENGTH = 10;

  const predefinedCategories = [
    'Work', 'Health', 'Leisure', 'Education', 'Personal',
    'Exercise', 'Meditation', 'Study', 'Reading', 'Family Time',
    'Hobbies', 'Self-Care', 'Social', 'Entertainment', 'Productivity'
  ];

  const activityTips = [
    "Be specific with your activity title",
    "Add details in description to help you remember later",
    "Categorizing helps in better activity analysis",
    "Regular logging helps build better habits",
    "You can use categories to track different areas of your life"
  ];

  const validate = useCallback(() => {
    let tempErrors = {};
    // Title validation
    if (!title.trim()) {
      tempErrors.title = 'Title is required.';
    } else if (title.length > MAX_TITLE_LENGTH) {
      tempErrors.title = `Title must be less than ${MAX_TITLE_LENGTH} characters.`;
    }

    // Description validation
    if (description && description.length < MIN_DESCRIPTION_LENGTH) {
      tempErrors.description = `Description should be at least ${MIN_DESCRIPTION_LENGTH} characters.`;
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      tempErrors.description = `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters.`;
    }

    // Date validation
    if (!date) {
      tempErrors.date = 'Date & Time is required.';
    } else {
      const selectedDate = new Date(date);
      const now = new Date();
      if (selectedDate > now) {
        tempErrors.date = 'Cannot log activities in the future.';
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  }, [title, description, date]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const handleSubmit = useCallback(() => {
    if (!validate()) {
      setSnackbar('error', 'Please fix the errors in the form.');
      return;
    }

    const newActivity = {
      id: activity ? activity.id : undefined,
      title: title.trim(),
      description: description.trim(),
      date: new Date(date).toISOString(),
      category: category || 'Uncategorized',
    };

    onSubmit(newActivity);
    onCancel();
  }, [activity, title, description, date, category, onSubmit, onCancel, validate, setSnackbar]);

  return (
    <Box 
      component="form" 
      noValidate 
      autoComplete="off" 
      onKeyDown={handleKeyPress}
      sx={{ position: 'relative' }}
    >
      <motion.div {...fadeInUp}>
        <Grid container spacing={3}>
          {/* Tips Section */}
          <Grid item xs={12}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                alignItems: 'center',
                mb: 1 
              }}
            >
              <Tooltip title={showTips ? "Hide Tips" : "Show Tips"}>
                <IconButton 
                  size="small" 
                  onClick={() => setShowTips(!showTips)}
                  color={showTips ? "primary" : "default"}
                >
                  <TipsAndUpdatesIcon />
                </IconButton>
              </Tooltip>
            </Box>
            {showTips && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Quick Tips:
                    </Typography>
                    <List dense>
                      {activityTips.map((tip, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={tip}
                            primaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      Pro tip: Press Ctrl + Enter to submit quickly!
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </Grid>

          {/* Quick Category Selection */}
          <Grid item xs={12}>
            <QuickCategorySelect
              onSelect={setCategory}
              selectedCategory={category}
            />
          </Grid>

          {/* Enhanced Title Field */}
          <Grid item xs={12}>
            <StyledTextField
              required
              label="Activity Title"
              variant="outlined"
              fullWidth
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors({ ...errors, title: '' });
                }
              }}
              disabled={loading}
              error={!!errors.title}
              helperText={
                errors.title || 
                `${title.length}/${MAX_TITLE_LENGTH} characters`
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventIcon color={errors.title ? "error" : "primary"} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.2s ease',
                  '&.Mui-focused': {
                    transform: 'scale(1.02)',
                  }
                }
              }}
            />
            <LinearProgress 
              variant="determinate" 
              value={(title.length / MAX_TITLE_LENGTH) * 100}
              sx={{ 
                height: 2, 
                mt: 0.5,
                borderRadius: 1,
                bgcolor: 'background.paper',
                '& .MuiLinearProgress-bar': {
                  bgcolor: title.length > MAX_TITLE_LENGTH ? 'error.main' : 'primary.main'
                }
              }}
            />
          </Grid>

          {/* Enhanced Description Field */}
          <Grid item xs={12}>
            <StyledTextField
              label="Description"
              variant="outlined"
              fullWidth
              multiline
              minRows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors({ ...errors, description: '' });
                }
              }}
              disabled={loading}
              error={!!errors.description}
              helperText={
                errors.description || 
                `${description.length}/${MAX_DESCRIPTION_LENGTH} characters (min: ${MIN_DESCRIPTION_LENGTH})`
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  transition: 'all 0.2s ease',
                }
              }}
            />
            <LinearProgress 
              variant="determinate" 
              value={(description.length / MAX_DESCRIPTION_LENGTH) * 100}
              sx={{ 
                height: 2, 
                mt: 0.5,
                borderRadius: 1,
                bgcolor: 'background.paper',
                '& .MuiLinearProgress-bar': {
                  bgcolor: description.length > MAX_DESCRIPTION_LENGTH ? 'error.main' : 'primary.main'
                }
              }}
            />
          </Grid>

          {/* Enhanced Date/Time Field */}
          <Grid item xs={12}>
            <StyledTextField
              required
              label="Date & Time"
              type="datetime-local"
              variant="outlined"
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) {
                  setErrors({ ...errors, date: '' });
                }
              }}
              disabled={loading}
              error={!!errors.date}
              helperText={errors.date}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DateRangeIcon color={errors.date ? "error" : "primary"} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Enhanced Category Selection */}
          <Grid item xs={12}>
            <Autocomplete
              freeSolo
              options={predefinedCategories}
              value={category}
              onChange={(event, newValue) => {
                setCategory(newValue);
              }}
              onInputChange={(event, newInputValue) => {
                setCategory(newInputValue);
              }}
              disabled={loading}
              renderInput={(params) => (
                <StyledTextField
                  {...params}
                  label="Category"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <CategoryIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box component="li" {...props} sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: (theme) => alpha(theme.palette.primary.main, 0.08),
                    }
                  }}>
                    <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                    {option}
                  </Box>
                </motion.div>
              )}
            />
          </Grid>

          {/* Enhanced Action Buttons */}
          <Grid item xs={12}>
            <Box 
              display="flex" 
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onCancel}
                  color="secondary"
                  variant="outlined"
                  disabled={loading}
                  startIcon={<DeleteIcon />}
                  sx={{
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    }
                  }}
                >
                  Cancel
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Tooltip title="Press Ctrl + Enter">
                  <span>
                    <GradientButton
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading}
                      endIcon={loading ? 
                        <CircularProgress size={20} /> : 
                        <KeyboardReturnIcon />
                      }
                    >
                      {loading ? 'Saving...' : activity ? 'Save Changes' : 'Add Activity'}
                    </GradientButton>
                  </span>
                </Tooltip>
              </motion.div>
            </Box>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default ActivityLogging;
