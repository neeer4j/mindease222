import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Grid,
    MenuItem,
    Snackbar,
    Alert,
    useTheme,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Rating,
    List,
    ListItem,
    ListItemText,
    Chip,
    Collapse,
    IconButton,
    Container
} from '@mui/material';
import { motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { SentimentSatisfiedAlt as SatisfiedIcon } from '@mui/icons-material';
import useTicketNotifications from '../hooks/useTicketNotifications';
import { checkTicketRateLimit } from '../utils/ticketRateLimiting';
import PageLayout from '../components/PageLayout';

const ticketCategories = [
    { value: 'technical', label: 'Technical Issue' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'account', label: 'Account Issue' },
    { value: 'other', label: 'Other' }
];

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

const ContactUs = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        subject: '',
        category: '',
        description: '',
        priority: 'medium'
    });
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [satisfactionDialog, setSatisfactionDialog] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [satisfaction, setSatisfaction] = useState(0);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const { notifications, markAsRead } = useTicketNotifications(user?.uid);
    const [rateLimit, setRateLimit] = useState(null);

    useEffect(() => {
        if (!user) return;

        const ticketsRef = collection(db, 'supportTickets');
        const q = query(
            ticketsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            setTickets(ticketData);
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (user) {
            checkTicketRateLimit(user.uid).then(setRateLimit);
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Check rate limits before submission
            const rateLimitCheck = await checkTicketRateLimit(user.uid);
            if (!rateLimitCheck.allowed) {
                setSnackbar({
                    open: true,
                    message: rateLimitCheck.reason,
                    severity: 'warning'
                });
                return;
            }

            // If high priority, check specific limit
            if (formData.priority === 'high' && rateLimitCheck.highPriorityRemaining <= 0) {
                setSnackbar({
                    open: true,
                    message: 'Daily high-priority ticket limit reached. Please submit as normal priority.',
                    severity: 'warning'
                });
                return;
            }

            // Create the ticket with validated data
            const ticketData = {
                subject: formData.subject.trim(),
                category: formData.category,
                description: formData.description.trim(),
                priority: formData.priority,
                userId: user.uid,
                userEmail: user.email,
                status: 'open',
                createdAt: serverTimestamp(),
                updates: [],
                hasUnreadUpdates: false
            };

            // Validate required fields
            if (!ticketData.subject || !ticketData.category || !ticketData.description) {
                throw new Error('Please fill in all required fields');
            }

            const ticketRef = await addDoc(collection(db, 'supportTickets'), ticketData);

            if (!ticketRef.id) {
                throw new Error('Failed to create ticket');
            }

            setFormData({
                subject: '',
                category: '',
                description: '',
                priority: 'medium'
            });

            setSnackbar({
                open: true,
                message: 'Ticket submitted successfully! We will get back to you soon.',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error submitting ticket:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to submit ticket. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExpandTicket = (ticketId) => {
        setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
    };

    const handleOpenSatisfactionDialog = (ticket) => {
        setSelectedTicket(ticket);
        setSatisfaction(ticket.satisfaction || 0);
        setSatisfactionDialog(true);
    };

    const handleSubmitSatisfaction = async () => {
        try {
            const ticketRef = doc(db, 'supportTickets', selectedTicket.id);
            await updateDoc(ticketRef, {
                satisfaction: satisfaction
            });

            setSatisfactionDialog(false);
            setSnackbar({
                open: true,
                message: 'Thank you for your feedback!',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error updating satisfaction:', error);
            setSnackbar({
                open: true,
                message: 'Failed to submit feedback. Please try again.',
                severity: 'error'
            });
        }
    };

    return (
        <PageLayout>
            <Container maxWidth="lg">
                <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{
                        py: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3
                    }}
                >
                    <Typography variant="h4" gutterBottom align="center">
                        Contact Support
                    </Typography>
                    <Typography variant="body1" align="center" color="textSecondary" paragraph>
                        Need help? Submit a ticket and our team will assist you as soon as possible.
                    </Typography>

                    {/* Rate Limit Information */}
                    {rateLimit && rateLimit.allowed && (
                        <Alert severity="info">
                            <Typography variant="body2">
                                Remaining tickets today: {rateLimit.dailyRemaining} | 
                                This hour: {rateLimit.hourlyRemaining} | 
                                High priority today: {rateLimit.highPriorityRemaining}
                            </Typography>
                        </Alert>
                    )}

                    {/* Notification Section */}
                    {notifications.length > 0 && (
                        <Paper elevation={3} sx={{ p: 2, bgcolor: 'primary.light' }}>
                            <Typography variant="h6" gutterBottom color="primary.contrastText">
                                New Updates
                            </Typography>
                            {notifications.map(notification => (
                                <Alert 
                                    key={notification.id}
                                    severity="info"
                                    sx={{ mb: 1 }}
                                    onClose={() => markAsRead(notification.id)}
                                >
                                    New response on ticket: {notification.subject}
                                </Alert>
                            ))}
                        </Paper>
                    )}

                    {/* Ticket History Section */}
                    {tickets.length > 0 && (
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Your Ticket History
                            </Typography>
                            <List>
                                {tickets.map((ticket) => (
                                    <Paper key={ticket.id} sx={{ mb: 2, overflow: 'hidden' }}>
                                        <ListItem
                                            button
                                            onClick={() => handleExpandTicket(ticket.id)}
                                            sx={{ display: 'block' }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <ListItemText
                                                    primary={ticket.subject}
                                                    secondary={`Submitted on ${ticket.createdAt?.toLocaleDateString()}`}
                                                />
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Chip
                                                        size="small"
                                                        color={statusColors[ticket.status]}
                                                        label={ticket.status}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleExpandTicket(ticket.id)}
                                                    >
                                                        {expandedTicket === ticket.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                            <Collapse in={expandedTicket === ticket.id}>
                                                <Box sx={{ mt: 2, pl: 2 }}>
                                                    <Typography variant="body2" color="textSecondary" paragraph>
                                                        {ticket.description}
                                                    </Typography>
                                                    {ticket.updates?.map((update, index) => (
                                                        <Paper key={index} sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                                                            <Typography variant="body2" color="textSecondary">
                                                                Response from {update.adminEmail} - {new Date(update.timestamp?.seconds * 1000).toLocaleString()}
                                                            </Typography>
                                                            <Typography variant="body1">
                                                                {update.text}
                                                            </Typography>
                                                        </Paper>
                                                    ))}
                                                    {ticket.status === 'resolved' && (
                                                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() => handleOpenSatisfactionDialog(ticket)}
                                                            >
                                                                {ticket.satisfaction ? 'Update Satisfaction' : 'Rate Your Experience'}
                                                            </Button>
                                                            {ticket.satisfaction && (
                                                                <Rating
                                                                    value={ticket.satisfaction}
                                                                    readOnly
                                                                    icon={<SatisfiedIcon fontSize="inherit" />}
                                                                    emptyIcon={<SatisfiedIcon fontSize="inherit" />}
                                                                />
                                                            )}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Collapse>
                                        </ListItem>
                                    </Paper>
                                ))}
                            </List>
                        </Paper>
                    )}

                    {/* New Ticket Form */}
                    <Paper elevation={3} sx={{ p: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Submit New Ticket
                        </Typography>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        select
                                        label="Category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        {ticketCategories.map((category) => (
                                            <MenuItem key={category.value} value={category.value}>
                                                {category.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        required
                                        fullWidth
                                        select
                                        label="Priority"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="low">Low</MenuItem>
                                        <MenuItem value="medium">Medium</MenuItem>
                                        <MenuItem value="high">High</MenuItem>
                                    </TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        helperText="Please provide as much detail as possible"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        fullWidth
                                        size="large"
                                        disabled={loading}
                                    >
                                        {loading ? 'Submitting...' : 'Submit Ticket'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>

                    {/* Satisfaction Dialog */}
                    <Dialog open={satisfactionDialog} onClose={() => setSatisfactionDialog(false)}>
                        <DialogTitle>Rate Your Experience</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                                <Typography variant="body1">
                                    How satisfied were you with our support?
                                </Typography>
                                <Rating
                                    value={satisfaction}
                                    onChange={(event, newValue) => {
                                        setSatisfaction(newValue);
                                    }}
                                    icon={<SatisfiedIcon fontSize="large" />}
                                    emptyIcon={<SatisfiedIcon fontSize="large" />}
                                    max={5}
                                    size="large"
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSatisfactionDialog(false)}>Cancel</Button>
                            <Button onClick={handleSubmitSatisfaction} variant="contained" color="primary">
                                Submit Rating
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Snackbar
                        open={snackbar.open}
                        autoHideDuration={6000}
                        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    >
                        <Alert
                            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                            severity={snackbar.severity}
                            sx={{ width: '100%' }}
                        >
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </Box>
            </Container>
        </PageLayout>
    );
};

export default ContactUs;