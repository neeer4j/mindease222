import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const useTicketNotifications = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        // Query tickets for updates
        const ticketsQuery = query(
            collection(db, 'supportTickets'),
            where('userId', '==', userId),
            where('hasUnreadUpdates', '==', true),
            orderBy('lastUpdated', 'desc')
        );

        const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
            const ticketNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                lastUpdated: doc.data().lastUpdated?.toDate()
            }));
            setNotifications(ticketNotifications);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const markAsRead = async (ticketId) => {
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, {
                hasUnreadUpdates: false
            });
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    };

    return {
        notifications,
        loading,
        markAsRead
    };
};

export default useTicketNotifications;