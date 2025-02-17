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
    Chip
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
    Cell
} from 'recharts';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { generateSupportAnalytics } from '../../utils/supportAnalytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Support & Moderation Analytics</Typography>
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
                {/* Support Tickets Analytics */}
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Support Tickets</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Total Tickets</Typography>
                                    <Typography variant="h4">{supportAnalytics?.totalTickets || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Avg Response Time</Typography>
                                    <Typography variant="h4">{supportAnalytics?.avgResponseTime || 0}h</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Satisfaction Rate</Typography>
                                    <Typography variant="h4">{supportAnalytics?.satisfactionRate || 0}%</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Resolution Rate</Typography>
                                    <Typography variant="h4">{supportAnalytics?.resolutionRate || 0}%</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Ticket Categories */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>Ticket Categories</Typography>
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
                                    label
                                >
                                    {Object.entries(supportAnalytics?.categoryBreakdown || {}).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Ticket Trends */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>Ticket Trends</Typography>
                        <ResponsiveContainer>
                            <LineChart
                                data={Object.entries(supportAnalytics?.ticketTrends || {}).map(([date, count]) => ({
                                    date,
                                    count
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke={theme.palette.primary.main} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Chat Abuse Analytics */}
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Chat Abuse Monitoring</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Total Flagged Messages</Typography>
                                    <Typography variant="h4">{abuseAnalytics?.totalFlagged || 0}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Avg Moderation Time</Typography>
                                    <Typography variant="h4">{abuseAnalytics?.moderationSpeed || 0}min</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>Repeat Offenders</Typography>
                                    <Typography variant="h4">
                                        {abuseAnalytics?.repeatOffenders?.length || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Abuse Types */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>Abuse Types Distribution</Typography>
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
                                    label
                                >
                                    {Object.entries(abuseAnalytics?.abuseTypes || {}).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Time of Day Analysis */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>Abuse by Time of Day</Typography>
                        <ResponsiveContainer>
                            <LineChart
                                data={Object.entries(abuseAnalytics?.timeOfDayAnalysis || {}).map(([hour, count]) => ({
                                    hour: `${hour}:00`,
                                    count
                                }))}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke={theme.palette.error.main} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminAnalytics;