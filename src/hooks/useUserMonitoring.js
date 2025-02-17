import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const useUserMonitoring = (userId) => {
    const [userStats, setUserStats] = useState(null);
    const [riskLevel, setRiskLevel] = useState('low');

    useEffect(() => {
        if (!userId) return;

        const userStatsRef = doc(db, 'userMonitoring', userId);
        const messagesQuery = query(
            collection(db, 'messages'),
            where('userId', '==', userId),
            where('isFlagged', '==', true),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribeStats = onSnapshot(userStatsRef, (doc) => {
            if (doc.exists()) {
                setUserStats(doc.data());
            }
        });

        const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
            const flaggedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Calculate risk metrics
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            const recentFlags = flaggedMessages.filter(msg => 
                msg.timestamp.toDate() > thirtyDaysAgo
            );

            const metrics = {
                totalFlagged: flaggedMessages.length,
                recentFlagged: recentFlags.length,
                spamCount: flaggedMessages.filter(msg => msg.flagType === 'spam').length,
                abuseCount: flaggedMessages.filter(msg => msg.flagType === 'abuse').length,
                harassmentCount: flaggedMessages.filter(msg => msg.flagType === 'harassment').length,
                lastUpdated: now
            };

            // Determine risk level
            let newRiskLevel = 'low';
            if (metrics.recentFlagged >= 5 || metrics.harassmentCount >= 2) {
                newRiskLevel = 'high';
            } else if (metrics.recentFlagged >= 3 || metrics.spamCount >= 3) {
                newRiskLevel = 'medium';
            }

            // Update user monitoring document
            setDoc(userStatsRef, {
                ...metrics,
                riskLevel: newRiskLevel,
                userId
            }, { merge: true });

            setRiskLevel(newRiskLevel);
        });

        return () => {
            unsubscribeStats();
            unsubscribeMessages();
        };
    }, [userId]);

    const updateUserRestrictions = async (restrictions) => {
        if (!userId) return;

        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                restrictions: {
                    ...restrictions,
                    updatedAt: new Date()
                }
            });
            return true;
        } catch (error) {
            console.error('Error updating user restrictions:', error);
            return false;
        }
    };

    const applyAutoRestrictions = async () => {
        if (!userStats || !userId) return;

        const restrictions = {
            chatRestricted: false,
            cooldownPeriod: 0,
            requiresModeration: false
        };

        if (riskLevel === 'high') {
            restrictions.chatRestricted = true;
            restrictions.requiresModeration = true;
            restrictions.cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
        } else if (riskLevel === 'medium') {
            restrictions.requiresModeration = true;
            restrictions.cooldownPeriod = 30 * 60 * 1000; // 30 minutes
        }

        return await updateUserRestrictions(restrictions);
    };

    return {
        userStats,
        riskLevel,
        updateUserRestrictions,
        applyAutoRestrictions
    };
};

export default useUserMonitoring;