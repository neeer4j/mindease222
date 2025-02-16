import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';
import { useSystemStats } from '../hooks/useSystemStats';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    backdropFilter: 'blur(10px)',
    borderRadius: theme.spacing(2),
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
        transform: 'translateY(-5px)'
    }
}));

const SystemStatsTab = () => {
    const { stats, loading, error } = useSystemStats();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <StyledCard>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>User Growth Trend</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats.trends.dailyActiveUsers}>
                                <defs>
                                    <linearGradient id="userGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#8884d8" 
                                    fillOpacity={1}
                                    fill="url(#userGrowth)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
                <StyledCard>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Message Activity</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.trends.messageCount}>
                                <defs>
                                    <linearGradient id="messageActivity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#82ca9d"
                                    strokeWidth={2}
                                    dot={{ stroke: '#82ca9d', strokeWidth: 2, r: 4 }}
                                    activeDot={{ stroke: '#82ca9d', strokeWidth: 2, r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
                <StyledCard>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Reported Content</Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.trends.reportedContent}>
                                <defs>
                                    <linearGradient id="reportedContent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff7043" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#ff7043" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#ff7043"
                                    strokeWidth={2}
                                    dot={{ stroke: '#ff7043', strokeWidth: 2, r: 4 }}
                                    activeDot={{ stroke: '#ff7043', strokeWidth: 2, r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </StyledCard>
            </Grid>
        </Grid>
    );
};

export default SystemStatsTab;