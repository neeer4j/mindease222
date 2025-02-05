// src/contexts/MoodContext.jsx

import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../firebase"; // Import Firestore instance
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { AuthContext } from "./AuthContext";

// Create the MoodContext
export const MoodContext = createContext();

export const MoodProvider = ({ children }) => {
    const [moodEntries, setMoodEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { user } = useContext(AuthContext);

    // Listen for changes in mood entries for the authenticated user
    useEffect(() => {
        if (!user) {
            setMoodEntries([]);
            return;
        }

        const unsubscribe = onSnapshot(
            collection(db, "users", user.uid, "moods"),
            (snapshot) => {
                const moods = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setMoodEntries(moods);
            },
            (err) => {
                console.error("Error fetching mood entries:", err);
                setError("Failed to fetch mood entries");
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Add a new mood entry
    const addMood = async (mood, notes) => {
        if (!user) {
            setError("User not authenticated");
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, "users", user.uid, "moods"), {
                mood,
                notes: notes || '',
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            console.error("Error adding mood entry:", err);
            setError("Failed to add mood entry");
        } finally {
            setLoading(false);
        }
    };

    // Edit an existing mood entry
    const editMood = async (id, updatedMood, updatedNotes) => {
        if (!user) {
            setError("User not authenticated");
            return;
        }

        setLoading(true);
        try {
            const docRef = doc(db, "users", user.uid, "moods", id);
            await updateDoc(docRef, { 
                mood: updatedMood,
                notes: updatedNotes || '',
            });
        } catch (err) {
            console.error("Error editing mood entry:", err);
            setError("Failed to edit mood entry");
        } finally {
            setLoading(false);
        }
    };

    // Delete a mood entry
    const deleteMood = async (id) => {
        if (!user) {
            setError("User not authenticated");
            return;
        }

        setLoading(true);
        try {
            const docRef = doc(db, "users", user.uid, "moods", id);
            await deleteDoc(docRef);
        } catch (err) {
            console.error("Error deleting mood entry:", err);
            setError("Failed to delete mood entry");
        } finally {
            setLoading(false);
        }
    };

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <MoodContext.Provider
            value={{
                moodEntries,
                addMood,
                editMood,
                deleteMood,
                loading,
                error,
            }}
        >
            {children}
        </MoodContext.Provider>
    );
};
