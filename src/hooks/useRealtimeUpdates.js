import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';

const useRealtimeUpdates = () => {
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        
        // Real-time users subscription - only collecting non-sensitive data
        const usersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc')
        );
        
        // Real-time reports subscription - only for system reports
        const reportsQuery = query(
            collection(db, 'reports'),
            where('status', '==', 'pending'),
            orderBy('timestamp', 'desc')
        );

        const unsubscribeUsers = onSnapshot(usersQuery, async (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                email: doc.data().email,
                createdAt: doc.data().createdAt,
                displayName: doc.data().displayName,
                avatar: doc.data().avatar,
                photoURL: doc.data().photoURL || doc.data().avatar || doc.data().imageUrl,
                imageUrl: doc.data().imageUrl,
                isBanned: doc.data().isBanned,
                bannedAt: doc.data().bannedAt,
                banReason: doc.data().banReason,
            }));
            setUsers(usersData);
        });

        const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
            const reportsData = snapshot.docs.map(doc => ({
                id: doc.id,
                type: doc.data().type,
                status: doc.data().status,
                timestamp: doc.data().timestamp,
                // Only collecting report metadata, not the actual content
            }));
            setReports(reportsData);
        });

        setLoading(false);

        return () => {
            unsubscribeUsers();
            unsubscribeReports();
        };
    }, []); 

    return {
        users,
        reports,
        loading
    };
};

export default useRealtimeUpdates;