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
  padding: theme.spacing(3),
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 16,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 4px 20px 0 ${alpha(theme.palette[color].main, 0.2)}`,
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 20px 40px -15px ${alpha(theme.palette[color].main, 0.3)}`,
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `radial-gradient(circle at 100% 100%, ${alpha('#fff', 0.15)} 0%, transparent 50%)`,
    opacity: 0.4,
  }
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
  background: theme.palette.background.gradient,
  boxSizing: 'border-box',
  gap: theme.spacing(3)
}));

// Add these new styled components after the existing styled components
const SearchContainer = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 10,
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius * 2,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  }
}));

const UserCard = styled(StyledCard)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'visible',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px -15px ${alpha(theme.palette.primary.main, 0.2)}`,
  }
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  border: `3px solid ${theme.palette.background.paper}`,
  boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: '12px',
  fontWeight: 600,
  padding: '0 12px',
  height: '24px',
  '& .MuiChip-label': {
    padding: '0 8px',
  },
  ...(status === 'active' && {
    background: alpha(theme.palette.success.main, 0.1),
    color: theme.palette.success.main,
    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
  }),
  ...(status === 'banned' && {
    background: alpha(theme.palette.error.main, 0.1),
    color: theme.palette.error.main,
    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
  }),
}));

// Add new styled components for the dialog
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    backgroundColor: theme.palette.background.paper,
    overflow: 'hidden',
  },
  '& .MuiDialogTitle-root': {
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.default,
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
  }
}));

const DetailItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 12,
  backgroundColor: theme.palette.background.default,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 16px -6px ${alpha(theme.palette.primary.main, 0.2)}`,
  }
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

// Add new styled components for tabs
const StyledTabList = styled(TabList)(({ theme }) => ({
  borderBottom: 'none',
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTab-root': {
    minHeight: 48,
    minWidth: 'auto',
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
    transition: 'all 0.2s ease',
    [theme.breakpoints.down('sm')]: {
      minWidth: 'auto',
      padding: theme.spacing(1, 1.5),
    }
  },
}));

const TabPanelContainer = styled(Box)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  }
}));

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
    <StyledDialog 
      open={dialogOpen} 
      onClose={() => setDialogOpen(false)} 
      maxWidth="md" 
      fullWidth
      TransitionComponent={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {selectedUser && (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <UserAvatar
                  src={selectedUser.avatar || selectedUser.photoURL || selectedUser.imageUrl}
                  alt={selectedUser.displayName}
                  sx={{ width: 80, height: 80 }}
                >
                  {(!selectedUser.avatar && !selectedUser.photoURL && !selectedUser.imageUrl) && (
                    <PersonIcon sx={{ width: 40, height: 40 }} />
                  )}
                </UserAvatar>
                <Box>
                  <Typography variant="h5" fontWeight="600">
                    {selectedUser.displayName || 'Anonymous'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    User Details
                  </Typography>
                </Box>
              </Box>
              <StatusChip
                label={selectedUser.isBanned ? 'Banned' : 'Active'}
                status={selectedUser.isBanned ? 'banned' : 'active'}
              />
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <DetailItem>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Email Address
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedUser.email}
                    </Typography>
                  </DetailItem>
                  <DetailItem>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Account Created
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </DetailItem>
                  <DetailItem>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Last Active
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString() : 'Unknown'}
                    </Typography>
                  </DetailItem>
                </Box>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Box display="flex" flexDirection="column" gap={3}>
                  {selectedUser.isBanned && (
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.dark, 0.05)})`,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      }}
                    >
                      <Typography variant="subtitle1" color="error" fontWeight="600" gutterBottom>
                        Account Restrictions
                      </Typography>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Typography variant="body2">
                          <strong>Banned on:</strong> {new Date(selectedUser.bannedAt).toLocaleString()}
                        </Typography>
                        {selectedUser.banReason && (
                          <Typography variant="body2">
                            <strong>Reason:</strong> {selectedUser.banReason}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  <DetailItem sx={{ height: '100%' }}>
                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                      Account Activity
                    </Typography>
                    <Box display="flex" gap={2} mb={2}>
                      <Chip
                        icon={<AssessmentIcon />}
                        label="Reports: 0"
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        icon={<WarningIcon />}
                        label="Warnings: 0"
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        icon={<TimelineIcon />}
                        label="Activity Score: 100"
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color={selectedUser.isBanned ? "success" : "error"}
                        fullWidth
                        startIcon={selectedUser.isBanned ? <CheckIcon /> : <BlockIcon />}
                        onClick={() => handleBanUser(selectedUser.id, selectedUser.isBanned)}
                        sx={{
                          borderRadius: '12px',
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        {selectedUser.isBanned ? "Remove Restrictions" : "Restrict Account"}
                      </Button>
                    </Box>
                  </DetailItem>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
        </>
      )}
    </StyledDialog>
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
      >
        <LoadingOverlay>
          {/* Top Stats Section */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight="600" gutterBottom>
                Admin Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Monitor and manage your platform's users and activities
              </Typography>
            </Box>
            
            <Grid container spacing={4}>
              {/* Stat Cards */}
              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  component={motion.div} 
                  variants={itemVariants} 
                  initial={false} 
                  animate="visible"
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        backgroundColor: alpha('#fff', 0.2),
                      }}
                    >
                      <GroupIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="600">
                        {users.length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Total Users
                      </Typography>
                    </Box>
                  </Box>
                </StatCard>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  component={motion.div} 
                  variants={itemVariants} 
                  initial={false} 
                  animate="visible" 
                  color="success"
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        backgroundColor: alpha('#fff', 0.2),
                      }}
                    >
                      <CheckCircleIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="600">
                        {users.filter(user => !user.isBanned).length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Active Users
                      </Typography>
                    </Box>
                  </Box>
                </StatCard>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  component={motion.div} 
                  variants={itemVariants} 
                  initial={false} 
                  animate="visible" 
                  color="error"
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        backgroundColor: alpha('#fff', 0.2),
                      }}
                    >
                      <BlockIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="600">
                        {users.filter(user => user.isBanned).length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Banned Users
                      </Typography>
                    </Box>
                  </Box>
                </StatCard>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCard 
                  component={motion.div} 
                  variants={itemVariants} 
                  initial={false} 
                  animate="visible" 
                  color="warning"
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '12px',
                        backgroundColor: alpha('#fff', 0.2),
                      }}
                    >
                      <FlagIcon fontSize="large" />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="600">
                        {reports.length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Active Reports
                      </Typography>
                    </Box>
                  </Box>
                </StatCard>
              </Grid>
            </Grid>
          </Box>

          {/* Main Content Section */}
          <Box sx={{ mt: 2 }}>
            <TabContext value={activeTab}>
              <Box>
                <StyledTabList 
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                    px: 2,
                    mb: 3,
                  }}
                >
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <GroupIcon fontSize="small" />
                        <span>Users</span>
                      </Box>
                    } 
                    value="1" 
                  />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <FlagIcon fontSize="small" />
                        <span>Reports</span>
                      </Box>
                    } 
                    value="2" 
                  />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <TimelineIcon fontSize="small" />
                        <span>Activity</span>
                      </Box>
                    } 
                    value="3" 
                  />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Badge 
                          badgeContent={notifications.newTickets + notifications.highPriorityTickets} 
                          color="error"
                          max={99}
                        >
                          <SupervisorAccountIcon fontSize="small" />
                        </Badge>
                        <span>Support</span>
                      </Box>
                    } 
                    value="4" 
                  />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Badge 
                          badgeContent={notifications.abuseReports} 
                          color="error"
                          max={99}
                        >
                          <WarningIcon fontSize="small" />
                        </Badge>
                        <span>Abuse</span>
                      </Box>
                    } 
                    value="5" 
                  />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <AssessmentIcon fontSize="small" />
                        <span>Analytics</span>
                      </Box>
                    } 
                    value="6" 
                  />
                  <Tab 
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <InfoIcon fontSize="small" />
                        <span>System</span>
                      </Box>
                    } 
                    value="7" 
                  />
                </StyledTabList>
              </Box>

              <TabPanelContainer>
                <TabPanel value="1" sx={{ p: 0 }}>
                  <SearchContainer>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="primary" />
                          </InputAdornment>
                        ),
                        sx: {
                          borderRadius: '12px',
                          backgroundColor: theme.palette.background.paper,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(theme.palette.divider, 0.2),
                          }
                        }
                      }}
                    />
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Typography variant="body2" color="textSecondary">
                        {filteredUsers.length} users found
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={`${users.filter(u => !u.isBanned).length} Active`}
                          color="success"
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          icon={<BlockIcon />}
                          label={`${users.filter(u => u.isBanned).length} Banned`}
                          color="error"
                          variant="outlined"
                          size="small"
                        />
                      </Box>
                    </Box>
                  </SearchContainer>
                  
                  {dataLoading ? (
                    <LoadingState />
                  ) : (
                    <Box sx={{ px: 3 }}>
                      <Grid container spacing={2}>
                        {filteredUsers.map((user) => (
                          <Grid item xs={12} md={6} lg={4} key={user.id || user.uid}>
                            <UserCard onClick={() => handleUserClick(user)}>
                              <CardContent>
                                <Box display="flex" flexDirection="column" gap={2}>
                                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box display="flex" gap={2}>
                                      <UserAvatar
                                        src={user.avatar || user.photoURL || user.imageUrl}
                                        alt={user.displayName || 'User Avatar'}
                                      >
                                        {!user.avatar && !user.photoURL && !user.imageUrl && (
                                          user.displayName ? user.displayName[0].toUpperCase() : <PersonIcon />
                                        )}
                                      </UserAvatar>
                                      <Box>
                                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                                          {user.displayName || 'Anonymous'}
                                        </Typography>
                                        <Typography 
                                          variant="body2" 
                                          color="textSecondary"
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5
                                          }}
                                        >
                                          <PersonIcon fontSize="small" />
                                          {user.email}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <StatusChip
                                      label={user.isBanned ? 'Banned' : 'Active'}
                                      status={user.isBanned ? 'banned' : 'active'}
                                      size="small"
                                    />
                                  </Box>
                                  <Box 
                                    sx={{ 
                                      display: 'flex', 
                                      gap: 1, 
                                      mt: 1,
                                      opacity: 0.7,
                                      transition: 'opacity 0.3s ease',
                                      '&:hover': { opacity: 1 }
                                    }}
                                  >
                                    <Tooltip title="View Details">
                                      <IconButton 
                                        size="small" 
                                        sx={{ 
                                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                                          '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                                          }
                                        }}
                                      >
                                        <InfoIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={user.isBanned ? "Unban User" : "Ban User"}>
                                      <IconButton 
                                        size="small"
                                        sx={{ 
                                          bgcolor: alpha(user.isBanned ? theme.palette.success.main : theme.palette.error.main, 0.1),
                                          '&:hover': {
                                            bgcolor: alpha(user.isBanned ? theme.palette.success.main : theme.palette.error.main, 0.2),
                                          }
                                        }}
                                      >
                                        {user.isBanned ? <CheckIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              </CardContent>
                            </UserCard>
                          </Grid>
                        ))}
                        {filteredUsers.length === 0 && (
                          <Grid item xs={12}>
                            <Box 
                              display="flex" 
                              flexDirection="column" 
                              alignItems="center" 
                              justifyContent="center" 
                              py={8}
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                                borderRadius: 2
                              }}
                            >
                              <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="h6" color="text.secondary">
                                No users found
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Try adjusting your search criteria
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  )}
                </TabPanel>

                <TabPanel value="2" sx={{ p: 0 }}>
                  {reportsLoading ? <LoadingState /> : <ReportsSection />}
                </TabPanel>

                <TabPanel value="3" sx={{ p: 0 }}>
                  {statsLoading ? <LoadingState /> : <ActivityTimeline />}
                </TabPanel>

                <TabPanel value="4" sx={{ p: 0 }}>
                  <SupportTickets />
                </TabPanel>

                <TabPanel value="5" sx={{ p: 0 }}>
                  <ChatAbuseAnalysis />
                </TabPanel>

                <TabPanel value="6" sx={{ p: 0 }}>
                  <AdminAnalytics />
                </TabPanel>

                <TabPanel value="7" sx={{ p: 0 }}>
                  {systemStatsLoading ? <LoadingState /> : <SystemStats />}
                </TabPanel>
              </TabPanelContainer>
            </TabContext>
          </Box>

          <UserDetailDialog />
        </LoadingOverlay>
      </DashboardContainer>
    </PageLayout>
  );
};

export default AdminDashboard;
