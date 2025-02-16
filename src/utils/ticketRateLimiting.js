import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Rate limiting configuration
const RATE_LIMITS = {
    TICKETS_PER_DAY: 5,
    TICKETS_PER_HOUR: 2,
    HIGH_PRIORITY_PER_DAY: 2
};

export const checkTicketRateLimit = async (userId) => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const ticketsRef = collection(db, 'supportTickets');

    // Check daily limit
    const dailyQuery = query(
        ticketsRef,
        where('userId', '==', userId),
        where('createdAt', '>=', oneDayAgo)
    );
    const dailySnapshot = await getDocs(dailyQuery);
    const dailyCount = dailySnapshot.size;

    if (dailyCount >= RATE_LIMITS.TICKETS_PER_DAY) {
        return {
            allowed: false,
            reason: 'Daily ticket limit reached. Please try again tomorrow.',
            remainingTime: getTimeUntilReset(dailySnapshot.docs[0].data().createdAt)
        };
    }

    // Check hourly limit
    const hourlyQuery = query(
        ticketsRef,
        where('userId', '==', userId),
        where('createdAt', '>=', oneHourAgo)
    );
    const hourlySnapshot = await getDocs(hourlyQuery);
    const hourlyCount = hourlySnapshot.size;

    if (hourlyCount >= RATE_LIMITS.TICKETS_PER_HOUR) {
        return {
            allowed: false,
            reason: 'Hourly ticket limit reached. Please try again later.',
            remainingTime: getTimeUntilReset(hourlySnapshot.docs[0].data().createdAt, 'hour')
        };
    }

    // Check high priority daily limit
    const highPriorityQuery = query(
        ticketsRef,
        where('userId', '==', userId),
        where('createdAt', '>=', oneDayAgo),
        where('priority', '==', 'high')
    );
    const highPrioritySnapshot = await getDocs(highPriorityQuery);
    const highPriorityCount = highPrioritySnapshot.size;

    if (highPriorityCount >= RATE_LIMITS.HIGH_PRIORITY_PER_DAY) {
        return {
            allowed: false,
            reason: 'Daily high-priority ticket limit reached. Please submit as normal priority or try again tomorrow.',
            remainingTime: getTimeUntilReset(highPrioritySnapshot.docs[0].data().createdAt)
        };
    }

    return {
        allowed: true,
        dailyRemaining: RATE_LIMITS.TICKETS_PER_DAY - dailyCount,
        hourlyRemaining: RATE_LIMITS.TICKETS_PER_HOUR - hourlyCount,
        highPriorityRemaining: RATE_LIMITS.HIGH_PRIORITY_PER_DAY - highPriorityCount
    };
};

const getTimeUntilReset = (timestamp, period = 'day') => {
    const now = new Date();
    const targetTime = new Date(timestamp.toDate());
    const resetTime = new Date(targetTime);
    
    if (period === 'day') {
        resetTime.setDate(resetTime.getDate() + 1);
    } else {
        resetTime.setHours(resetTime.getHours() + 1);
    }

    return Math.max(0, resetTime - now);
};