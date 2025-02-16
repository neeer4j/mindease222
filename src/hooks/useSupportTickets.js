import { useState, useEffect } from 'react';
import { collection, query, orderBy, where, onSnapshot, doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const useSupportTickets = (isAdmin = false) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const ticketsRef = collection(db, 'supportTickets');
        
        // Create query based on user role
        const q = isAdmin 
            ? query(ticketsRef, orderBy('createdAt', 'desc'))
            : query(
                ticketsRef,
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const ticketData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate()
                }));
                setTickets(ticketData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching tickets:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, isAdmin]);

    const updateTicketStatus = async (ticketId, status) => {
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, {
                status,
                lastUpdated: serverTimestamp()
            });
            return true;
        } catch (err) {
            setError(err);
            return false;
        }
    };

    const addTicketResponse = async (ticketId, response, status = null) => {
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            const updateData = {
                updates: arrayUnion({
                    text: response,
                    userId: user.uid,
                    userEmail: user.email,
                    timestamp: serverTimestamp()
                }),
                lastUpdated: serverTimestamp()
            };
            
            if (status) {
                updateData.status = status;
            }
            
            await updateDoc(ticketRef, updateData);
            return true;
        } catch (err) {
            setError(err);
            return false;
        }
    };

    const updateSatisfaction = async (ticketId, satisfaction) => {
        try {
            const ticketRef = doc(db, 'supportTickets', ticketId);
            await updateDoc(ticketRef, {
                satisfaction,
                lastUpdated: serverTimestamp()
            });
            return true;
        } catch (err) {
            setError(err);
            return false;
        }
    };

    // Analytics functions for admin
    const getTicketStats = () => {
        if (!tickets.length) return null;

        return {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            inProgress: tickets.filter(t => t.status === 'in-progress').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            avgResponseTime: calculateAverageResponseTime(tickets),
            satisfaction: calculateSatisfactionRate(tickets)
        };
    };

    const calculateAverageResponseTime = (tickets) => {
        const respondedTickets = tickets.filter(ticket => 
            ticket.updates && ticket.updates.length > 0
        );
        
        if (respondedTickets.length === 0) return 0;

        const totalResponseTime = respondedTickets.reduce((sum, ticket) => {
            const createdAt = ticket.createdAt;
            const firstResponse = ticket.updates[0].timestamp?.toDate();
            return sum + (firstResponse - createdAt) / (1000 * 60 * 60);
        }, 0);

        return Math.round(totalResponseTime / respondedTickets.length);
    };

    const calculateSatisfactionRate = (tickets) => {
        const ratedTickets = tickets.filter(ticket => 
            ticket.satisfaction && ticket.status === 'resolved'
        );
        
        if (ratedTickets.length === 0) return 0;

        const totalSatisfaction = ratedTickets.reduce((sum, ticket) => 
            sum + ticket.satisfaction, 0
        );

        return Math.round((totalSatisfaction / (ratedTickets.length * 5)) * 100);
    };

    return {
        tickets,
        loading,
        error,
        updateTicketStatus,
        addTicketResponse,
        updateSatisfaction,
        getTicketStats: isAdmin ? getTicketStats : null
    };
};

export default useSupportTickets;