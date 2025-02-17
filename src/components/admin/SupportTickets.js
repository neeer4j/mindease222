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
    useTheme,
    Fade,
    InputAdornment,
    Card,
    CardContent,
    Divider,
    Stack,
    TablePagination,
    LinearProgress,
    styled
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Visibility as VisibilityIcon,
    Close as CloseIcon,
    Reply as ReplyIcon,
    Search as SearchIcon,
    FilterList as FilterListIcon,
    AccessTime as AccessTimeIcon,
    Category as CategoryIcon,
    Flag as FlagIcon
} from '@mui/icons-material';
import Rating from '@mui/material/Rating';
import { SentimentSatisfiedAlt as SatisfiedIcon } from '@mui/icons-material';
import useSupportTickets from '../../hooks/useSupportTickets';
import { useAuth } from '../../contexts/AuthContext';

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 'bold',
    backgroundColor: theme.palette.background.default,
}));

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4],
    },
}));

const StatValue = styled(Typography)(({ theme }) => ({
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
}));

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
        <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
                { label: 'Total Tickets', value: stats.total, color: 'primary', icon: <CategoryIcon /> },
                { label: 'Open', value: stats.open, color: 'error', icon: <ErrorIcon /> },
                { label: 'In Progress', value: stats.inProgress, color: 'warning', icon: <AccessTimeIcon /> },
                { label: 'Resolved', value: stats.resolved, color: 'success', icon: <CheckCircleIcon /> },
                { label: 'Avg Response', value: `${stats.avgResponseTime}h`, color: 'info', icon: <AccessTimeIcon /> },
                { label: 'Satisfaction', value: `${stats.satisfaction}%`, color: 'secondary', icon: <SatisfiedIcon /> },
            ].map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                    <StyledCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ color: `${stat.color}.main`, mr: 1 }}>
                                    {stat.icon}
                                </Box>
                                <Typography color="textSecondary" variant="subtitle2">
                                    {stat.label}
                                </Typography>
                            </Box>
                            <StatValue color={stat.color}>
                                {stat.value}
                            </StatValue>
                            <LinearProgress 
                                variant="determinate" 
                                value={(stat.value / Math.max(...Object.values(stats))) * 100}
                                color={stat.color}
                                sx={{ height: 4, borderRadius: 2 }}
                            />
                        </CardContent>
                    </StyledCard>
                </Grid>
            ))}
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

const TicketDetailsDialog = ({ ticket, open, onClose, onReply, onStatusChange, currentStatus }) => {
    const theme = useTheme();
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            TransitionComponent={Fade}
            transitionDuration={300}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Box>
                    <Typography variant="h6">Ticket #{ticket?.id.slice(0, 8)}</Typography>
                    <Typography variant="caption" color="textSecondary">
                        Created on {ticket?.createdAt?.toLocaleString()}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Card variant="outlined" sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {ticket?.subject}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {ticket?.description}
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Chip 
                                        icon={<CategoryIcon />}
                                        label={ticket?.category}
                                        size="small"
                                    />
                                    <Chip 
                                        icon={<FlagIcon />}
                                        label={ticket?.priority}
                                        color={priorityColors[ticket?.priority]}
                                        size="small"
                                    />
                                </Stack>
                            </CardContent>
                        </Card>

                        <Typography variant="h6" gutterBottom>
                            Conversation History
                        </Typography>
                        <Stack spacing={2}>
                            {ticket?.updates?.map((update, index) => (
                                <Paper 
                                    key={index} 
                                    sx={{ 
                                        p: 2,
                                        bgcolor: update.adminId ? theme.palette.primary.light : theme.palette.background.default,
                                        color: update.adminId ? theme.palette.primary.contrastText : 'inherit'
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2">
                                            {update.adminEmail || ticket?.userEmail}
                                        </Typography>
                                        <Typography variant="caption">
                                            {update.timestamp?.toDate()?.toLocaleString()}
                                        </Typography>
                                    </Stack>
                                    <Typography variant="body1">
                                        {update.text}
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card variant="outlined" sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="subtitle2" gutterBottom>
                                    Ticket Status
                                </Typography>
                                <TextField
                                    select
                                    fullWidth
                                    value={currentStatus}
                                    onChange={(e) => onStatusChange(e.target.value)}
                                    size="small"
                                    margin="dense"
                                    variant="outlined"
                                >
                                    <MenuItem value="open">Open</MenuItem>
                                    <MenuItem value="in-progress">In Progress</MenuItem>
                                    <MenuItem value="resolved">Resolved</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                </TextField>

                                {ticket?.satisfaction && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            User Satisfaction
                                        </Typography>
                                        <Rating
                                            value={ticket.satisfaction}
                                            readOnly
                                            icon={<SatisfiedIcon color="success" />}
                                            emptyIcon={<SatisfiedIcon />}
                                        />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<ReplyIcon />}
                            onClick={onReply}
                            sx={{ mb: 2 }}
                        >
                            Reply to Ticket
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

const ReplyDialog = ({ open, onClose, onSubmit, ticket, currentStatus }) => {
    const [replyText, setReplyText] = useState('');
    const [satisfaction, setSatisfaction] = useState(0);
    const theme = useTheme();

    const handleSubmit = () => {
        onSubmit(replyText, satisfaction);
        setReplyText('');
        setSatisfaction(0);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            TransitionComponent={Fade}
            transitionDuration={300}
        >
            <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                Reply to Ticket #{ticket?.id.slice(0, 8)}
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <TextField
                        autoFocus
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                        placeholder="Type your response..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        InputProps={{
                            sx: { 
                                bgcolor: theme.palette.background.default,
                                '&:hover': {
                                    bgcolor: theme.palette.action.hover
                                }
                            }
                        }}
                    />
                    
                    {currentStatus === 'resolved' && (
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: theme.palette.background.default,
                            borderRadius: 1
                        }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Rate User Satisfaction
                            </Typography>
                            <Rating
                                value={satisfaction}
                                onChange={(event, newValue) => {
                                    setSatisfaction(newValue);
                                }}
                                icon={<SatisfiedIcon fontSize="large" />}
                                emptyIcon={<SatisfiedIcon fontSize="large" />}
                                max={5}
                                sx={{
                                    '& .MuiRating-iconFilled': {
                                        color: theme.palette.success.main
                                    }
                                }}
                            />
                            <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                                Optional: Rate the user's satisfaction with the resolution
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: theme.palette.background.default }}>
                <Button 
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained" 
                    color="primary"
                    disabled={!replyText.trim()}
                    startIcon={<ReplyIcon />}
                >
                    Send Reply
                </Button>
            </DialogActions>
        </Dialog>
    );
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
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

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

    const handleSubmitReply = async (replyText, satisfaction) => {
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
            <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
                Support Tickets Management
            </Typography>
            
            <TicketStats tickets={tickets} />

            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        select
                        size="small"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        sx={{ minWidth: 150 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FilterListIcon />
                                </InputAdornment>
                            ),
                        }}
                    >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                    </TextField>
                </Stack>

                <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow>
                                <StyledTableCell>ID</StyledTableCell>
                                <StyledTableCell>Subject</StyledTableCell>
                                <StyledTableCell>User</StyledTableCell>
                                <StyledTableCell>Category</StyledTableCell>
                                <StyledTableCell>Priority</StyledTableCell>
                                <StyledTableCell>Status</StyledTableCell>
                                <StyledTableCell>Created</StyledTableCell>
                                <StyledTableCell align="right">Actions</StyledTableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTickets
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((ticket) => (
                                <TableRow 
                                    key={ticket.id}
                                    hover
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell>{ticket.id.slice(0, 8)}</TableCell>
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
                                    <TableCell align="right">
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
                
                <TablePagination
                    component="div"
                    count={filteredTickets.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {selectedTicket && (
                <TicketDetailsDialog
                    ticket={selectedTicket}
                    open={Boolean(selectedTicket)}
                    onClose={handleCloseTicket}
                    onReply={handleOpenReply}
                    onStatusChange={(newStatus) => setTicketStatus(newStatus)}
                    currentStatus={ticketStatus}
                />
            )}

            <ReplyDialog
                open={replyDialog}
                onClose={handleCloseReply}
                onSubmit={handleSubmitReply}
                ticket={selectedTicket}
                currentStatus={ticketStatus}
            />
        </Box>
    );
};

export default SupportTickets;