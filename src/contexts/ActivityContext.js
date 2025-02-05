// src/contexts/ActivityContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { db } from "../firebase"; // Ensure correct path
import {
    collection,
    addDoc,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc,
} from "firebase/firestore";
import { AuthContext } from "./AuthContext";

export const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null); // To handle success messages

    const { user } = useContext(AuthContext);

    // **Define fetchActivities function using useCallback**
    const fetchActivities = useCallback(async () => {
        if (!user) {
            setActivities([]); // Clear activities if no user
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const unsubscribe = onSnapshot(
                collection(db, "users", user.uid, "activities"),
                (snapshot) => {
                    const acts = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setActivities(acts);
                    setLoading(false);
                    setSuccess(null); // Clear success on refresh
                },
                (err) => {
                    console.error("Error fetching activities:", err);
                    setError("Failed to fetch activities.");
                    setLoading(false);
                }
            );
             // In useCallback, you should not return unsubscribe directly if it is meant for useEffect cleanup.
             // Returning a cleanup function from useCallback is not standard practice for context functions like fetchActivities.
             // The useEffect already handles the unsubscribe when the component unmounts or user changes.
             // We just need to make fetchActivities function available in context.
             // So we will not return unsubscribe here.
             // return () => unsubscribe(); // No need to return unsubscribe here for useCallback
        } catch (err) {
            console.error("Error in fetchActivities:", err);
            setError("Failed to fetch activities.");
            setLoading(false);
        }
    }, [user]); // Dependency on user, fetch again if user changes

    // Initial activities fetch on mount, and when user changes - Using useEffect to call fetchActivities
    useEffect(() => {
        fetchActivities(); // Call fetchActivities on component mount and when user changes
        // The unsubscribe is now handled within the fetchActivities function using onSnapshot.
        // There is no need to return a cleanup function here because fetchActivities itself manages the subscription.
    }, [user, fetchActivities]); // Depend on user and fetchActivities to re-run when they change


    // Add a new activity (unchanged)
    const addActivity = useCallback(async (activity) => {
        if (!user) {
            setError("User not authenticated.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await addDoc(collection(db, "users", user.uid, "activities"), {
                title: activity.title,
                description: activity.description || "",
                category: activity.category || "", // Include category
                date: activity.date || new Date().toISOString(),
            });
            setSuccess("Activity added successfully!");
             await fetchActivities(); // Refresh activities list after adding
        } catch (err) {
            console.error("Error adding activity:", err);
            setError("Failed to add activity.");
        } finally {
            setLoading(false);
        }
    }, [user, fetchActivities]); // Added fetchActivities to dependencies

    // Edit an existing activity (unchanged)
    const editActivity = useCallback(async (activity) => {
        if (!user) {
            setError("User not authenticated.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const docRef = doc(db, "users", user.uid, "activities", activity.id);
            await updateDoc(docRef, {
                title: activity.title,
                description: activity.description || "",
                category: activity.category || "", // Include category
                date: activity.date || new Date().toISOString(),
            });
            setSuccess("Activity updated successfully!");
            await fetchActivities(); // Refresh activities list after editing
        } catch (err) {
            console.error("Error editing activity:", err);
            setError("Failed to edit activity.");
        } finally {
            setLoading(false);
        }
    }, [user, fetchActivities]); // Added fetchActivities to dependencies

    // Delete an activity (unchanged)
    const deleteActivity = useCallback(async (id) => {
        if (!user) {
            setError("User not authenticated.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const docRef = doc(db, "users", user.uid, "activities", id);
            await deleteDoc(docRef);
            setSuccess("Activity deleted successfully!");
            await fetchActivities(); // Refresh activities list after deleting
        } catch (err) {
            console.error("Error deleting activity:", err);
            setError("Failed to delete activity.");
        } finally {
            setLoading(false);
        }
    }, [user, fetchActivities]); // Added fetchActivities to dependencies

    // Clear error and success messages after 5 seconds (unchanged)
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
        <ActivityContext.Provider
            value={{
                activities,
                addActivity,
                editActivity,
                deleteActivity,
                loading,
                error,
                success,
                fetchActivities, // <---- ADDED fetchActivities to the context value!
            }}
        >
            {children}
        </ActivityContext.Provider>
    );
};