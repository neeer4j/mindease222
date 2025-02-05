// src/contexts/SleepContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../firebase"; // Ensure correct path to your firebase.js config
import {
    collection,
    addDoc,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc,
} from "firebase/firestore";
import { AuthContext } from "./AuthContext";

export const SleepContext = createContext();

export const SleepProvider = ({ children }) => {
    const [sleepLogs, setSleepLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user) {
            setSleepLogs([]);
            return;
        }

        setLoading(true);
        const unsubscribe = onSnapshot(
            collection(db, "users", user.uid, "sleepLogs"),
            (snapshot) => {
                const logs = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setSleepLogs(logs);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching sleep logs:", err);
                setError("Failed to fetch sleep logs.");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const addSleepLog = async (sleepLog) => {
        if (!user) {
            setError("User not authenticated.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await addDoc(collection(db, "users", user.uid, "sleepLogs"), {
                startTime: sleepLog.startTime,
                endTime: sleepLog.endTime,
                notes: sleepLog.notes || "",
                qualityRating: sleepLog.qualityRating,
                factors: sleepLog.factors || [],
                timestamp: new Date().toISOString(), // Added timestamp for ordering if needed
            });
            setSuccess("Sleep log added successfully!");
        } catch (err) {
            console.error("Error adding sleep log:", err);
            setError("Failed to add sleep log.");
        } finally {
            setLoading(false);
        }
    };

    const deleteSleepLog = async (logId) => {
        if (!user) {
            setError("User not authenticated.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const logDocRef = doc(db, "users", user.uid, "sleepLogs", logId);
            await deleteDoc(logDocRef);
            setSleepLogs(currentLogs => currentLogs.filter(log => log.id !== logId)); // Optimistic update
            setSuccess("Sleep log deleted successfully!");
        } catch (err) {
            console.error("Error deleting sleep log:", err);
            setError("Failed to delete sleep log.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError(null);
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);


    return (
        <SleepContext.Provider value={{ sleepLogs, addSleepLog, deleteSleepLog, loading, error, success }}>
            {children}
        </SleepContext.Provider>
    );
};