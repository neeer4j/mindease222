import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const useReportManagement = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReports = async () => {
        try {
            const reportsRef = collection(db, 'reports');
            const q = query(
                reportsRef,
                orderBy('timestamp', 'desc')
            );
            const snapshot = await getDocs(q);
            const reportsData = [];
            
            for (const docSnap of snapshot.docs) {
                const report = { id: docSnap.id, ...docSnap.data() };
                
                // If there's a message reference, fetch the message content
                if (report.message && report.message.id) {
                    try {
                        const messageRef = doc(db, 'messages', report.message.id);
                        const messageSnap = await getDoc(messageRef);
                        if (messageSnap.exists()) {
                            report.message = {
                                id: messageSnap.id,
                                ...messageSnap.data()
                            };
                        }
                    } catch (err) {
                        console.error('Error fetching message:', err);
                        report.message.error = 'Message not found';
                    }
                }
                
                reportsData.push(report);
            }
            
            setReports(reportsData);
            setError(null);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resolveReport = async (reportId, action) => {
        try {
            const reportRef = doc(db, 'reports', reportId);
            const report = reports.find(r => r.id === reportId);
            
            if (!report) {
                throw new Error('Report not found');
            }

            const updateData = {
                status: action,
                resolvedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await updateDoc(reportRef, updateData);

            // If action is 'deleted', remove the reported content
            if (action === 'deleted' && report.message) {
                const messageRef = doc(db, 'messages', report.message.id);
                await updateDoc(messageRef, {
                    isDeleted: true,
                    deletedAt: serverTimestamp(),
                    deletedReason: 'Removed due to report'
                });
            }

            // Refresh reports list
            await fetchReports();
        } catch (err) {
            console.error('Error resolving report:', err);
            setError(err.message);
            throw err;
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return {
        reports,
        loading,
        error,
        resolveReport
    };
};

export default useReportManagement;