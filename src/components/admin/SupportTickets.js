import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    useTheme
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Visibility as VisibilityIcon,
    Close as CloseIcon,
    Reply as ReplyIcon
} from '@mui/icons-material';
import Rating from '@mui/material/Rating';
import { SentimentSatisfiedAlt as SatisfiedIcon } from '@mui/icons-material';
import useSupportTickets from '../../hooks/useSupportTickets';
import { useAuth } from '../../contexts/AuthContext';

const priorityColors = {
    high: 'error',
    medium: 'warning',
    low: 'info'
};

const statusColors = {
    open: 'error',
    'in-progress': 'warning',
    resolved: 'success',
    closed: 'default'
};

const TicketStats = ({ tickets }) => {
    const theme = useTheme();
    
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in-progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        avgResponseTime: calculateAverageResponseTime(tickets),
        satisfaction: calculateSatisfactionRate(tickets)
    };

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">{stats.total}</Typography>
                    <Typography variant="body2" color="textSecondary">Total Tickets</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                    <Typography variant="h4" color="error">{stats.open}</Typography>
                    <Typography variant="body2">Open</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                    <Typography variant="h4" color="warning.dark">{stats.inProgress}</Typography>
                    <Typography variant="body2">In Progress</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                    <Typography variant="h4" color="success.dark">{stats.resolved}</Typography>
                    <Typography variant="body2">Resolved</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{stats.avgResponseTime}h</Typography>
                    <Typography variant="body2" color="textSecondary">Avg Response Time</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4">{stats.satisfaction}%</Typography>
                    <Typography variant="body2" color="textSecondary">Satisfaction Rate</Typography>
                </Paper>
            </Grid>
        </Grid>
    );
};

// Helper functions
const calculateAverageResponseTime = (tickets) => {
    const respondedTickets = tickets.filter(ticket => 
        ticket.updates && ticket.updates.length > 0
    );
    
    if (respondedTickets.length === 0) return 0;

    const totalResponseTime = respondedTickets.reduce((sum, ticket) => {
        const createdAt = ticket.createdAt instanceof Date ? ticket.createdAt : ticket.createdAt.toDate();
        const firstResponse = ticket.updates[0].timestamp instanceof Date ? 
            ticket.updates[0].timestamp : 
            ticket.updates[0].timestamp.toDate();
        return sum + (firstResponse - createdAt) / (1000 * 60 * 60); // Convert to hours
    }, 0);

    return Math.round(totalResponseTime / respondedTickets.length);
};

const calculateSatisfactionRate = (tickets) => {
    const resolvedTickets = tickets.filter(ticket => 
        ticket.status === 'resolved' && ticket.satisfaction
    );
    
    if (resolvedTickets.length === 0) return 0;

    const totalSatisfaction = resolvedTickets.reduce((sum, ticket) => 
        sum + ticket.satisfaction, 0
    );

    return Math.round((totalSatisfaction / resolvedTickets.length) * 100);
};

const SupportTickets = () => {
    const {
        tickets,
        loading,
        error,
        updateTicketStatus,
        addTicketResponse,
        updateSatisfaction,
        getTicketStats
    } = useSupportTickets(true); // true for admin view
    
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyDialog, setReplyDialog] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [ticketStatus, setTicketStatus] = useState('');
    const [satisfaction, setSatisfaction] = useState(0);
    const theme = useTheme();
    const { user } = useAuth();

    const handleViewTicket = (ticket) => {
        setSelectedTicket(ticket);
        setTicketStatus(ticket.status);
    };

    const handleCloseTicket = () => {
        setSelectedTicket(null);
        setTicketStatus('');
    };

    const handleOpenReply = () => {
        setReplyDialog(true);
    };

    const handleCloseReply = () => {
        setReplyDialog(false);
        setReplyText('');
    };

    const handleSubmitReply = async () => {
        if (!replyText.trim()) return;

        try {
            await addTicketResponse(selectedTicket.id, {
                text: replyText,
                adminId: user.uid,
                adminEmail: user.email,
                timestamp: new Date()
            });
            await updateTicketStatus(selectedTicket.id, ticketStatus);
            if (ticketStatus === 'resolved') {
                await updateSatisfaction(selectedTicket.id, satisfaction);
            }

            handleCloseReply();
            setSatisfaction(0);
        } catch (error) {
            console.error('Error updating ticket:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Support Tickets</Typography>
            
            {/* Add Stats Component */}
            <TicketStats tickets={tickets} />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                                <TableCell>{ticket.id.slice(0, 8)}...</TableCell>
                                <TableCell>{ticket.subject}</TableCell>
                                <TableCell>{ticket.userEmail}</TableCell>
                                <TableCell>{ticket.category}</TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        color={priorityColors[ticket.priority]}
                                        label={ticket.priority}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        size="small"
                                        color={statusColors[ticket.status]}
                                        label={ticket.status}
                                    />
                                </TableCell>
                                <TableCell>
                                    {ticket.createdAt?.toLocaleString() || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                    <Tooltip title="View Details">
                                        <IconButton size="small" onClick={() => handleViewTicket(ticket)}>
                                            <VisibilityIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Ticket Details Dialog */}
            <Dialog
                open={Boolean(selectedTicket)}
                onClose={handleCloseTicket}
                maxWidth="md"
                fullWidth
            >
                {selectedTicket && (
                    <>
                        <DialogTitle>
                            Ticket Details
                            <IconButton
                                aria-label="close"
                                onClick={handleCloseTicket}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Subject
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {selectedTicket.subject}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Category
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {selectedTicket.category}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Description
                                    </Typography>
                                    <Typography variant="body1" paragraph>
                                        {selectedTicket.description}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Update Status
                                    </Typography>
                                    <TextField
                                        select
                                        fullWidth
                                        value={ticketStatus}
                                        onChange={(e) => setTicketStatus(e.target.value)}
                                        size="small"
                                        margin="dense"
                                    >
                                        <MenuItem value="open">Open</MenuItem>
                                        <MenuItem value="in-progress">In Progress</MenuItem>
                                        <MenuItem value="resolved">Resolved</MenuItem>
                                        <MenuItem value="closed">Closed</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Updates History
                                    </Typography>
                                    {selectedTicket.updates?.map((update, index) => (
                                        <Paper key={index} sx={{ p: 2, mt: 1, bgcolor: theme.palette.background.default }}>
                                            <Typography variant="body2" color="textSecondary">
                                                {update.adminEmail} - {update.timestamp?.toDate()?.toLocaleString()}
                                            </Typography>
                                            <Typography variant="body1">
                                                {update.text}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseTicket}>Close</Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<ReplyIcon />}
                                onClick={handleOpenReply}
                            >
                                Reply
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Reply Dialog */}
            <Dialog
                open={replyDialog}
                onClose={handleCloseReply}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Reply to Ticket</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                        placeholder="Type your response..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        margin="dense"
                    />
                    {ticketStatus === 'resolved' && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Rate User Satisfaction (Optional)
                            </Typography>
                            <Rating
                                value={satisfaction}
                                onChange={(event, newValue) => {
                                    setSatisfaction(newValue);
                                }}
                                icon={<SatisfiedIcon fontSize="inherit" />}
                                emptyIcon={<SatisfiedIcon fontSize="inherit" />}
                                max={5}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReply}>Cancel</Button>
                    <Button onClick={handleSubmitReply} variant="contained" color="primary">
                        Send Reply
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SupportTickets;