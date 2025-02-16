import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const generateSupportAnalytics = async (startDate, endDate) => {
    const ticketsRef = collection(db, 'supportTickets');
    const dateQuery = query(
        ticketsRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
    );

    const ticketsSnapshot = await getDocs(dateQuery);
    const tickets = ticketsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate()
    }));

    return {
        totalTickets: tickets.length,
        avgResponseTime: calculateAverageResponseTime(tickets),
        satisfactionRate: calculateSatisfactionRate(tickets),
        categoryBreakdown: getCategoryBreakdown(tickets),
        resolutionRate: calculateResolutionRate(tickets),
        priorityDistribution: getPriorityDistribution(tickets),
        ticketTrends: generateTicketTrends(tickets)
    };
};

export const generateAbuseAnalytics = async (startDate, endDate) => {
    const messagesRef = collection(db, 'messages');
    const dateQuery = query(
        messagesRef,
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        where('isFlagged', '==', true),
        orderBy('timestamp', 'desc')
    );

    const messagesSnapshot = await getDocs(dateQuery);
    const messages = messagesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate()
    }));

    return {
        totalFlagged: messages.length,
        abuseTypes: getAbuseTypeBreakdown(messages),
        userViolations: getUserViolationsBreakdown(messages),
        moderationSpeed: calculateModerationSpeed(messages),
        repeatOffenders: identifyRepeatOffenders(messages),
        timeOfDayAnalysis: analyzeTimeOfDay(messages)
    };
};

// Helper functions
const calculateAverageResponseTime = (tickets) => {
    const respondedTickets = tickets.filter(t => t.updates && t.updates.length > 0);
    if (!respondedTickets.length) return 0;

    const totalTime = respondedTickets.reduce((sum, ticket) => {
        const firstResponse = ticket.updates[0].timestamp?.toDate();
        return sum + (firstResponse - ticket.createdAt) / (1000 * 60 * 60);
    }, 0);

    return Math.round(totalTime / respondedTickets.length);
};

const calculateSatisfactionRate = (tickets) => {
    const ratedTickets = tickets.filter(t => t.satisfaction);
    if (!ratedTickets.length) return 0;

    const totalSatisfaction = ratedTickets.reduce((sum, t) => sum + t.satisfaction, 0);
    return Math.round((totalSatisfaction / (ratedTickets.length * 5)) * 100);
};

const getCategoryBreakdown = (tickets) => {
    return tickets.reduce((acc, ticket) => {
        acc[ticket.category] = (acc[ticket.category] || 0) + 1;
        return acc;
    }, {});
};

const calculateResolutionRate = (tickets) => {
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    return Math.round((resolved / tickets.length) * 100);
};

const getPriorityDistribution = (tickets) => {
    return tickets.reduce((acc, ticket) => {
        acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
        return acc;
    }, {});
};

const generateTicketTrends = (tickets) => {
    return tickets.reduce((acc, ticket) => {
        const date = ticket.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});
};

const getAbuseTypeBreakdown = (messages) => {
    return messages.reduce((acc, msg) => {
        acc[msg.flagType] = (acc[msg.flagType] || 0) + 1;
        return acc;
    }, {});
};

const getUserViolationsBreakdown = (messages) => {
    return messages.reduce((acc, msg) => {
        acc[msg.userId] = (acc[msg.userId] || 0) + 1;
        return acc;
    }, {});
};

const calculateModerationSpeed = (messages) => {
    const moderatedMessages = messages.filter(m => m.moderatedAt);
    if (!moderatedMessages.length) return 0;

    const totalTime = moderatedMessages.reduce((sum, msg) => {
        return sum + (msg.moderatedAt.toDate() - msg.timestamp) / (1000 * 60);
    }, 0);

    return Math.round(totalTime / moderatedMessages.length);
};

const identifyRepeatOffenders = (messages) => {
    const violations = messages.reduce((acc, msg) => {
        if (!acc[msg.userId]) {
            acc[msg.userId] = {
                count: 0,
                lastViolation: msg.timestamp,
                types: new Set()
            };
        }
        acc[msg.userId].count++;
        acc[msg.userId].types.add(msg.flagType);
        return acc;
    }, {});

    return Object.entries(violations)
        .filter(([_, data]) => data.count > 1)
        .map(([userId, data]) => ({
            userId,
            violationCount: data.count,
            lastViolation: data.lastViolation,
            violationTypes: Array.from(data.types)
        }))
        .sort((a, b) => b.violationCount - a.violationCount);
};

const analyzeTimeOfDay = (messages) => {
    return messages.reduce((acc, msg) => {
        const hour = msg.timestamp.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});
};

export default {
    generateSupportAnalytics,
    generateAbuseAnalytics
};