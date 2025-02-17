import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const useAdminNotifications = () => {
    const [notifications, setNotifications] = useState({
        newTickets: 0,
        abuseReports: 0,
        highPriorityTickets: 0
    });

    useEffect(() => {
        // Listen for new support tickets
        const ticketsQuery = query(
            collection(db, 'supportTickets'),
            where('status', '==', 'open'),
            orderBy('createdAt', 'desc')
        );

        const abuseQuery = query(
            collection(db, 'messages'),
            where('isFlagged', '==', true),
            where('moderationStatus', '==', 'pending'),
            orderBy('timestamp', 'desc')
        );

        const highPriorityQuery = query(
            collection(db, 'supportTickets'),
            where('priority', '==', 'high'),
            where('status', '==', 'open')
        );

        const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
            setNotifications(prev => ({
                ...prev,
                newTickets: snapshot.size
            }));
        });

        const unsubscribeAbuse = onSnapshot(abuseQuery, (snapshot) => {
            setNotifications(prev => ({
                ...prev,
                abuseReports: snapshot.size
            }));
        });

        const unsubscribeHighPriority = onSnapshot(highPriorityQuery, (snapshot) => {
            setNotifications(prev => ({
                ...prev,
                highPriorityTickets: snapshot.size
            }));
        });

        return () => {
            unsubscribeTickets();
            unsubscribeAbuse();
            unsubscribeHighPriority();
        };
    }, []);

    return notifications;
};

export default useAdminNotifications;