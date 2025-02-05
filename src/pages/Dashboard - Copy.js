// src/pages/Dashboard.js

import React, { useState, useEffect, useContext } from 'react';
import {
    Container,
    Typography,
    Grid,
    Box,
    Button,
    useTheme,
    useMediaQuery,
    Card,
    CardContent,
    CardActions,
    Avatar,
    Tooltip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    CircularProgress,
    Skeleton,
    SwipeableDrawer,
    IconButton,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    EmojiEmotions as EmojiEmotionsIcon,
    Chat as ChatIcon,
    Assignment as AssignmentIcon,
    Insights as InsightsIcon,
    Home as HomeIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    Bedtime as BedtimeIcon,
    Lightbulb as LightbulbIcon,
    Menu as MenuIcon,
    Close as CloseIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { MoodContext } from '../contexts/MoodContext';
import { ActivityContext } from '../contexts/ActivityContext';
import { AuthContext } from '../contexts/AuthContext';
import { SleepContext } from '../contexts/SleepContext';
import { ChatContext } from '../contexts/ChatContext';
import PageLayout from '../components/PageLayout'; // Import PageLayout

// 1. Enhanced Styled Components with Hover Improvements (unchanged)
const GradientButton = styled(Button)(({ theme }) => ({
    background: `linear-gradient(45deg, ${theme.palette.primary.light} 30%, ${theme.palette.primary.main} 90%)`,
    color: theme.palette.primary.contrastText,
    borderRadius: '12px',
    padding: '10px 22px',
    boxShadow: theme.shadows[4],
    transition: 'background 0.4s ease-out, box-shadow 0.3s ease-out, transform 0.3s ease-out',
    '&:hover': {
        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
        boxShadow: theme.shadows[7],
        transform: 'scale(1.05)',
    },
}));

const SubtleButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    borderRadius: '12px',
    padding: '8px 16px',
    transition: 'background-color 0.3s ease-out, color 0.3s ease-out, transform 0.2s ease-out',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
        transform: 'scale(1.03)',
    },
}));

const Sidebar = styled(motion.aside, { shouldForwardProp: (prop) => prop !== 'isMobile' && prop !== 'isExpanded' })(({ theme, isMobile, isExpanded }) => ({
    width: isExpanded ? 260 : 80, // Adjusted width based on expanded state
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(isExpanded ? 3 : 1), // Adjusted padding
    paddingRight: theme.spacing(isExpanded ? 3 : 1), // Adjusted padding
    display: 'flex',
    flexDirection: 'column',
    height: '100%', // Take 100% height of parent flex container's content area
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create('width', { // Smooth transition for width change
        easing: theme.transitions.easing.easeInOut, // Use easeInOut for smoother animation
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden', // Prevent horizontal scrollbar when collapsed

    ...(isMobile
        ? {
            width: 'auto',
            height: '100%',
            borderRight: 'none',
            boxShadow: theme.shadows[4],
        }
        : {
            position: 'fixed', // KEEP position fixed for desktop sidebar
            left: 0,
            top: 0,
            boxShadow: theme.shadows[4],
            borderTopRightRadius: theme.shape.borderRadius * 2,
            borderBottomRightRadius: theme.shape.borderRadius * 2,
            height: '100%', // Ensure desktop sidebar still respects 100% of parent's height content area
            overflowY: 'auto',
        }),
}));

const SidebarHeader = styled(Box, { shouldForwardProp: (prop) => prop !== 'isExpanded' })(({ theme, isExpanded }) => ({
    paddingBottom: theme.spacing(3),
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...(isExpanded ? {} : { alignItems: 'center' }) // Center items when collapsed
}));

const SidebarNavList = styled(List)(({ theme }) => ({
    paddingTop: theme.spacing(2),
}));

const SidebarFooter = styled(Box, { shouldForwardProp: (prop) => prop !== 'isExpanded' })(({ theme, isExpanded }) => ({
    marginTop: 'auto',
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(2),
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...(isExpanded ? {} : { alignItems: 'center' }) // Center items when collapsed
}));

const MainContent = styled(motion.main, { shouldForwardProp: (prop) => prop !== 'isMobile' && prop !== 'isExpanded' })(
    ({ theme, isMobile, isExpanded }) => ({
        flexGrow: 1, // Take remaining space
        padding: theme.spacing(4),
        paddingTop: theme.spacing(isMobile ? 2 : 8),
        marginLeft: isMobile ? 0 : (isExpanded ? 260 : 80), // Adjusted marginLeft based on expanded state
        backgroundColor: theme.palette.background.gradient,
        transition: theme.transitions.create(['margin-left', 'padding-top'], {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.easeOut,
        }),
        display: 'flex',
        flexDirection: 'column', // Stack content within MainContent vertically
        minHeight: '100%', // Ensure MainContent takes at least 100% height of flex parent
        flex: 1, // Add flex: 1 to make MainContent take up remaining vertical space
    })
);

const HeroSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(6),
    padding: theme.spacing(3),
    borderRadius: '28px',
    background: theme.palette.background.paper,
    boxShadow: theme.shadows[3],
    backdropFilter: 'blur(8px)',
    textAlign: 'center',
}));

const HeroQuote = styled(Typography)(({ theme }) => ({
    fontStyle: 'italic',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
}));

const WidgetCard = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(4),
    borderRadius: '28px',
    boxShadow: theme.shadows[3],
    overflow: 'hidden',
    transition: 'box-shadow 0.3s ease-out, transform 0.3s ease-out',
    '&:hover': {
        boxShadow: theme.shadows[8],
        transform: 'translateY(-9px)',
    },
}));

const WidgetTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    color: theme.palette.text.primary,
    padding: theme.spacing(2.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
}));

const WidgetContent = styled(CardContent)(({ theme }) => ({
    padding: theme.spacing(3),
    height: 280,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    '&:last-child': {
        paddingBottom: theme.spacing(3),
    },
}));

const AvatarIcon = styled(Avatar, { shouldForwardProp: (prop) => prop !== 'isExpanded' })(({ theme, isExpanded }) => ({
    backgroundColor: theme.palette.secondary.light,
    color: theme.palette.secondary.contrastText,
    width: isExpanded ? 60 : 40, // Adjusted avatar size
    height: isExpanded ? 60 : 40, // Adjusted avatar size
    margin: '0 auto',
    marginBottom: 1,
    boxShadow: theme.shadows[3],
    transition: theme.transitions.create(['width', 'height'], { // Smooth transition for size change
        easing: theme.transitions.easing.easeInOut, // Use easeInOut for smoother animation
        duration: theme.transitions.duration.enteringScreen,
    }),
}));

const AnimatedListItemIcon = styled(ListItemIcon)(({ theme }) => ({
    minWidth: 'auto', // Override MUI default minWidth
    justifyContent: 'center', // Center the icon horizontally
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
        transform: 'scale(1.1)',
    },
}));

// Custom Scrollable Box (unchanged)
const ChatListScrollableBox = styled(Box)(({ theme }) => ({
    maxHeight: '160px',
    overflowY: 'auto',
    pr: 1,
    paddingRight: theme.spacing(0.5),

    transition: 'padding-right 0.3s ease-out',

    '&::-webkit-scrollbar': {
        width: '8px',
    },
    '&::-webkit-scrollbar-track': {
        background: theme.palette.background.paper,
        borderRadius: '12px',
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.primary.main,
        borderRadius: '12px',
        border: `2px solid ${theme.palette.background.paper}`,
    },
    '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: theme.palette.primary.dark,
    },

    paddingRight: theme.spacing(0),
    '&::-webkit-scrollbar-track': {
        opacity: 0,
    },
    '&::-webkit-scrollbar-thumb': {
        opacity: 0,
    },

    '&.hovered': {
        paddingRight: theme.spacing(0.5),
        '&::-webkit-scrollbar-track': {
            opacity: 1,
        },
        '&::-webkit-scrollbar-thumb': {
            opacity: 1,
        },
    },
}));

// 2. Motion Variants (unchanged - can keep the same for now)
const sidebarVariants = {
    hidden: (isMobile) => ({
        x: isMobile ? -300 : -80, // Adjusted for collapsed sidebar width
        opacity: 0,
        transition: { duration: 0.4, type: 'tween' },
    }),
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.6, type: 'spring', damping: 20, stiffness: 100 }, // Slightly increased duration
    },
    exit: (isMobile) => ({
        x: isMobile ? -300 : -80, // Adjusted for collapsed sidebar width
        opacity: 0,
        transition: { duration: 0.4, type: 'tween' },
    }),
};

const mainContentVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.7 } },
};

const widgetVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.8,
            delayChildren: 0.2,
            staggerChildren: 0.08,
            type: 'spring',
            damping: 20,
            stiffness: 100,
        },
    },
};

const widgetItemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            type: 'spring',
            damping: 18,
            stiffness: 90,
        },
    },
};

// Helper Functions for Timestamp Handling
const getTimestampValue = (timestamp) => {
    if (!timestamp) return 0;
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().getTime();
    } else if (timestamp instanceof Date) {
        return timestamp.getTime();
    } else if (typeof timestamp === 'number') {
        return timestamp;
    } else if (typeof timestamp === 'string') {
        return new Date(timestamp).getTime();
    } else {
        console.warn("Unknown timestamp format:", timestamp);
        return 0;
    }
};

const getDateFromTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    } else if (timestamp instanceof Date) {
        return timestamp;
    } else if (typeof timestamp === 'number') {
        return new Date(timestamp);
    } else if (typeof timestamp === 'string') {
        return new Date(timestamp);
    } else {
        console.warn("Unknown timestamp format:", timestamp);
        return null;
    }
};

const formatDateToRelativeTime = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return 'Invalid Date';

    const now = new Date();
    const diffInMilliseconds = now - date;
    const diffInMinutes = Math.round(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.round(diffInMinutes / 60);
    const diffInDays = Math.round(diffInHours / 24);

    if (diffInMinutes < 1) {
        return 'Just now';
    } else if (diffInMinutes < 60) {
        return `${Math.abs(diffInMinutes)} mins ago`;
    } else if (diffInHours < 24) {
        return `${Math.abs(diffInHours)} hours ago`;
    } else if (diffInDays < 7) {
        return `${Math.abs(diffInDays)} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
};

// 4. DashboardPage Component
const DashboardPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user, logout } = useContext(AuthContext);
    const { moodEntries, loading: moodLoading } = useContext(MoodContext);
    const { activities, loading: activityLoading } = useContext(ActivityContext);
    const { sleepLogs, loading: sleepLoading } = useContext(SleepContext);
    const { messages: chatMessages, loading: chatLoading } = useContext(ChatContext);

    // --- MOVE handleLogout DEFINITION HERE, BEFORE utilityActions ---
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };
    // --- handleLogout is now defined before it's used in utilityActions ---

    const navigationActions = [
        {
            text: 'Home',
            icon: <HomeIcon />,
            path: '/',
        },
        {
            text: 'Mood Tracker',
            icon: <EmojiEmotionsIcon />,
            path: '/mood-tracker',
        },
        {
            text: 'AI Chat',
            icon: <ChatIcon />,
            path: '/chat',
        },
        {
            text: 'Activity Logging',
            icon: <AssignmentIcon />,
            path: '/activity-logging',
        },
        {
            text: 'Sleep Monitor',
            icon: <BedtimeIcon />,
            path: '/sleep-tracker',
        },
        {
            text: 'Insights',
            icon: <InsightsIcon />,
            path: '/insights',
        },
    ];

    // --- utilityActions is declared AFTER handleLogout ---
    const utilityActions = [
        {
            text: 'Settings',
            icon: <SettingsIcon />,
            action: () => alert('Settings clicked'), // Replace with actual settings navigation
        },
        {
            text: 'Logout',
            icon: <LogoutIcon />,
            action: handleLogout, // Now handleLogout is initialized when used here
        },
    ];

    const [userName, setUserName] = useState('');
    const [userAvatarUrl, setUserAvatarUrl] = useState('');
    const [moodSummary, setMoodSummary] = useState('');
    const [moodChartData, setMoodChartData] = useState([]);
    const [latestChatsPreview, setLatestChatsPreview] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [insightHighlight, setInsightHighlight] = useState('');
    const [sleepInsight, setSleepInsight] = useState('');
    const [isChatListHovered, setIsChatListHovered] = useState(false);
    const [loadingHero, setLoadingHero] = useState(true);
    const [loadingInsight, setLoadingInsight] = useState(true);
    const [loadingSleepInsight, setLoadingSleepInsight] = useState(true);
    const [heroQuote, setHeroQuote] = useState('');
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isSidebarExpanded, setSidebarExpanded] = useState(false); // State for sidebar expansion

    const dailyQuotes = [
        "The journey of a thousand miles begins with a single step.",
        "Happiness is not by chance, but by choice.",
        "Believe you can and you're halfway there.",
        "The mind is everything. What you think you become.",
        "Small steps forward are still steps forward.",
    ];

    useEffect(() => {
        if (user) {
            setUserName(user.displayName || "User");
            setUserAvatarUrl(user.photoURL || "https://source.unsplash.com/random/50x50?sig=avatar");
            setLoadingHero(false);
        }
        // Set a random quote on initial load
        setHeroQuote(dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)]);
    }, [user]);

    useEffect(() => {
        if (!moodLoading && moodEntries) {
            if (moodEntries.length > 0) {
                const latestMoodEntry = moodEntries[moodEntries.length - 1];
                const latestMood = parseFloat(latestMoodEntry.mood); // Ensure it's a number
                setMoodSummary(getMoodSummaryText(latestMood));
                const chartData = processMoodDataForChart(moodEntries);
                setMoodChartData(chartData);
            } else {
                setMoodSummary("No mood entries yet. Log your mood to track your well-being.");
                setMoodChartData([]);
            }
        }
    }, [moodLoading, moodEntries]);

    useEffect(() => {
        if (!activityLoading && activities) {
            const recentActivitiesData = activities
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 3)
                .map((activity) => ({
                    text: activity.title,
                    time: formatDateToRelativeTime(new Date(activity.date)),
                }));
            setRecentActivities(recentActivitiesData);
            if (activities.length === 0) {
                setRecentActivities([{ text: 'No activities logged yet. Start logging your daily activities!', time: '' }]);
            }
        } else if (!activityLoading) {
            setRecentActivities([{ text: 'No activities logged yet. Start logging your daily activities!', time: '' }]);
        }
    }, [activityLoading, activities]);

    useEffect(() => {
        if (!chatLoading && chatMessages) {
            // console.log("Chat Messages:", chatMessages); // Uncomment for debugging
            const chatPreviewData = chatMessages
                .sort((a, b) => getTimestampValue(b.timestamp) - getTimestampValue(a.timestamp))
                .slice(0, 5)
                .map((message) => {
                    // console.log("Processing Message:", message); // Uncomment for debugging
                    // console.log("Timestamp Type:", typeof message.timestamp, message.timestamp); // Uncomment for debugging
                    const date = getDateFromTimestamp(message.timestamp);
                    return {
                        text: message.text,
                        time: date ? formatDateToRelativeTime(date) : 'Unknown time',
                    };
                });
            setLatestChatsPreview(chatPreviewData);
            if (chatMessages.length === 0) {
                setLatestChatsPreview([{ text: 'No chat messages yet. Start a conversation!', time: '' }]);
            }
        } else if (!chatLoading) {
            setLatestChatsPreview([{ text: 'No chat messages yet. Start a conversation!', time: '' }]);
        }
    }, [chatLoading, chatMessages]);

    useEffect(() => {
        if (
            moodSummary.includes("Extremely Positive") ||
            moodSummary.includes("Positive and Energetic")
        ) {
            setInsightHighlight(
                "Your mood trend is looking fantastic! 🎉 Keep up the great work and continue focusing on your well-being."
            );
        } else if (moodSummary.includes("Balanced and Content")) {
            setInsightHighlight("You're maintaining a steady mood. 🌟 Keep balancing your activities and self-care.");
        } else if (
            moodSummary.includes("Feeling a Bit Low") ||
            moodSummary.includes("Quite Low")
        ) {
            setInsightHighlight(
                "It's okay to have down days. 💙 Consider exploring some self-care activities and remember we're here to support you."
            );
        } else {
            setInsightHighlight("Let's check in with your mood and activities to bring you personalized insights.");
        }
        setLoadingInsight(false);
    }, [moodSummary]);

    useEffect(() => {
        if (!sleepLoading && sleepLogs) {
            const totalSleepEntries = sleepLogs.length;
            let avgSleepDuration = 0;
            if (totalSleepEntries > 0) {
                const totalDurationMs = sleepLogs.reduce(
                    (sum, log) =>
                        sum + new Date(log.endTime).getTime() - new Date(log.startTime).getTime(),
                    0
                );
                avgSleepDuration = totalDurationMs / totalSleepEntries;
            }

            if (totalSleepEntries > 0) {
                const avgHours = (avgSleepDuration / (1000 * 60 * 60)).toFixed(1);
                setSleepInsight(
                    `Over the last ${totalSleepEntries} entries, you've averaged ${avgHours} hours of sleep per night. Consistent sleep is key!`
                );
            } else {
                setSleepInsight(
                    "No sleep logs recorded yet. Start tracking your sleep to understand your sleep patterns."
                );
            }
            setLoadingSleepInsight(false);
        } else if (!sleepLoading) {
            setSleepInsight(
                "No sleep logs recorded yet. Start tracking your sleep to understand your sleep patterns."
            );
            setLoadingSleepInsight(false);
        }
    }, [sleepLoading, sleepLogs]);

    const getMoodSummaryText = (moodValue) => {
        if (moodValue >= 4.5)
            return "Extremely Positive! 🌟 Keep shining!";
        if (moodValue >= 3.5)
            return "Positive and Energetic! 😊 Great job maintaining your mood.";
        if (moodValue >= 2.5)
            return "Balanced and Content. 🌈 You're maintaining a steady mood.";
        if (moodValue >= 1.5)
            return "Feeling a Bit Low. 🧘‍♂️ Consider taking some time for self-care.";
        return "Quite Low. 💔 It might help to reach out for support or engage in relaxing activities.";
    };

    const processMoodDataForChart = (moodEntries) => {
        const dailyMoodAverages = {};
        moodEntries.forEach((entry) => {
            const entryDate = new Date(entry.timestamp).toLocaleDateString();
            if (!dailyMoodAverages[entryDate]) {
                dailyMoodAverages[entryDate] = { sumMood: 0, count: 0 };
            }
            dailyMoodAverages[entryDate].sumMood += parseFloat(entry.mood);
            dailyMoodAverages[entryDate].count += 1;
        });

        const refinedWeeklyData = [];
        const lastSevenDaysLabels = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString();
            const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
            lastSevenDaysLabels.push(dayLabel);
            if (dailyMoodAverages[dateStr]) {
                refinedWeeklyData.push({
                    name: dayLabel,
                    mood: parseFloat(
                        (dailyMoodAverages[dateStr].sumMood / dailyMoodAverages[dateStr].count).toFixed(1)
                    ),
                });
            } else {
                refinedWeeklyData.push({ name: dayLabel, mood: null });
            }
        }

        return refinedWeeklyData;
    };

    const toggleMobileMenu = (open) => () => {
        setMobileMenuOpen(open);
    };

    const toggleSidebarExpansion = () => {
        setSidebarExpanded(!isSidebarExpanded);
    };

    const sidebarContent = (
        <Sidebar
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            isMobile={isMobile}
            isExpanded={isSidebarExpanded} // Pass isExpanded state
        >
            <SidebarHeader isExpanded={isSidebarExpanded}>
                <AvatarIcon alt={userName} src={userAvatarUrl} isExpanded={isSidebarExpanded} /> {/* Pass isExpanded to AvatarIcon */}
                {isSidebarExpanded && (
                    <Button
                        onClick={() => navigate('/')}
                        variant="text"
                        sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                                backgroundColor: 'transparent',
                            },
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" component="div">
                            MindEase AI
                        </Typography>
                    </Button>
                )}

                {isSidebarExpanded && (
                    <Typography variant="body2" color="textSecondary">
                        Welcome, {userName}
                    </Typography>
                )}
            </SidebarHeader>
            <Divider sx={{ marginBottom: theme.spacing(2) }} />
            <SidebarNavList>
                {navigationActions.map((item, index) => (
                    <Tooltip
                        key={index}
                        title={item.text}
                        placement="right"
                        arrow
                        open={!isSidebarExpanded} // Tooltip only when collapsed
                        disableFocusListener
                        disableHoverListener={isSidebarExpanded} // Disable hover if expanded
                        PopperProps={{
                            disablePortal: true, // Required for Tooltip in fixed sidebar to not be cut off
                        }}
                    >
                        <ListItem
                            button
                            onClick={() => {
                                navigate(item.path);
                            }}
                            selected={item.path === window.location.pathname}
                            sx={{
                                borderRadius: '12px',
                                marginY: '3px',
                                paddingY: 1.2,
                                paddingX: 2,
                                transition: 'background-color 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out',
                                justifyContent: isSidebarExpanded ? 'flex-start' : 'center', // Center icons when collapsed
                                '&:hover': {
                                    backgroundColor: theme.palette.action.hover,
                                    transform: 'scale(1.05)',
                                    boxShadow: theme.shadows[3],
                                },
                                '&.Mui-selected': {
                                    backgroundColor: theme.palette.primary.light,
                                    color: theme.palette.primary.contrastText,
                                    '&:hover': {
                                        backgroundColor: theme.palette.primary.main,
                                    },
                                },
                            }}
                        >
                            <AnimatedListItemIcon sx={{ color: 'inherit', minWidth: isSidebarExpanded ? 'auto' : 36 }}>{item.icon}</AnimatedListItemIcon>
                            {isSidebarExpanded && <ListItemText primary={item.text} />}
                        </ListItem>
                    </Tooltip>
                ))}
            </SidebarNavList>
            <Divider sx={{ marginY: theme.spacing(2) }} />
            <SidebarNavList>
                {utilityActions.map((item, index) => (
                    <Tooltip
                        key={index}
                        title={item.text}
                        placement="right"
                        arrow
                        open={!isSidebarExpanded}
                        disableFocusListener
                        disableHoverListener={isSidebarExpanded}
                        PopperProps={{
                            disablePortal: true, // Required for Tooltip in fixed sidebar to not be cut off
                        }}
                    >
                        <ListItem
                            button
                            onClick={item.action}
                            sx={{
                                borderRadius: '12px',
                                marginY: '3px',
                                paddingY: 1.2,
                                paddingX: 2,
                                transition: 'background-color 0.3s ease-out, transform 0.3s ease-out, box-shadow 0.3s ease-out',
                                justifyContent: isSidebarExpanded ? 'flex-start' : 'center', // Center icons when collapsed
                                '&:hover': {
                                    backgroundColor: theme.palette.action.hover,
                                    transform: 'scale(1.05)',
                                    boxShadow: theme.shadows[3],
                                },
                            }}
                        >
                            <AnimatedListItemIcon sx={{ color: 'inherit', minWidth: isSidebarExpanded ? 'auto' : 36 }}>{item.icon}</AnimatedListItemIcon>
                            {isSidebarExpanded && <ListItemText primary={item.text} />}
                        </ListItem>
                    </Tooltip>
                ))}
            </SidebarNavList>
            <SidebarFooter isExpanded={isSidebarExpanded}>
                {isSidebarExpanded && (
                    <Typography variant="caption" color="textSecondary" align="center" display="block">
                        © {new Date().getFullYear()} MindEase AI
                    </Typography>
                )}
                <IconButton onClick={toggleSidebarExpansion} size="large">
                    {isSidebarExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
            </SidebarFooter>
        </Sidebar>
    );

    return (
        <PageLayout>
            <DashboardContainer
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Mobile Sidebar Drawer */}
                {isMobile && (
                    <>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={toggleMobileMenu(true)}
                            sx={{ position: 'absolute', top: theme.spacing(2), left: theme.spacing(1), zIndex: theme.zIndex.drawer + 2 }}
                        >
                            <MenuIcon style={{ color: theme.palette.text.primary }} />
                        </IconButton>
                        <SwipeableDrawer
                            open={isMobileMenuOpen}
                            onClose={toggleMobileMenu(false)}
                            onOpen={toggleMobileMenu(true)}
                            PaperProps={{ style: { width: 300 } }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center" padding={theme.spacing(2)}>
                                <Typography variant="h6" fontWeight="bold" color="primary">
                                    MindEase AI
                                </Typography>
                                <IconButton onClick={toggleMobileMenu(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                            <Divider />
                            {sidebarContent}
                        </SwipeableDrawer>
                    </>
                )}

                {/* Sidebar Navigation for Desktop */}
                {!isMobile && <AnimatePresence>{sidebarContent}</AnimatePresence>}

                {/* Main Content Area */}
                <MainContent variants={mainContentVariants} isMobile={isMobile} isExpanded={isSidebarExpanded}>
                    <Container maxWidth="lg" sx={{ marginTop: isMobile ? '0px' : '0', paddingBottom: theme.spacing(8) }}> {/* ADD paddingBottom to Container */}
                        {/* Hero Section */}
                        <HeroSection>
                            <motion.div variants={widgetItemVariants}>
                                {loadingHero ? (
                                    <CircularProgress />
                                ) : (
                                    <>
                                        <Typography
                                            variant={isMobile ? 'h4' : 'h3'}
                                            component="h1"
                                            sx={{ fontWeight: 800, color: theme.palette.text.primary, marginBottom: theme.spacing(1) }}
                                        >
                                            Welcome back, {userName},
                                        </Typography>
                                        <HeroQuote variant="subtitle1">"{heroQuote}"</HeroQuote>
                                        <Typography variant="h6" color="textSecondary" sx={{ fontSize: '1.1rem' }}>
                                            Here's your daily overview for a calmer, clearer mind.
                                        </Typography>
                                    </>
                                )}
                            </motion.div>
                        </HeroSection>

                        {/* Widgets Grid */}
                        <motion.div variants={widgetVariants} initial="hidden" animate="visible">
                            <Grid container spacing={3}>
                                {/* Mood Summary Widget */}
                                <Grid item xs={12} sm={6} md={4}> {/* Adjusted Grid Item xs, sm, md values */}
                                    <motion.div variants={widgetItemVariants}>
                                        <WidgetCard>
                                            <WidgetTitle variant="h6">Mood Summary</WidgetTitle>
                                            <WidgetContent>
                                                {moodLoading ? (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                    >
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={120}
                                                            sx={{ borderRadius: '12px', mb: 2 }}
                                                        />
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={140}
                                                            sx={{ borderRadius: '12px' }}
                                                        />
                                                    </Box>
                                                ) : moodEntries && moodEntries.length > 0 ? (
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            color="textSecondary"
                                                            gutterBottom
                                                            sx={{ fontSize: '1rem' }}
                                                        >
                                                            Your mood today is:
                                                        </Typography>
                                                        <Typography
                                                            variant="h5"
                                                            fontWeight="bold"
                                                            sx={{
                                                                color: theme.palette.success.main,
                                                                mb: 1,
                                                                fontSize: '1.2rem',
                                                            }}
                                                        >
                                                            {moodSummary} ({parseFloat(moodEntries[moodEntries.length - 1].mood).toFixed(1)} / 5)
                                                        </Typography>
                                                        <ResponsiveContainer width="100%" height={200}>
                                                            <LineChart data={moodChartData}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="name" />
                                                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                                                                <ChartTooltip />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="mood"
                                                                    stroke={theme.palette.primary.main}
                                                                    strokeWidth={3}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                        <CardActions sx={{ justifyContent: 'flex-end', padding: theme.spacing(2) }}>
                                                            <SubtleButton size="small" onClick={() => navigate('/mood-tracker')}>
                                                                Mood Details
                                                            </SubtleButton>
                                                        </CardActions>
                                                    </>
                                                ) : (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                        textAlign="center"
                                                        px={3}
                                                    >
                                                        <EmojiEmotionsIcon color="action" sx={{ fontSize: 50, mb: 1 }} />
                                                        <Typography variant="body1" color="textSecondary">
                                                            {moodSummary}
                                                        </Typography>
                                                        <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                                                            <SubtleButton size="small" onClick={() => navigate('/mood-tracker')}>
                                                                Log Mood
                                                            </SubtleButton>
                                                        </CardActions>
                                                    </Box>
                                                )}
                                            </WidgetContent>
                                        </WidgetCard>
                                    </motion.div>
                                </Grid>

                                {/* AI Chat Widget */}
                                <Grid item xs={12} sm={6} md={4}> {/* Adjusted Grid Item xs, sm, md values */}
                                    <motion.div variants={widgetItemVariants}>
                                        <WidgetCard>
                                            <WidgetTitle variant="h6">AI Chat</WidgetTitle>
                                            <WidgetContent>
                                                {chatLoading ? (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                    >
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={80}
                                                            sx={{ borderRadius: '12px', mb: 2 }}
                                                        />
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={40}
                                                            sx={{ borderRadius: '12px', mb: 1 }}
                                                        />
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={40}
                                                            sx={{ borderRadius: '12px' }}
                                                        />
                                                    </Box>
                                                ) : latestChatsPreview &&
                                                  latestChatsPreview.length > 0 &&
                                                  !(latestChatsPreview.length === 1 &&
                                                      latestChatsPreview[0].text.includes('No chat messages yet')) ? (
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            color="textSecondary"
                                                            gutterBottom
                                                            sx={{ fontSize: '1rem' }}
                                                        >
                                                            Recent chats:
                                                        </Typography>
                                                        <ChatListScrollableBox
                                                            onMouseEnter={() => setIsChatListHovered(true)}
                                                            onMouseLeave={() => setIsChatListHovered(false)}
                                                            className={isChatListHovered ? 'hovered' : ''}
                                                        >
                                                            <List dense>
                                                                {latestChatsPreview.map((chat, index) =>
                                                                    chat.text !== 'No chat messages yet. Start a conversation!' ? (
                                                                        <ListItem key={index}>
                                                                            <ListItemText
                                                                                primary={chat.text}
                                                                                secondary={chat.time}
                                                                                secondaryTypographyProps={{
                                                                                    variant: 'caption',
                                                                                    style: { fontSize: '0.9rem' },
                                                                                }}
                                                                            />
                                                                        </ListItem>
                                                                    ) : null
                                                                )}
                                                            </List>
                                                        </ChatListScrollableBox>
                                                        <CardActions sx={{ justifyContent: 'space-between', padding: theme.spacing(2) }}>
                                                            <SubtleButton size="small" onClick={() => navigate('/chat')}>
                                                                Continue Chat
                                                            </SubtleButton>
                                                            <GradientButton size="small" onClick={() => navigate('/chat')}>
                                                                New Chat
                                                            </GradientButton>
                                                        </CardActions>
                                                    </>
                                                ) : (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                        textAlign="center"
                                                        px={3}
                                                    >
                                                        <ChatIcon color="action" sx={{ fontSize: 50, mb: 1 }} />
                                                        <Typography variant="body1" color="textSecondary">
                                                            No conversations yet. Ready to explore?
                                                        </Typography>
                                                        <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                                                            <GradientButton size="small" onClick={() => navigate('/chat')}>
                                                                Start Chatting
                                                            </GradientButton>
                                                        </CardActions>
                                                    </Box>
                                                )}
                                            </WidgetContent>
                                        </WidgetCard>
                                    </motion.div>
                                </Grid>

                                {/* Activity Logging Widget */}
                                <Grid item xs={12} sm={6} md={4}> {/* Adjusted Grid Item xs, sm, md values */}
                                    <motion.div variants={widgetItemVariants}>
                                        <WidgetCard>
                                            <WidgetTitle variant="h6">Today's Activities</WidgetTitle>
                                            <WidgetContent>
                                                {activityLoading ? (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                    >
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={120}
                                                            sx={{ borderRadius: '12px', mb: 2 }}
                                                        />
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={40}
                                                            sx={{ borderRadius: '12px' }}
                                                        />
                                                    </Box>
                                                ) : recentActivities &&
                                                  recentActivities.length > 0 &&
                                                  !(recentActivities.length === 1 &&
                                                      recentActivities[0].text.includes('No activities logged yet')) ? (
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            color="textSecondary"
                                                            gutterBottom
                                                            sx={{ fontSize: '1rem' }}
                                                        >
                                                            Logged activities:
                                                        </Typography>
                                                        <List dense>
                                                            {recentActivities.map((activity, index) =>
                                                                activity.text !==
                                                                'No activities logged yet. Start logging your daily activities!' ? (
                                                                    <ListItem key={index}>
                                                                        <ListItemText
                                                                            primary={activity.text}
                                                                            secondary={activity.time}
                                                                            secondaryTypographyProps={{
                                                                                variant: 'caption',
                                                                                style: { fontSize: '0.9rem' },
                                                                            }}
                                                                        />
                                                                    </ListItem>
                                                                ) : null
                                                            )}
                                                        </List>
                                                        <CardActions sx={{ justifyContent: 'flex-end', padding: theme.spacing(2) }}>
                                                            <SubtleButton size="small" onClick={() => navigate('/activity-logging')}>
                                                                All Activities
                                                            </SubtleButton>
                                                        </CardActions>
                                                    </>
                                                ) : (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                        textAlign="center"
                                                        px={3}
                                                    >
                                                        <AssignmentIcon color="action" sx={{ fontSize: 50, mb: 1 }} />
                                                        <Typography variant="body1" color="textSecondary">
                                                            Track your activities to monitor your routines and habits.
                                                        </Typography>
                                                        <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                                                            <SubtleButton size="small" onClick={() => navigate('/activity-logging')}>
                                                                Log Activity
                                                            </SubtleButton>
                                                        </CardActions>
                                                    </Box>
                                                )}
                                            </WidgetContent>
                                        </WidgetCard>
                                    </motion.div>
                                </Grid>

                                {/* Sleep Quality Monitor Widget */}
                                <Grid item xs={12} sm={6} md={4}> {/* Adjusted Grid Item xs, sm, md values */}
                                    <motion.div variants={widgetItemVariants}>
                                        <WidgetCard>
                                            <WidgetTitle variant="h6">Sleep Quality Monitor</WidgetTitle>
                                            <WidgetContent>
                                                {sleepLoading ? (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                    >
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={160}
                                                            sx={{ borderRadius: '12px', mb: 2 }}
                                                        />
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={40}
                                                            sx={{ borderRadius: '12px' }}
                                                        />
                                                    </Box>
                                                ) : sleepLogs && sleepLogs.length > 0 ? (
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            color="textSecondary"
                                                            gutterBottom
                                                            sx={{ fontSize: '1rem' }}
                                                        >
                                                            Sleep insights:
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ mb: 2, fontSize: '1rem' }}>
                                                            {sleepInsight}
                                                        </Typography>

                                                        <CardActions sx={{ justifyContent: 'flex-end', padding: theme.spacing(2) }}>
                                                            <SubtleButton size="small" onClick={() => navigate('/sleep-tracker')}>
                                                                Sleep Details
                                                            </SubtleButton>
                                                        </CardActions>
                                                    </>
                                                ) : (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                        textAlign="center"
                                                        px={3}
                                                    >
                                                        <BedtimeIcon color="action" sx={{ fontSize: 50, mb: 1 }} />
                                                        <Typography variant="body1" color="textSecondary">
                                                            Track your sleep to gain insights into your sleep patterns and improve rest.
                                                        </Typography>
                                                        <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                                                            <SubtleButton size="small" onClick={() => navigate('/sleep-tracker')}>
                                                                Track Sleep
                                                            </SubtleButton>
                                                        </CardActions>
                                                    </Box>
                                                )}
                                            </WidgetContent>
                                        </WidgetCard>
                                    </motion.div>
                                </Grid>

                                {/* Insights Highlight Widget */}
                                <Grid item xs={12}> {/* Keep Insights full width on all screens */}
                                    <motion.div variants={widgetItemVariants}>
                                        <WidgetCard>
                                            <WidgetTitle variant="h6">Daily Insight</WidgetTitle>
                                            <WidgetContent>
                                                {loadingInsight ? (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                    >
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={100}
                                                            sx={{ borderRadius: '12px', mb: 2 }}
                                                        />
                                                        <Skeleton
                                                            variant="rectangular"
                                                            width="100%"
                                                            height={60}
                                                            sx={{ borderRadius: '12px' }}
                                                        />
                                                    </Box>
                                                ) : insightHighlight ? (
                                                    <>
                                                        <Box display="flex" alignItems="center" mb={2}>
                                                            <LightbulbIcon color="secondary" sx={{ mr: 1, fontSize: '2rem' }} />
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight="bold"
                                                                color="secondary"
                                                                sx={{ fontSize: '1.1rem' }}
                                                            >
                                                                {insightHighlight}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '1rem' }}>
                                                            Tap below for more personalized insights and tips to enhance your mental well-being.
                                                        </Typography>
                                                        <CardActions sx={{ justifyContent: 'flex-end', padding: theme.spacing(2) }}>
                                                            <SubtleButton size="small" onClick={() => navigate('/insights')}>
                                                                More Insights
                                                            </SubtleButton>
                                                        </CardActions>
                                                    </>
                                                ) : (
                                                    <Box
                                                        display="flex"
                                                        flexDirection="column"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        height={280}
                                                        textAlign="center"
                                                        px={3}
                                                    >
                                                        <InsightsIcon color="action" sx={{ fontSize: 50, mb: 1 }} />
                                                        <Typography variant="body1" color="textSecondary">
                                                            Insights about your wellbeing will appear here. Track your mood and activities to unlock personalized guidance.
                                                        </Typography>
                                                        <CardActions sx={{ justifyContent: 'center', mt: 2 }}>
                                                            <SubtleButton size="small" onClick={() => navigate('/insights')}>
                                                                Go to Insights
                                                            </SubtleButton>
                                                        </CardActions>
                                                    </Box>
                                                )}
                                            </WidgetContent>
                                        </WidgetCard>
                                    </motion.div>
                                </Grid>
                            </Grid>
                        </motion.div>
                    </Container>
                </MainContent>
            </DashboardContainer>
        </PageLayout>
    );
};

// Styled DashboardContainer to remove conflicting styles
const DashboardContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row', // Change to row to align Sidebar and MainContent side by side
    width: '100%',
    height: '100%',
}));

export default DashboardPage;