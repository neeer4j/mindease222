import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const useReportManagement = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            const reportsRef = collection(db, 'reports');
            const q = query(
                reportsRef,
                orderBy('timestamp', 'desc')
            );
            const snapshot = await getDocs(q);
            const reportsData = [];
            
            for (const doc of snapshot.docs) {
                const report = { id: doc.id, ...doc.data() };
                // Fetch related content details
                if (report.contentType === 'message') {
                    const messageRef = doc(db, 'messages', report.contentId);
                    const messageSnap = await getDocs(messageRef);
                    report.content = messageSnap.data();
                }
                reportsData.push(report);
            }
            
            setReports(reportsData);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReport = async (reportId, action) => {
        try {
            const reportRef = doc(db, 'reports', reportId);
            await updateDoc(reportRef, {
                status: action,
                resolvedAt: new Date().toISOString()
            });

            // If action is 'remove_content', remove the reported content
            const report = reports.find(r => r.id === reportId);
            if (action === 'remove_content' && report) {
                const contentRef = doc(db, report.contentType + 's', report.contentId);
                await updateDoc(contentRef, {
                    status: 'removed',
                    removedAt: new Date().toISOString()
                });
            }

            // Refresh reports list
            await fetchReports();
        } catch (error) {
            console.error('Error handling report:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return {
        reports,
        loading,
        handleReport,
        refreshReports: fetchReports
    };
};

export default useReportManagement;