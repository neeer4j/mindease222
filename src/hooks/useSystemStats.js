import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const useSystemStats = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            const unsubscribe = onSnapshot(usersRef, (snapshot) => {
                const totalUsers = snapshot.size;
                const bannedUsers = snapshot.docs.filter(doc => doc.data().isBanned).length;
                
                setStats({
                    totalUsers,
                    activeUsers: totalUsers - bannedUsers,
                    bannedUsers
                });
                setLoading(false);
            }, (error) => {
                console.error('Error fetching system stats:', error);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up system stats:', error);
            setLoading(false);
        }
    }, []);

    return { stats, loading };
};

export default useSystemStats;