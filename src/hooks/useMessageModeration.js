import { useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { analyzeMessage, shouldAutoModerate, getModerationType } from '../utils/messageAnalysis';

const useMessageModeration = (userId) => {
    const moderateMessage = useCallback(async (message, previousMessages) => {
        try {
            const analysis = analyzeMessage(message, previousMessages);
            
            if (!analysis.isFlagged) return;

            const messageRef = doc(db, 'messages', message.id);
            const updateData = {
                isFlagged: true,
                flagType: analysis.flagType,
                flaggedAt: new Date(),
                flagReasons: analysis.reasons,
                confidenceScore: analysis.confidence
            };

            const moderationType = getModerationType(analysis);
            if (moderationType === 'auto_remove') {
                updateData.content = '[Message automatically removed due to violation]';
                updateData.isRemoved = true;
                updateData.moderationStatus = 'removed';
                updateData.moderatedAt = new Date();
            } else {
                updateData.moderationStatus = moderationType;
            }

            await updateDoc(messageRef, updateData);

            // If auto-moderated, log the action
            if (moderationType === 'auto_remove') {
                const auditRef = collection(db, 'moderationAudit');
                await addDoc(auditRef, {
                    messageId: message.id,
                    userId: message.userId,
                    action: 'auto_remove',
                    reason: analysis.reasons.join(', '),
                    timestamp: new Date(),
                    analysis: analysis
                });
            }

            return analysis;
        } catch (error) {
            console.error('Error moderating message:', error);
            return null;
        }
    }, []);

    // Monitor user's recent messages for patterns
    useEffect(() => {
        if (!userId) return;

        const messagesQuery = query(
            collection(db, 'messages'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (messages.length < 2) return;

            // Analyze the most recent message
            const latestMessage = messages[0];
            const previousMessages = messages.slice(1);

            if (!latestMessage.isAnalyzed) {
                await moderateMessage(latestMessage, previousMessages);
                
                // Mark message as analyzed
                const messageRef = doc(db, 'messages', latestMessage.id);
                await updateDoc(messageRef, {
                    isAnalyzed: true
                });
            }
        });

        return () => unsubscribe();
    }, [userId, moderateMessage]);

    return {
        moderateMessage
    };
};

export default useMessageModeration;