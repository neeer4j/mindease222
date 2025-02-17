// src/pages/ChatAbuseAnalysis.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Warning as WarningIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  Flag as FlagIcon,
  Timer as TimerIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown';
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }
  return new Date(timestamp).toLocaleDateString();
};

const ChatAbuseAnalysis = () => {
  const [abusiveUsers, setAbusiveUsers] = useState([]);
  const [distressAlerts, setDistressAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banDialog, setBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [userDetailsDialog, setUserDetailsDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const theme = useTheme();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showNotification = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // --- Aggregated Abuse Analysis Section ---
  const fetchAbusiveUsers = async () => {
    try {
      const abuseRef = collection(db, 'chatAbuse');
      const q = query(abuseRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const userMap = new Map();

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (!userMap.has(data.userId)) {
          userMap.set(data.userId, {
            userId: data.userId,
            flaggedMessages: [],
            spamCount: 0,
            abuseCount: 0,
            distressCount: 0,
            lastViolation: data.createdAt || data.timestamp
          });
        }
        const userData = userMap.get(data.userId);
        userData.flaggedMessages.push({
          messageId: data.messageId || docSnap.id,
          content: data.text,
          timestamp: data.timestamp,
          categories: data.categories || []
        });

        // Count each type separately based on categories
        if (data.categories) {
          if (data.categories.includes('spam')) userData.spamCount++;
          if (data.categories.includes('abuse')) userData.abuseCount++;
          if (data.categories.includes('distress')) userData.distressCount++;
        }
      });

      const aggregated = Array.from(userMap.values());
      // Fetch user's name and ban status from the users collection
      const updatedUsers = await Promise.all(
        aggregated.map(async (user) => {
          const userDocRef = doc(db, 'users', user.userId);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.exists() ? userDoc.data() : {};
          return { 
            ...user, 
            name: userData.displayName || userData.name || '',
            isAdmin: userData.isAdmin || false,
            isBanned: userData.isBanned || false 
          };
        })
      );

      setAbusiveUsers(updatedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching abusive users:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAbusiveUsers();
    }
  }, [isAdmin]);

  // --- Real-Time Distress Alerts Section ---
  useEffect(() => {
    const distressQuery = query(
      collection(db, 'chatAbuse'),
      where('categories', 'array-contains', 'distress'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeDistress = onSnapshot(distressQuery, (snapshot) => {
      const processAlerts = async () => {
        const alerts = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let userName = '';
            let isBanned = false;
            try {
              const userDocRef = doc(db, 'users', data.userId);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = userData.displayName || userData.name || '';
                isBanned = userData.isBanned || false;
              }
            } catch (error) {
              console.error('Error fetching user name for distress alert:', error);
            }
            return { id: docSnap.id, ...data, userName, isBanned };
          })
        );
        setDistressAlerts(alerts);
      };
      processAlerts();
    });
    return () => unsubscribeDistress();
  }, []);

  // --- Ban/Unban Handlers ---
  // First, fetch full user details and then open the ban dialog.
  const handleBanUserDialog = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setSelectedUser({ userId, ...userDoc.data() });
        setBanDialog(true);
      } else {
        showNotification('User not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching user details for banning:', error);
      showNotification('Error fetching user details', 'error');
    }
  };

  // This function toggles the ban status.
  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(db, 'users', selectedUser.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Check if user is an admin
      if (userData.isAdmin) {
        showNotification('Cannot ban an admin user', 'error');
        setBanDialog(false);
        return;
      }

      if (selectedUser.isBanned) {
        // Unban logic
        await updateDoc(userRef, {
          isBanned: false,
          bannedAt: null,
          banReason: null,
          updatedAt: serverTimestamp(),
        });
        showNotification('User unbanned successfully', 'success');
      } else {
        // For banning, require a reason
        if (!banReason) {
          showNotification('Please provide a ban reason', 'error');
          return;
        }
        await updateDoc(userRef, {
          isBanned: true,
          bannedAt: serverTimestamp(),
          banReason: banReason,
          updatedAt: serverTimestamp(),
        });
        showNotification('User banned successfully', 'success');
      }
      
      // Update the local state for selectedUser
      const updatedUserDoc = await getDoc(userRef);
      if (updatedUserDoc.exists()) {
        setSelectedUser({ userId: selectedUser.userId, ...updatedUserDoc.data() });
      }
      setBanDialog(false);
      setBanReason('');
      fetchAbusiveUsers();
    } catch (error) {
      console.error('Error updating user ban status:', error);
      showNotification(`Error: ${error.message}`, 'error');
    }
  };

  // --- User Details Dialog Handler ---
  const handleViewUser = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setSelectedUser({ userId, ...userDoc.data() });
        setUserDetailsDialog(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // --- Reset Data Handler ---
  const handleResetData = async () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset chat abuse analysis data? This action cannot be undone.'
    );
    if (!confirmReset) return;
    try {
      const abuseRef = collection(db, 'chatAbuse');
      const q = query(abuseRef);
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(doc(db, 'chatAbuse', docSnap.id));
      });
      await batch.commit();
      alert('Chat abuse analysis data has been reset.');
      setAbusiveUsers([]);
    } catch (error) {
      console.error('Error resetting chat abuse analysis data:', error);
      alert('Failed to reset data.');
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Unauthorized Access
        </Typography>
      </Box>
    );
  }

  return (
    <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ p: 3 }}>
      {/* Header with Reset Data Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Chat Abuse Analysis
        </Typography>
        <Button variant="outlined" color="error" onClick={handleResetData}>
          Reset Analysis Data
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Aggregated Abuse Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Flagged Users</Typography>
              <Typography variant="h3">{abusiveUsers.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Spam Incidents</Typography>
              <Typography variant="h3">
                {abusiveUsers.reduce((total, user) => total + user.spamCount, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Total Abuse Incidents</Typography>
              <Typography variant="h3">
                {abusiveUsers.reduce((total, user) => total + user.abuseCount, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Abuse Timeline Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Abuse Incidents Timeline
            </Typography>
            <Box sx={{ height: 400, p: 2 }}>
              <ResponsiveContainer>
                <LineChart
                  data={abusiveUsers.map(user => ({
                    userId: user.userId,
                    name: user.name || 'Anonymous',
                    spam: user.spamCount,
                    abuse: user.abuseCount,
                    distress: user.distressCount,
                    date: user.lastViolation
                      ? new Date(user.lastViolation.seconds * 1000).toLocaleString()
                      : 'N/A'
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="date" 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              {payload[0]?.payload?.name}
                            </Typography>
                            {payload.map((entry, index) => (
                              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    backgroundColor: entry.color,
                                    borderRadius: '50%'
                                  }}
                                />
                                <Typography variant="body2">
                                  {entry.name}: {entry.value}
                                </Typography>
                              </Box>
                            ))}
                            <Typography variant="caption" color="text.secondary">
                              {new Date(label).toLocaleString()}
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="spam" 
                    name="Spam" 
                    stroke={theme.palette.warning.main}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="abuse" 
                    name="Abuse" 
                    stroke={theme.palette.error.main}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="distress" 
                    name="Distress" 
                    stroke={theme.palette.info.main}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: theme.palette.warning.main, borderRadius: '50%' }} />
                <Typography variant="body2">Spam</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: theme.palette.error.main, borderRadius: '50%' }} />
                <Typography variant="body2">Abuse</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: theme.palette.info.main, borderRadius: '50%' }} />
                <Typography variant="body2">Distress</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Detailed Aggregated User Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User ID</TableCell>
                  <TableCell>User Name</TableCell>
                  <TableCell>Spam Count</TableCell>
                  <TableCell>Abuse Count</TableCell>
                  <TableCell>Last Violation</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {abusiveUsers.map((user, index) => (
                  <TableRow key={`${user.userId}-${index}`}>
                    <TableCell>{user.userId}</TableCell>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip icon={<TimerIcon />} label={user.spamCount} color="warning" size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip icon={<FlagIcon />} label={user.abuseCount} color="error" size="small" />
                    </TableCell>
                    <TableCell>
                      {user.lastViolation
                        ? new Date(user.lastViolation.seconds * 1000).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<WarningIcon />}
                        label={user.spamCount + user.abuseCount > 5 ? 'High' : 'Medium'}
                        color={user.spamCount + user.abuseCount > 5 ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View User Details">
                        <IconButton onClick={() => handleViewUser(user.userId)}>
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {user.isAdmin ? (
                        <Tooltip title="Cannot ban admin users">
                          <span>
                            <IconButton disabled>
                              <BlockIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : (
                        <Tooltip title={user.isBanned ? "Unban User" : "Ban User"}>
                          <IconButton
                            color={user.isBanned ? "success" : "error"}
                            onClick={() => handleBanUserDialog(user.userId)}
                          >
                            <Box component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                              {user.isBanned ? <CheckIcon /> : <BlockIcon />}
                            </Box>
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* --- Distress Alerts Section --- */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Distress Message Detection
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          The following messages have been flagged as distress-related.
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User Name</TableCell>
                <TableCell>User ID</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {distressAlerts.map((alert, idx) => (
                <TableRow key={`${alert.id}-${idx}`}>
                  <TableCell>{alert.userName || 'N/A'}</TableCell>
                  <TableCell>{alert.userId}</TableCell>
                  <TableCell>{alert.text}</TableCell>
                  <TableCell>
                    {alert.createdAt
                      ? new Date(alert.createdAt.seconds * 1000).toLocaleString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<WarningIcon />}
                      label={alert.severity || 'N/A'}
                      color={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View User Details">
                      <IconButton onClick={() => handleViewUser(alert.userId)}>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={alert.isBanned ? "Unban User" : "Ban User"}>
                      <IconButton
                        color={alert.isBanned ? "success" : "error"}
                        onClick={() => handleBanUserDialog(alert.userId)}
                      >
                        <Box component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                          {alert.isBanned ? <CheckIcon /> : <BlockIcon />}
                        </Box>
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {distressAlerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No distress alerts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* User Details Dialog */}
      <Dialog open={userDetailsDialog} onClose={() => setUserDetailsDialog(false)} maxWidth="md" fullWidth>
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
                      src={selectedUser.avatar || selectedUser.photoURL} 
                      alt={selectedUser.displayName || 'Avatar'}
                      sx={{ width: 120, height: 120 }}
                    />
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
                          {selectedUser.createdAt ? formatTimestamp(selectedUser.createdAt) : 'Unknown'}
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

                  {selectedUser.isBanned && (
                    <Paper sx={{ p: 2, mt: 2, bgcolor: 'error.light' }}>
                      <Typography variant="subtitle1" color="error">
                        Ban Information
                      </Typography>
                      <Typography variant="body2">
                        Banned on: {selectedUser.bannedAt ? formatTimestamp(selectedUser.bannedAt) : 'N/A'}
                      </Typography>
                      {selectedUser.banReason && (
                        <Typography variant="body2">
                          Reason: {selectedUser.banReason}
                        </Typography>
                      )}
                    </Paper>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUserDetailsDialog(false)}>Close</Button>
              {selectedUser?.isBanned ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    setUserDetailsDialog(false);
                    setBanDialog(true);
                  }}
                  startIcon={<CheckIcon />}
                >
                  Unban User
                </Button>
              ) : !selectedUser?.isAdmin && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => {
                    setUserDetailsDialog(false);
                    setBanDialog(true);
                  }}
                  startIcon={<BlockIcon />}
                >
                  Ban User
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Ban/Unban Dialog */}
      <Dialog open={banDialog} onClose={() => setBanDialog(false)}>
        <DialogTitle>
          {selectedUser?.isBanned 
            ? "Unban User" 
            : selectedUser?.isAdmin 
              ? "Cannot Ban Admin" 
              : "Ban User for Chat Abuse"
          }
        </DialogTitle>
        <DialogContent>
          {selectedUser?.isAdmin ? (
            <Typography variant="body1" color="error" paragraph>
              Admin users cannot be banned from the chat system.
            </Typography>
          ) : selectedUser?.isBanned ? (
            <Typography variant="body1" paragraph>
              Are you sure you want to unban this user? This will allow them to access the chat feature again.
            </Typography>
          ) : (
            <>
              <Typography variant="body1" paragraph>
                Are you sure you want to ban this user? This action will prevent them from accessing the chat feature.
              </Typography>
              <TextField
                fullWidth
                label="Ban Reason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                required
                multiline
                rows={3}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialog(false)}>
            {selectedUser?.isAdmin ? 'Close' : 'Cancel'}
          </Button>
          {!selectedUser?.isAdmin && (
            <Button
              color={selectedUser?.isBanned ? "success" : "error"}
              variant="contained"
              onClick={handleBanUser}
              disabled={!selectedUser?.isBanned && !banReason}
            >
              {selectedUser?.isBanned ? "Unban User" : "Ban User"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatAbuseAnalysis;
