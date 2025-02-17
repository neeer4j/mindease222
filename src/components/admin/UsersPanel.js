import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    TextField,
    Chip,
    Avatar,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Stack,
    Tab,
    Tabs,
    Paper,
    CircularProgress,
    MenuItem,
    Menu,
    styled,
    useTheme
} from '@mui/material';
import {
    Person as PersonIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    Warning as WarningIcon,
    Security as SecurityIcon,
    FilterList as FilterListIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Monitor as MonitorIcon
} from '@mui/icons-material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, serverTimestamp, addDoc, getDoc, writeBatch } from 'firebase/firestore';
import { useSnackbar } from 'notistack';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8]
    }
}));

const StyledStatsCard = styled(Card)(({ theme, color = 'primary' }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
    color: theme.palette[color].contrastText,
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8]
    }
}));

const RoleChip = styled(Chip)(({ theme, role }) => ({
    backgroundColor: 
        role === 'admin' ? theme.palette.error.main :
        role === 'moderator' ? theme.palette.warning.main :
        role === 'premium' ? theme.palette.info.main :
        theme.palette.success.light,
    color: '#fff'
}));

const UsersPanel = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const theme = useTheme();
    const { user: currentUser } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    // Fetch users data
    const fetchUsers = async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const userData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastActive: doc.data().lastActive?.toDate()?.toLocaleString() || 'Never'
            }));
            setUsers(userData);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleError = (error, message = 'An error occurred') => {
        console.error(error);
        let errorMessage = message;
        
        // Handle specific Firebase errors
        if (error.code === 'permission-denied') {
            errorMessage = 'You do not have permission to perform this action. Please make sure you have admin privileges.';
        } else if (error.code === 'failed-precondition') {
            errorMessage = 'Unable to perform this action. The user account may be in an invalid state.';
        } else {
            errorMessage = `${message}: ${error.message}`;
        }
        
        enqueueSnackbar(errorMessage, { 
            variant: 'error',
            autoHideDuration: 5000
        });
    };

    const handleSuccess = (message) => {
        enqueueSnackbar(message, { 
            variant: 'success',
            autoHideDuration: 3000
        });
    };

    // Enhanced ban user function with monitoring
    const handleUserAction = async (userId, action) => {
        try {
            if (!currentUser) {
                throw new Error('You must be logged in to perform this action');
            }

            // Get current user's data to verify admin status
            const currentUserRef = doc(db, 'users', currentUser.uid);
            const currentUserSnap = await getDoc(currentUserRef);
            
            if (!currentUserSnap.exists()) {
                throw new Error('User data not found');
            }
            
            const currentUserData = currentUserSnap.data();
            
            // Check admin privileges matching Firestore rules
            if (!currentUserData.isAdmin || currentUserData.role !== 'admin') {
                throw new Error('Admin privileges required - you must be an admin to perform this action');
            }

            const userRef = doc(db, 'users', userId);
            const targetUserSnap = await getDoc(userRef);
            
            if (!targetUserSnap.exists()) {
                throw new Error('Target user not found');
            }

            // Don't allow banning other admins
            const targetUserData = targetUserSnap.data();
            if (targetUserData.isAdmin && targetUserData.role === 'admin') {
                throw new Error('Cannot perform actions on admin users');
            }
            
            switch (action) {
                case 'ban':
                case 'unban':
                    const newStatus = action === 'ban';
                    const batch = writeBatch(db);
                    
                    // Update user document with only allowed fields
                    const updateData = {
                        isBanned: newStatus,
                        bannedAt: newStatus ? serverTimestamp() : null,
                        banReason: newStatus ? 'Administrative action' : null,
                        updatedBy: currentUser.uid,
                        updatedAt: serverTimestamp(),
                        chatRestricted: newStatus,
                        requiresModeration: newStatus,
                        restrictionReason: newStatus ? 'Account banned by administrator' : null
                    };

                    batch.update(userRef, updateData);

                    // Create audit log entry
                    const auditRef = doc(collection(db, 'adminAuditLog'));
                    batch.set(auditRef, {
                        action: newStatus ? 'user_banned' : 'user_unbanned',
                        targetUserId: userId,
                        adminId: currentUser.uid,
                        timestamp: serverTimestamp(),
                        details: {
                            reason: 'Administrative action'
                        }
                    });

                    // Commit the batch
                    await batch.commit();
                    handleSuccess(`User ${newStatus ? 'banned' : 'unbanned'} successfully`);
                    break;

                case 'monitor':
                    // Update user monitoring status with only allowed fields
                    await updateDoc(userRef, {
                        isMonitored: true,
                        monitoredSince: serverTimestamp(),
                        monitoredBy: currentUser.uid,
                        requiresModeration: true,
                        updatedAt: serverTimestamp(),
                        updatedBy: currentUser.uid
                    });
                    
                    // Create monitoring audit log
                    await addDoc(collection(db, 'adminAuditLog'), {
                        action: 'user_monitored',
                        targetUserId: userId,
                        adminId: currentUser.uid,
                        timestamp: serverTimestamp()
                    });
                    
                    handleSuccess('User added to monitoring list');
                    break;
                    
                default:
                    break;
            }
            
            // Refresh the users list after successful action
            await fetchUsers();
        } catch (error) {
            console.error('Admin check error:', error);
            handleError(error, `Failed to ${action} user`);
        }
    };

    const columns = [
        {
            field: 'avatar',
            headerName: '',
            width: 60,
            renderCell: (params) => (
                <Avatar 
                    src={params.row.photoURL || params.row.avatar} 
                    alt={params.row.displayName}
                >
                    {!params.row.photoURL && !params.row.avatar && (
                        params.row.displayName?.[0] || <PersonIcon />
                    )}
                </Avatar>
            )
        },
        { field: 'displayName', headerName: 'Name', width: 150 },
        { field: 'email', headerName: 'Email', width: 200 },
        {
            field: 'role',
            headerName: 'Role',
            width: 120,
            renderCell: (params) => (
                <RoleChip 
                    label={params.row.role || 'user'} 
                    role={params.row.role}
                    size="small"
                />
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.row.isBanned ? 'Banned' : 'Active'}
                    color={params.row.isBanned ? 'error' : 'success'}
                    size="small"
                    icon={params.row.isBanned ? <BlockIcon /> : <CheckCircleIcon />}
                />
            )
        },
        { 
            field: 'lastActive',
            headerName: 'Last Active',
            width: 180
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                        <IconButton 
                            size="small"
                            onClick={() => {
                                setSelectedUser(params.row);
                                setDetailsOpen(true);
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <IconButton
                        size="small"
                        onClick={(event) => {
                            setSelectedUser(params.row);
                            setAnchorEl(event.currentTarget);
                        }}
                    >
                        <MoreVertIcon />
                    </IconButton>
                </Stack>
            )
        }
    ];

    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    return (
        <Box sx={{ p: 3 }}>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Stats Cards */}
                <Grid item xs={12} md={3}>
                    <StyledStatsCard color="primary">
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <PersonIcon sx={{ fontSize: 40, color: 'inherit' }} />
                                <Box>
                                    <Typography variant="h4" sx={{ color: 'inherit' }}>
                                        {users.length}
                                    </Typography>
                                    <Typography sx={{ color: 'inherit', opacity: 0.8 }}>
                                        Total Users
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </StyledStatsCard>
                </Grid>
                <Grid item xs={12} md={3}>
                    <StyledStatsCard color="error">
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <BlockIcon sx={{ fontSize: 40, color: 'inherit' }} />
                                <Box>
                                    <Typography variant="h4" sx={{ color: 'inherit' }}>
                                        {users.filter(u => u.isBanned).length}
                                    </Typography>
                                    <Typography sx={{ color: 'inherit', opacity: 0.8 }}>
                                        Banned Users
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </StyledStatsCard>
                </Grid>
                <Grid item xs={12} md={3}>
                    <StyledStatsCard color="warning">
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <SecurityIcon sx={{ fontSize: 40, color: 'inherit' }} />
                                <Box>
                                    <Typography variant="h4" sx={{ color: 'inherit' }}>
                                        {users.filter(u => u.role === 'admin').length}
                                    </Typography>
                                    <Typography sx={{ color: 'inherit', opacity: 0.8 }}>
                                        Admins
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </StyledStatsCard>
                </Grid>
                <Grid item xs={12} md={3}>
                    <StyledStatsCard color="info">
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <MonitorIcon sx={{ fontSize: 40, color: 'inherit' }} />
                                <Box>
                                    <Typography variant="h4" sx={{ color: 'inherit' }}>
                                        {users.filter(u => u.isMonitored).length}
                                    </Typography>
                                    <Typography sx={{ color: 'inherit', opacity: 0.8 }}>
                                        Monitored
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </StyledStatsCard>
                </Grid>
            </Grid>

            {/* Filters and Search */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        size="small"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        select
                        size="small"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        sx={{ minWidth: 150 }}
                        InputProps={{
                            startAdornment: <FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                    >
                        <MenuItem value="all">All Roles</MenuItem>
                        <MenuItem value="admin">Admins</MenuItem>
                        <MenuItem value="moderator">Moderators</MenuItem>
                        <MenuItem value="premium">Premium</MenuItem>
                        <MenuItem value="user">Users</MenuItem>
                    </TextField>
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={fetchUsers}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                </Stack>
            </Paper>

            {/* Users Table */}
            <Paper sx={{ height: 600, width: '100%' }}>
                <DataGrid
                    rows={filteredUsers}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    checkboxSelection
                    disableSelectionOnClick
                    loading={loading}
                    components={{
                        Toolbar: GridToolbar,
                    }}
                />
            </Paper>

            {/* User Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem 
                    onClick={() => {
                        handleUserAction(selectedUser?.id, selectedUser?.isBanned ? 'unban' : 'ban');
                        setAnchorEl(null);
                    }}
                >
                    {selectedUser?.isBanned ? 'Unban User' : 'Ban User'}
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        handleUserAction(selectedUser?.id, 'monitor');
                        setAnchorEl(null);
                    }}
                >
                    Monitor User
                </MenuItem>
            </Menu>

            {/* User Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedUser && (
                    <>
                        <DialogTitle>
                            User Details
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                        <Avatar
                                            src={selectedUser.photoURL || selectedUser.avatar}
                                            sx={{ width: 120, height: 120 }}
                                        >
                                            {!selectedUser.photoURL && !selectedUser.avatar && (
                                                selectedUser.displayName?.[0] || <PersonIcon sx={{ fontSize: 60 }} />
                                            )}
                                        </Avatar>
                                        <Typography variant="h6">
                                            {selectedUser.displayName}
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            <RoleChip
                                                label={selectedUser.role || 'user'}
                                                role={selectedUser.role}
                                            />
                                            <Chip
                                                label={selectedUser.isBanned ? 'Banned' : 'Active'}
                                                color={selectedUser.isBanned ? 'error' : 'success'}
                                            />
                                        </Stack>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <Stack spacing={2}>
                                        <TextField
                                            label="Email"
                                            value={selectedUser.email}
                                            fullWidth
                                            InputProps={{ readOnly: true }}
                                        />
                                        <TextField
                                            label="Account Created"
                                            value={selectedUser.createdAt?.toDate?.().toLocaleString() || 'Unknown'}
                                            fullWidth
                                            InputProps={{ readOnly: true }}
                                        />
                                        <TextField
                                            label="Last Active"
                                            value={selectedUser.lastActive || 'Never'}
                                            fullWidth
                                            InputProps={{ readOnly: true }}
                                        />
                                        {selectedUser.isBanned && (
                                            <TextField
                                                label="Banned Since"
                                                value={selectedUser.bannedAt?.toDate?.().toLocaleString() || 'Unknown'}
                                                fullWidth
                                                InputProps={{ readOnly: true }}
                                            />
                                        )}
                                    </Stack>
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetailsOpen(false)}>
                                Close
                            </Button>
                            <Button
                                variant="contained"
                                color={selectedUser.isBanned ? "success" : "error"}
                                onClick={() => {
                                    handleUserAction(selectedUser.id, selectedUser.isBanned ? 'unban' : 'ban');
                                    setDetailsOpen(false);
                                }}
                            >
                                {selectedUser.isBanned ? 'Unban User' : 'Ban User'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default UsersPanel;