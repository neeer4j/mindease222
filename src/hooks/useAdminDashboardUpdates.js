import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';

const useAdminDashboardUpdates = () => {
    const [systemStats, setSystemStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        pendingReports: 0
    });
    const [adminActivities, setAdminActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            // Fetch admin activities
            const activitiesRef = collection(db, 'adminAuditLog');
            const activitiesQuery = query(
                activitiesRef,
                orderBy('timestamp', 'desc'),
                limit(50)
            );
            
            const activitiesUnsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
                const activities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAdminActivities(activities);
            });

            // Only fetch aggregate counts without private data
            const usersRef = collection(db, 'users');
            const unsubscribe = onSnapshot(usersRef, (snapshot) => {
                const totalUsers = snapshot.size;
                const bannedUsers = snapshot.docs.filter(doc => doc.data().isBanned).length;
                
                setSystemStats({
                    totalUsers,
                    activeUsers: totalUsers - bannedUsers,
                    bannedUsers,
                    pendingReports: 0
                });
            });

            // Reports counter
            const reportsRef = collection(db, 'reports');
            const reportsQuery = query(reportsRef, where('status', '==', 'pending'));
            const reportsUnsubscribe = onSnapshot(reportsQuery, (snapshot) => {
                setSystemStats(prev => ({
                    ...prev,
                    pendingReports: snapshot.size
                }));
            });

            setLoading(false);
            return () => {
                unsubscribe();
                reportsUnsubscribe();
                activitiesUnsubscribe();
            };
        } catch (error) {
            console.error('Error fetching system stats:', error);
            setLoading(false);
        }
    }, []);

    return {
        systemStats,
        adminActivities,
        loading
    };
};

export default useAdminDashboardUpdates;