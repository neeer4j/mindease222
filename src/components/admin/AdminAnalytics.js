import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    useTheme,
    Chip,
    alpha
} from '@mui/material';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart
} from 'recharts';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateSupportAnalytics } from '../../utils/supportAnalytics';
import { motion } from 'framer-motion';

// Enhanced color palette with gradients
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
const GRADIENTS = [
    ['#6366f1', '#818cf8'],
    ['#22c55e', '#4ade80'],
    ['#f59e0b', '#fbbf24'],
    ['#ef4444', '#f87171'],
    ['#8b5cf6', '#a78bfa']
];

const AdminAnalytics = () => {
    const [timeRange, setTimeRange] = useState('week');
    const [supportAnalytics, setSupportAnalytics] = useState(null);
    const [abuseAnalytics, setAbuseAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                // Calculate date range
                const now = new Date();
                let startDate = new Date();
                switch (timeRange) {
                    case 'week':
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                    case 'quarter':
                        startDate.setMonth(now.getMonth() - 3);
                        break;
                    default:
                        startDate.setDate(now.getDate() - 7);
                }

                // Fetch chat abuse data
                const abuseRef = collection(db, 'chatAbuse');
                const abuseQuery = query(
                    abuseRef,
                    where('createdAt', '>=', Timestamp.fromDate(startDate)),
                    orderBy('createdAt', 'desc')
                );
                const abuseSnapshot = await getDocs(abuseQuery);
                
                // Process abuse data
                const abuseData = abuseSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Calculate analytics
                const totalFlagged = abuseData.length;
                const abuseTypes = abuseData.reduce((acc, curr) => {
                    curr.categories?.forEach(category => {
                        acc[category] = (acc[category] || 0) + 1;
                    });
                    return acc;
                }, {});

                // Calculate average moderation time
                const moderationTimes = abuseData
                    .filter(item => item.resolvedAt && item.createdAt)
                    .map(item => {
                        const created = item.createdAt.toDate();
                        const resolved = item.resolvedAt.toDate();
                        return (resolved - created) / (1000 * 60); // Convert to minutes
                    });
                const avgModerationTime = moderationTimes.length 
                    ? Math.round(moderationTimes.reduce((a, b) => a + b, 0) / moderationTimes.length)
                    : 0;

                // Group by time of day
                const timeOfDay = abuseData.reduce((acc, curr) => {
                    if (curr.createdAt) {
                        const hour = curr.createdAt.toDate().getHours();
                        acc[hour] = (acc[hour] || 0) + 1;
                    }
                    return acc;
                }, {});

                // Find repeat offenders (users with multiple violations)
                const userViolations = abuseData.reduce((acc, curr) => {
                    if (curr.userId) {
                        acc[curr.userId] = (acc[curr.userId] || 0) + 1;
                    }
                    return acc;
                }, {});
                const repeatOffenders = Object.entries(userViolations)
                    .filter(([_, count]) => count > 1)
                    .map(([userId, count]) => ({ userId, count }));

                setAbuseAnalytics({
                    totalFlagged,
                    abuseTypes,
                    moderationSpeed: avgModerationTime,
                    timeOfDayAnalysis: timeOfDay,
                    repeatOffenders
                });

                // Fetch support analytics
                const support = await generateSupportAnalytics(startDate, now);
                setSupportAnalytics(support);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching analytics:', error);
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeRange]);

    if (loading) {
        return <Box sx={{ p: 3 }}><Typography>Loading analytics...</Typography></Box>;
    }

    // Custom styled components
    const StyledCard = ({ children, gradient }) => (
        <Card
            component={motion.div}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            sx={{
                background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
                color: 'white',
                boxShadow: theme.shadows[10],
                height: '100%'
            }}
        >
            {children}
        </Card>
    );

    const StyledPaper = ({ children }) => (
        <Paper
            component={motion.div}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            sx={{
                p: 3,
                height: '400px',
                background: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.8)
                    : 'white',
                boxShadow: theme.shadows[5],
                borderRadius: 2
            }}
        >
            {children}
        </Paper>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 4
            }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: theme.palette.primary.main }}>
                    Analytics Dashboard
                </Typography>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Time Range</InputLabel>
                    <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        label="Time Range"
                    >
                        <MenuItem value="week">Last 7 Days</MenuItem>
                        <MenuItem value="month">Last 30 Days</MenuItem>
                        <MenuItem value="quarter">Last 90 Days</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={3}>
                {/* Support Tickets Stats */}
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Support Performance</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <StyledCard gradient={GRADIENTS[0]}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Tickets</Typography>
                                    <Typography variant="h3">{supportAnalytics?.totalTickets || 0}</Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StyledCard gradient={GRADIENTS[1]}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Response Time</Typography>
                                    <Typography variant="h3">{supportAnalytics?.avgResponseTime || 0}h</Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StyledCard gradient={GRADIENTS[2]}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Satisfaction</Typography>
                                    <Typography variant="h3">{supportAnalytics?.satisfactionRate || 0}%</Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <StyledCard gradient={GRADIENTS[3]}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Resolution Rate</Typography>
                                    <Typography variant="h3">{supportAnalytics?.resolutionRate || 0}%</Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Charts Section */}
                <Grid item xs={12} md={6}>
                    <StyledPaper>
                        <Typography variant="h6" gutterBottom fontWeight="600">Ticket Categories</Typography>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={Object.entries(supportAnalytics?.categoryBreakdown || {}).map(([name, value]) => ({
                                        name,
                                        value
                                    }))}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {Object.entries(supportAnalytics?.categoryBreakdown || {}).map((_, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} tickets`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </StyledPaper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <StyledPaper>
                        <Typography variant="h6" gutterBottom fontWeight="600">Ticket Trends</Typography>
                        <ResponsiveContainer>
                            <AreaChart
                                data={Object.entries(supportAnalytics?.ticketTrends || {}).map(([date, count]) => ({
                                    date,
                                    count
                                }))}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke={theme.palette.text.secondary}
                                    tick={{ fill: theme.palette.text.secondary }}
                                />
                                <YAxis 
                                    stroke={theme.palette.text.secondary}
                                    tick={{ fill: theme.palette.text.secondary }}
                                />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: theme.palette.background.paper,
                                        border: `1px solid ${theme.palette.divider}`
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke={theme.palette.primary.main}
                                    fillOpacity={1}
                                    fill="url(#trendGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </StyledPaper>
                </Grid>

                {/* Content Moderation Insights */}
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>Content Moderation Insights</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <StyledCard gradient={GRADIENTS[0]}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Flagged Messages</Typography>
                                    <Typography variant="h3">{abuseAnalytics?.totalFlagged || 0}</Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <StyledCard gradient={GRADIENTS[4]}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Moderation Time</Typography>
                                    <Typography variant="h3">{abuseAnalytics?.moderationSpeed || 0}m</Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <StyledCard gradient={GRADIENTS[2]}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Repeat Cases</Typography>
                                    <Typography variant="h3">{abuseAnalytics?.repeatOffenders?.length || 0}</Typography>
                                </CardContent>
                            </StyledCard>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Abuse Type Distribution */}
                <Grid item xs={12} md={6}>
                    <StyledPaper>
                        <Typography variant="h6" gutterBottom fontWeight="600">Abuse Type Distribution</Typography>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={Object.entries(abuseAnalytics?.abuseTypes || {}).map(([name, value]) => ({
                                        name,
                                        value
                                    }))}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={120}
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {Object.entries(abuseAnalytics?.abuseTypes || {}).map((_, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} cases`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </StyledPaper>
                </Grid>

                {/* Activity by Time of Day */}
                <Grid item xs={12} md={6}>
                    <StyledPaper>
                        <Typography variant="h6" gutterBottom fontWeight="600">Activity by Time of Day</Typography>
                        <ResponsiveContainer>
                            <AreaChart
                                data={Object.entries(abuseAnalytics?.timeOfDayAnalysis || {}).map(([hour, count]) => ({
                                    hour: `${hour}:00`,
                                    count
                                }))}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                                <XAxis 
                                    dataKey="hour" 
                                    stroke={theme.palette.text.secondary}
                                    tick={{ fill: theme.palette.text.secondary }}
                                />
                                <YAxis 
                                    stroke={theme.palette.text.secondary}
                                    tick={{ fill: theme.palette.text.secondary }}
                                />
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: theme.palette.background.paper,
                                        border: `1px solid ${theme.palette.divider}`
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke={theme.palette.error.main}
                                    fillOpacity={1}
                                    fill="url(#activityGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </StyledPaper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminAnalytics;