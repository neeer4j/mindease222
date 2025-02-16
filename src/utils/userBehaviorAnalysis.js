import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const SUSPICIOUS_PATTERNS = {
    RAPID_MESSAGES: {
        threshold: 10,
        timeWindow: 60000, // 1 minute in milliseconds
        description: 'Sending too many messages in a short time'
    },
    OFFENSIVE_CONTENT: {
        keywords: ['abuse', 'hate', 'threat', 'harassment'],
        threshold: 0.3, // 30% match confidence
        description: 'Potentially offensive content detected'
    },
    SPAM_BEHAVIOR: {
        repeatThreshold: 5,
        timeWindow: 300000, // 5 minutes
        description: 'Repetitive message pattern detected'
    }
};

export const analyzeUserBehavior = async (userId) => {
    try {
        const warnings = [];
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - 5); // Last 5 minutes

        // Check message frequency
        const messagesRef = collection(db, 'messages');
        const recentMessagesQuery = query(
            messagesRef,
            where('sender', '==', userId),
            where('timestamp', '>=', timestamp),
            orderBy('timestamp', 'desc')
        );
        const messageSnapshot = await getDocs(recentMessagesQuery);
        
        // Check for rapid messaging
        if (messageSnapshot.size >= SUSPICIOUS_PATTERNS.RAPID_MESSAGES.threshold) {
            warnings.push({
                type: 'RAPID_MESSAGES',
                severity: 'high',
                description: SUSPICIOUS_PATTERNS.RAPID_MESSAGES.description,
                count: messageSnapshot.size
            });
        }

        // Check content for offensive patterns
        const messages = messageSnapshot.docs.map(doc => doc.data().content.toLowerCase());
        const offensiveMatches = messages.filter(msg => 
            SUSPICIOUS_PATTERNS.OFFENSIVE_CONTENT.keywords.some(keyword => 
                msg.includes(keyword)
            )
        );

        if (offensiveMatches.length > 0) {
            const offensiveRatio = offensiveMatches.length / messages.length;
            if (offensiveRatio >= SUSPICIOUS_PATTERNS.OFFENSIVE_CONTENT.threshold) {
                warnings.push({
                    type: 'OFFENSIVE_CONTENT',
                    severity: 'high',
                    description: SUSPICIOUS_PATTERNS.OFFENSIVE_CONTENT.description,
                    matchCount: offensiveMatches.length
                });
            }
        }

        // Check for spam patterns (repeated messages)
        const messageFrequency = {};
        messages.forEach(msg => {
            messageFrequency[msg] = (messageFrequency[msg] || 0) + 1;
        });

        const repeatedMessages = Object.entries(messageFrequency)
            .filter(([_, count]) => count >= SUSPICIOUS_PATTERNS.SPAM_BEHAVIOR.repeatThreshold);

        if (repeatedMessages.length > 0) {
            warnings.push({
                type: 'SPAM_BEHAVIOR',
                severity: 'medium',
                description: SUSPICIOUS_PATTERNS.SPAM_BEHAVIOR.description,
                repeatedMessages: repeatedMessages.length
            });
        }

        return {
            userId,
            timestamp: new Date(),
            warnings,
            riskLevel: calculateRiskLevel(warnings),
            needsModeration: warnings.length > 0
        };
    } catch (error) {
        console.error('Error analyzing user behavior:', error);
        throw error;
    }
};

const calculateRiskLevel = (warnings) => {
    if (warnings.length === 0) return 'low';
    
    const highSeverityCount = warnings.filter(w => w.severity === 'high').length;
    const mediumSeverityCount = warnings.filter(w => w.severity === 'medium').length;
    
    if (highSeverityCount > 0) return 'high';
    if (mediumSeverityCount > 0) return 'medium';
    return 'low';
};