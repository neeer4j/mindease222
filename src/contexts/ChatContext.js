// src/contexts/ChatContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../firebase"; // Ensure correct path to your firebase config
import {
    collection,
    addDoc,
    onSnapshot,
    doc,
    deleteDoc,
    orderBy,
    query,
    serverTimestamp, // Using serverTimestamp for consistent timestamps
    getDocs, // Import getDocs
    writeBatch, // Import writeBatch
    updateDoc,
    arrayUnion,
} from "firebase/firestore";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null); // Optional: for success messages when adding/deleting messages
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user) {
            setMessages([]);
            return;
        }

        setLoading(true);
        setError(null);

        const messagesRef = collection(db, "users", user.uid, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc")); // Order messages by timestamp

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const chatMessages = [];
                snapshot.docChanges().forEach((change) => { // Process docChanges for efficiency
                    if (change.type === "added") {
                        chatMessages.push({ id: change.doc.id, ...change.doc.data() });
                    } else if (change.type === "modified") {
                        // Update existing message
                        setMessages((prevMessages) =>
                            prevMessages.map((msg) =>
                                msg.id === change.doc.id ? { id: change.doc.id, ...change.doc.data() } : msg
                            )
                        );
                    } else if (change.type === "removed") {
                        // Remove message
                        setMessages((prevMessages) =>
                            prevMessages.filter((msg) => msg.id !== change.doc.id)
                        );
                    }
                });
                if (chatMessages.length > 0) {
                    setMessages((prevMessages) => [...prevMessages, ...chatMessages]);
                }
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching chat messages:", err);
                setError("Failed to fetch chat messages.");
                setLoading(false);
            }
        );

        return () => unsubscribe(); // Cleanup on unmount or user change
    }, [user]);

    const addMessage = async (messageText, isBot = false, additionalData = {}) => {
        if (!user) {
            setError("User not authenticated.");
            return null; // Return null to indicate failure
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const docRef = await addDoc(collection(db, "users", user.uid, "messages"), {
                text: messageText,
                isBot: isBot, // Indicate if the message is from the bot or user
                timestamp: serverTimestamp(), // Use serverTimestamp for accurate order
                reactions: [], // Initialize reactions as empty array
                ...additionalData,
            });
            return docRef.id; // Return the newly added message's ID
        } catch (err) {
            console.error("Error adding chat message:", err);
            setError("Failed to send message.");
            return null; // Return null to indicate failure
        } finally {
            setLoading(false);
        }
    };

    const deleteMessage = async (messageId) => {
        if (!user) {
            setError("User not authenticated.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const messageRef = doc(db, "users", user.uid, "messages", messageId);
            await deleteDoc(messageRef);
            setSuccess("Message deleted successfully!"); // Optional success message
        } catch (err) {
            console.error("Error deleting chat message:", err);
            setError("Failed to delete message.");
        } finally {
            setLoading(false);
        }
    };

    const clearChat = async () => {
        if (!user) {
            setError("User not authenticated.");
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const messagesRef = collection(db, "users", user.uid, "messages");
            const q = query(messagesRef); // Fetch all messages
            const snapshot = await getDocs(q); // Use imported getDocs

            const batch = writeBatch(db); // Use imported writeBatch
            snapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            setMessages([]); // Clear local state immediately for responsiveness
            setSuccess("Chat history cleared successfully!");
        } catch (err) {
            console.error("Error clearing chat history:", err);
            setError("Failed to clear chat history.");
        } finally {
            setLoading(false);
        }
    };

    const addReaction = async (messageId, reaction) => {
        if (!user) {
            setError("User not authenticated.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const messageRef = doc(db, "users", user.uid, "messages", messageId);
            await updateDoc(messageRef, {
                reactions: arrayUnion(reaction),
            });
        } catch (err) {
            console.error("Error adding reaction:", err);
            setError("Failed to add reaction.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ChatContext.Provider
            value={{
                messages,
                loading,
                error,
                success,
                addMessage,
                deleteMessage,
                clearChat,
                addReaction,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
