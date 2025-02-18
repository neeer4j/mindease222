import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  styled,
  useTheme,
  Tab,
  alpha
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { 
  Search as SearchIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Group as GroupIcon,
  Flag as FlagIcon,
  Assessment as AssessmentIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Timeline as TimelineIcon,
  Report as ReportIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  doc, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import useAdminDashboardUpdates from '../hooks/useAdminDashboardUpdates';
import useReportManagement from '../hooks/useReportManagement';
import useSystemStats from '../hooks/useSystemStats';
import { useSnackbar } from 'notistack';
import useRealtimeUpdates from '../hooks/useRealtimeUpdates';
import { useNavigate } from 'react-router-dom';
import useUserMonitoring from '../hooks/useUserMonitoring';
import SupportTickets from '../components/admin/SupportTickets';
import ChatAbuseAnalysis from './ChatAbuseAnalysis';
import Badge from '@mui/material/Badge';
import useAdminNotifications from '../hooks/useAdminNotifications';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import PageLayout from '../components/PageLayout';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[10]
  }
}));

const StatCard = styled(Card)(({ theme, color = 'primary' }) => ({
  backgroundColor: theme.palette[color].main,
  color: theme.palette[color].contrastText,
  padding: theme.spacing(2),
  height: '100%'
}));

const TimelineItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderLeft: `2px solid ${theme.palette.primary.main}`,
  marginLeft: theme.spacing(2),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: -5,
    top: 24,
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main
  }
}));

const DashboardContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minHeight: '100vh',
  paddingTop: '60px', // Adjusted to account for removed title and better spacing
}));

// Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
};

const AdminDashboard = () => {
  const theme = useTheme();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const { users, reports, activities, loading: dataLoading } = useRealtimeUpdates();
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState({
    type: null,  // 'ban', 'report', 'monitor'
    id: null
  });
  
  const { isAdmin, isInAdminMode } = useAuth();
  const { adminActivities, systemStats, loading: statsLoading } = useAdminDashboardUpdates();
  const { reports: reportData, loading: reportsLoading, handleReport: handleReportManagement } = useReportManagement();
  const { stats: systemMetrics, loading: systemStatsLoading } = useSystemStats();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { alerts: behaviorAlerts, monitoredUsers, addUserToMonitoring: addToMonitoring, removeUserFromMonitoring: removeFromMonitoring, userStats, riskLevel, updateUserRestrictions } = useUserMonitoring();
  const notifications = useAdminNotifications();

  const handleError = (error, message = 'An error occurred') => {
    console.error(error);
    enqueueSnackbar(`${message}: ${error.message}`, { 
      variant: 'error',
      autoHideDuration: 5000,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
      }
    });
  };

  const handleSuccess = (message) => {
    enqueueSnackbar(message, { 
      variant: 'success',
      autoHideDuration: 3000,
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'right',
      }
    });
  };

  // Admin audit logging
  const logAdminAction = async (action, targetId, details = {}) => {
    try {
      const actionMapping = {
        USER_BANNED: {
          category: 'user_management',
          color: 'error',
          label: 'User Banned'
        },
        USER_UNBANNED: {
          category: 'user_management',
          color: 'success',
          label: 'User Unbanned'
        },
        REPORT_DISMISSED: {
          category: 'content_moderation',
          color: 'info',
          label: 'Report Dismissed'
        },
        CONTENT_REMOVED: {
          category: 'content_moderation',
          color: 'warning',
          label: 'Content Removed'
        },
        TICKET_RESOLVED: {
          category: 'support',
          color: 'success',
          label: 'Ticket Resolved'
        },
        USER_MONITORED: {
          category: 'user_management',
          color: 'secondary',
          label: 'User Monitored'
        }
      };

      const actionInfo = actionMapping[action] || {
        category: 'other',
        color: 'primary',
        label: action.replace(/_/g, ' ')
      };

      const timestamp = serverTimestamp();
      const formattedDetails = {
        ...details,
        Time: new Date().toLocaleString(),
        Status: action.includes('UNBANNED') ? 'Account Restored' : 
               action.includes('BANNED') ? 'Account Restricted' : 
               'Action Completed'
      };

      const docData = {
        action: actionInfo.label,
        actionType: action,
        targetId,
        adminId: auth.currentUser.uid,
        adminEmail: auth.currentUser.email,
        timestamp,
        details: formattedDetails,
        createdAt: new Date().toLocaleString(),
        actionCategory: actionInfo.category,
        color: actionInfo.color
      };

      await addDoc(collection(db, 'adminAuditLog'), docData);
    } catch (error) {
      console.error('Error logging admin action:', error);
      throw error;
    }
  };

  // Enhanced ban user function with monitoring
  const handleBanUser = async (userId, isBanned) => {
    setOperationInProgress({ type: 'ban', id: userId });
    try {
      const userRef = doc(db, 'users', userId);
      const newStatus = !isBanned;
      
      // Update the user's banned status
      await updateDoc(userRef, {
        isBanned: newStatus,
        bannedAt: newStatus ? serverTimestamp() : null,
        updatedBy: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });

      // Update user restrictions
      await updateUserRestrictions({
        chatRestricted: newStatus,
        requiresModeration: newStatus,
        reason: newStatus ? 'Account banned by administrator' : 'Account unbanned by administrator'
      });

      // Log the admin action
      await logAdminAction(
        newStatus ? 'USER_BANNED' : 'USER_UNBANNED',
        userId,
        {
          previousStatus: isBanned,
          newStatus: newStatus,
          reason: selectedUser?.banReason || 'No reason provided'
        }
      );

      handleSuccess(`User ${newStatus ? 'banned' : 'unbanned'} successfully`);
      setDialogOpen(false);
    } catch (err) {
      handleError(err, `Failed to ${!isBanned ? 'ban' : 'unban'} user`);
    } finally {
      setOperationInProgress({ type: null, id: null });
    }
  };

  const handleReport = async (reportId, action) => {
    setOperationInProgress({ type: 'report', id: reportId });
    try {
      await handleReportManagement(reportId, action);
      handleSuccess(`Report ${action === 'dismissed' ? 'dismissed' : 'content removed'} successfully`);
    } catch (err) {
      handleError(err, 'Failed to handle report');
    } finally {
      setOperationInProgress({ type: null, id: null });
    }
  };

  // Update filtering logic for real-time data
  useEffect(() => {
    if (users.length > 0) {
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const handleUserClick = (user) => {
    const userDetails = {
      ...user,
      avatar: user.avatar || user.photoURL || user.imageUrl
    };
    setSelectedUser(userDetails);
    setDialogOpen(true);
  };

  const UserDetailDialog = () => (
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
      {selectedUser && (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">User Details</Typography>
              <Chip
                label={selectedUser.isBanned ? 'Banned' : 'Active'}
                color={selectedUser.isBanned ? 'error' : 'success'}
                size="small"
              />
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* User Profile Section */}
              <Grid item xs={12} sm={4}>
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                  <Avatar 
                    src={selectedUser.avatar || selectedUser.photoURL || selectedUser.imageUrl} 
                    alt={selectedUser.displayName}
                    sx={{ 
                      width: 120, 
                      height: 120,
                      border: '2px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    {(!selectedUser.avatar && !selectedUser.photoURL && !selectedUser.imageUrl) && (
                      <PersonIcon sx={{ width: 60, height: 60 }} />
                    )}
                  </Avatar>
                  <Typography variant="h6" align="center">
                    {selectedUser.displayName || 'Anonymous'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" align="center">
                    {selectedUser.email}
                  </Typography>
                </Box>
              </Grid>

              {/* Account Information */}
              <Grid item xs={12} sm={8}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Account Created
                      </Typography>
                      <Typography variant="body1">
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Status
                      </Typography>
                      <Typography variant="body1" color={selectedUser.isBanned ? 'error' : 'success'}>
                        {selectedUser.isBanned ? 'Banned' : 'Active'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Ban Information Section */}
                {selectedUser.isBanned && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, mt: 2, bgcolor: 'error.light' }}>
                      <Typography variant="subtitle1" color="error">
                        Ban Information
                      </Typography>
                      <Typography variant="body2">
                        Banned on: {new Date(selectedUser.bannedAt).toLocaleString()}
                      </Typography>
                      {selectedUser.banReason && (
                        <Typography variant="body2">
                          Reason: {selectedUser.banReason}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                )}

                {/* User Actions */}
                <Grid item xs={12}>
                  <Box display="flex" gap={1} mt={2}>
                    <Tooltip title="View Details">
                      <span>
                        <IconButton onClick={() => handleUserClick(selectedUser)}>
                          <InfoIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={selectedUser.isBanned ? "Unban User" : "Ban User"}>
                      <span>
                        <IconButton
                          color={selectedUser.isBanned ? "success" : "error"}
                          onClick={() => handleBanUser(selectedUser.id, selectedUser.isBanned)}
                        >
                          {selectedUser.isBanned ? <CheckIcon /> : <BlockIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
            <Button
              variant="contained"
              color={selectedUser.isBanned ? "success" : "error"}
              onClick={() => handleBanUser(selectedUser.id, selectedUser.isBanned)}
              startIcon={selectedUser.isBanned ? <CheckIcon /> : <BlockIcon />}
            >
              {selectedUser.isBanned ? "Unban User" : "Ban User"}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const SystemStats = () => (
    <Box>
      <Typography variant="h6" gutterBottom>System Overview</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>Account Status</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { name: 'Active', Users: users.filter(u => !u.isBanned).length },
                      { name: 'Banned', Users: users.filter(u => u.isBanned).length },
                      { name: 'Total', Users: users.length }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="Users" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>Reports Overview</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Pending', value: reports.filter(r => r.status === 'pending').length },
                        { name: 'Resolved', value: reports.filter(r => r.status === 'resolved').length },
                        { name: 'Dismissed', value: reports.filter(r => r.status === 'dismissed').length }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {
                        COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))
                      }
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );

  const ReportsSection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Content Reports</Typography>
      <Grid container spacing={2}>
        {reports.map((report) => (
          <Grid item xs={12} key={report.id}>
            <StyledCard>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" color="error">
                      <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      {report.type} Report
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Reported on: {new Date(report.timestamp).toLocaleDateString()}
                    </Typography>
                    <Typography sx={{ mt: 1 }}>{report.reason}</Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Dismiss Report">
                      <span>
                        <IconButton 
                          color="success"
                          onClick={() => handleReport(report.id, 'dismissed')}
                        >
                          <CheckIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remove Content">
                      <span>
                        <IconButton 
                          color="error"
                          onClick={() => handleReport(report.id, 'remove_content')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
        {reports.length === 0 && !reportsLoading && (
          <Grid item xs={12}>
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary">No reports to review</Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const ActivityTimeline = () => {
    const [clearDialogOpen, setClearDialogOpen] = useState(false);

    const getActionColor = (activity) => {
      if (activity.color) return activity.color;
      const actionLower = activity.action?.toLowerCase() || '';
      if (actionLower.includes('unban')) return 'success';
      if (actionLower.includes('ban')) return 'error';
      if (actionLower.includes('dismiss')) return 'info';
      if (actionLower.includes('report')) return 'warning';
      if (actionLower.includes('monitor')) return 'secondary';
      return 'primary';
    };

    const getBorderColor = (color) => {
      try {
        return theme.palette[color]?.main || theme.palette.primary.main;
      } catch (e) {
        return theme.palette.primary.main;
      }
    };

    const getBackgroundColor = (color) => {
      try {
        return alpha(theme.palette[color]?.main || theme.palette.primary.main, 0.05);
      } catch (e) {
        return alpha(theme.palette.primary.main, 0.05);
      }
    };

    const handleClearActivities = async () => {
      try {
        setClearDialogOpen(false);
        const activitiesRef = collection(db, 'adminAuditLog');
        const activitiesQuery = query(activitiesRef);
        const snapshot = await getDocs(activitiesQuery);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        
        handleSuccess('Activity logs cleared successfully');
      } catch (error) {
        handleError(error, 'Failed to clear activity logs');
      }
    };

    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Recent Administrative Activity</Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setClearDialogOpen(true)}
          >
            Clear Activity Log
          </Button>
        </Box>
        <AnimatePresence>
          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ p: 2 }}
          >
            {adminActivities && adminActivities.length > 0 ? (
              <Box>
                {adminActivities.map((activity) => {
                  const actionColor = getActionColor(activity);
                  return (
                    <Box
                      key={activity.id}
                      sx={{
                        py: 2,
                        px: 2,
                        mb: 2,
                        borderLeft: '4px solid',
                        borderColor: getBorderColor(actionColor),
                        bgcolor: getBackgroundColor(actionColor),
                        borderRadius: 1,
                        boxShadow: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: getBackgroundColor(actionColor),
                          transform: 'translateX(4px)'
                        },
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            size="small"
                            label={activity.action}
                            color={actionColor}
                            sx={{ 
                              fontWeight: 500,
                              borderRadius: '4px'
                            }}
                          />
                          {activity.actionCategory && (
                            <Chip
                              size="small"
                              label={activity.actionCategory.replace('_', ' ')}
                              variant="outlined"
                              color={actionColor}
                              sx={{ 
                                fontSize: '0.75rem',
                                height: '20px'
                              }}
                            />
                          )}
                        </Box>
                        <Chip
                          size="small"
                          label={activity.createdAt || (activity.timestamp?.toDate?.() ? activity.timestamp.toDate().toLocaleString() : new Date().toLocaleString())}
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.75rem',
                            bgcolor: 'background.paper'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Performed by: {activity.adminEmail}
                      </Typography>
                      {activity.targetId && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Target User ID: {activity.targetId}
                        </Typography>
                      )}
                      {activity.details && (
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            mt: 1, 
                            p: 1.5,
                            bgcolor: getBackgroundColor(actionColor),
                            borderColor: getBorderColor(actionColor),
                            '& > div:last-child': {
                              mb: 0
                            }
                          }}
                        >
                          {Object.entries(activity.details).map(([key, value]) => (
                            <Box key={key} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 500,
                                  color: alpha(getBorderColor(actionColor), 0.8),
                                  minWidth: '100px'
                                }}
                              >
                                {key}:
                              </Typography>
                              <Typography variant="body2">
                                {value.toString()}
                              </Typography>
                            </Box>
                          ))}
                        </Paper>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No administrative activities found</Typography>
              </Box>
            )}
          </Paper>
        </AnimatePresence>

        {/* Clear Activities Confirmation Dialog */}
        <Dialog
          open={clearDialogOpen}
          onClose={() => setClearDialogOpen(false)}
          aria-labelledby="clear-activities-dialog-title"
        >
          <DialogTitle id="clear-activities-dialog-title">
            Clear Activity Log
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to clear all activity logs? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleClearActivities}
              color="error"
              variant="contained"
              startIcon={<DeleteIcon />}
            >
              Clear All Activities
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  const LoadingOverlay = ({ children }) => (
    <Box sx={{ position: 'relative' }}>
      {(dataLoading || operationInProgress.type) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <CircularProgress />
          {operationInProgress.type && (
            <Typography variant="body2" color="textSecondary">
              {operationInProgress.type === 'ban' && 'Updating user status...'}
              {operationInProgress.type === 'report' && 'Processing report...'}
              {operationInProgress.type === 'monitor' && 'Updating monitoring status...'}
            </Typography>
          )}
        </Box>
      )}
      {children}
    </Box>
  );

  const LoadingState = () => (
    <Box display="flex" justifyContent="center" p={3}>
      <CircularProgress />
    </Box>
  );

  // Redirect if not in admin mode
  if (!isAdmin || !isInAdminMode) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        gap={2}
      >
        <BlockIcon color="error" sx={{ fontSize: 64 }} />
        <Typography variant="h5" color="error">
          {isAdmin ? 'Admin Mode Disabled' : 'Unauthorized Access'}
        </Typography>
        <Typography color="textSecondary">
          {isAdmin 
            ? 'Please enable admin mode to access this area'
            : 'You don\'t have permission to access this area'
          }
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          startIcon={<ArrowBackIcon />}
        >
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <PageLayout>
      <DashboardContainer
        component={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        sx={{ p: 3 }}
      >
        <LoadingOverlay>
          {/* Top Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <StatCard 
                component={motion.div} 
                variants={itemVariants} 
                initial={false} 
                animate="visible"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <GroupIcon fontSize="large" />
                  <Box>
                    <Typography variant="h4">{users.length}</Typography>
                    <Typography>Total Users</Typography>
                  </Box>
                </Box>
              </StatCard>
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard 
                component={motion.div} 
                variants={itemVariants} 
                initial={false} 
                animate="visible" 
                color="success"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon fontSize="large" />
                  <Box>
                    <Typography variant="h4">
                      {users.filter(user => !user.isBanned).length}
                    </Typography>
                    <Typography>Active Users</Typography>
                  </Box>
                </Box>
              </StatCard>
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard 
                component={motion.div} 
                variants={itemVariants} 
                initial={false} 
                animate="visible" 
                color="error"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <BlockIcon fontSize="large" />
                  <Box>
                    <Typography variant="h4">
                      {users.filter(user => user.isBanned).length}
                    </Typography>
                    <Typography>Banned Users</Typography>
                  </Box>
                </Box>
              </StatCard>
            </Grid>
            <Grid item xs={12} md={3}>
              <StatCard 
                component={motion.div} 
                variants={itemVariants} 
                initial={false} 
                animate="visible" 
                color="warning"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <FlagIcon fontSize="large" />
                  <Box>
                    <Typography variant="h4">{reports.length}</Typography>
                    <Typography>Active Reports</Typography>
                  </Box>
                </Box>
              </StatCard>
            </Grid>
          </Grid>

          <Box sx={{ width: '100%', mt: 4 }}>
            <TabContext value={activeTab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={(e, newValue) => setActiveTab(newValue)}>
                  <Tab label="Users" value="1" />
                  <Tab label="Reports" value="2" />
                  <Tab label="Activity" value="3" />
                  <Tab 
                    label={
                      <Badge 
                        badgeContent={notifications.newTickets + notifications.highPriorityTickets} 
                        color="error"
                        max={99}
                      >
                        Support Tickets
                      </Badge>
                    } 
                    value="4" 
                  />
                  <Tab 
                    label={
                      <Badge 
                        badgeContent={notifications.abuseReports} 
                        color="error"
                        max={99}
                      >
                        Chat Abuse
                      </Badge>
                    } 
                    value="5" 
                  />
                  <Tab label="Analytics" value="6" />
                  <Tab label="System Stats" value="7" />
                </TabList>
              </Box>

              <TabPanel value="1">
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                {dataLoading ? (
                  <LoadingState />
                ) : (
                  <Grid container spacing={2}>
                    {filteredUsers.map((user) => (
                      <Grid item xs={12} md={6} lg={4} key={user.id || user.uid}>
                        <StyledCard onClick={() => handleUserClick(user)}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Box position="relative">
                                <Avatar
                                  src={user.avatar || user.photoURL || user.imageUrl}
                                  alt={user.displayName || 'User Avatar'}
                                  sx={{ 
                                    width: 56, 
                                    height: 56,
                                    border: '2px solid',
                                    borderColor: theme.palette.primary.main,
                                    bgcolor: theme.palette.primary.light,
                                    fontSize: '1.5rem'
                                  }}
                                >
                                  {!user.avatar && !user.photoURL && !user.imageUrl && (
                                    user.displayName ? user.displayName[0].toUpperCase() : <PersonIcon sx={{ width: 32, height: 32 }} />
                                  )}
                                </Avatar>
                              </Box>
                              <Box flex={1}>
                                <Typography variant="h6">
                                  {user.displayName || 'Anonymous'}
                                </Typography>
                                <Typography color="textSecondary" variant="body2">
                                  {user.email}
                                </Typography>
                              </Box>
                              <Chip
                                label={user.isBanned ? 'Banned' : 'Active'}
                                color={user.isBanned ? 'error' : 'success'}
                                size="small"
                              />
                            </Box>
                          </CardContent>
                        </StyledCard>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </TabPanel>

              <TabPanel value="2">
                {reportsLoading ? <LoadingState /> : <ReportsSection />}
              </TabPanel>

              <TabPanel value="3">
                {statsLoading ? <LoadingState /> : <ActivityTimeline />}
              </TabPanel>

              <TabPanel value="4">
                <SupportTickets />
              </TabPanel>

              <TabPanel value="5">
                <ChatAbuseAnalysis />
              </TabPanel>

              <TabPanel value="6">
                <AdminAnalytics />
              </TabPanel>

              <TabPanel value="7">
                {systemStatsLoading ? <LoadingState /> : <SystemStats />}
              </TabPanel>
            </TabContext>
          </Box>

          <UserDetailDialog />
        </LoadingOverlay>
      </DashboardContainer>
    </PageLayout>
  );
};

export default AdminDashboard;
