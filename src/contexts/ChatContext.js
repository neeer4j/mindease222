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
  serverTimestamp,
  getDocs,
  writeBatch,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Optional success messages
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Listen to messages from the user's subcollection
    const messagesRef = collection(db, "users", user.uid, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Rebuild the list from all documents in the snapshot
        const chatMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(chatMessages);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching chat messages:", err);
        setError("Failed to fetch chat messages.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addMessage = async (messageText, isBot = false, additionalData = {}) => {
    if (!user) {
      setError("User not authenticated.");
      return null;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Add the message to the user's subcollection
      const userDocRef = await addDoc(
        collection(db, "users", user.uid, "messages"),
        {
          text: messageText,
          isBot: isBot, // Indicates if the message is from the bot or the user
          timestamp: serverTimestamp(),
          reactions: [],
          ...additionalData,
        }
      );

      // If it's a user message, also add it to the global "messages" collection
      if (!isBot) {
        await addDoc(collection(db, "messages"), {
          text: messageText,
          isBot: false,
          userId: user.uid, // Using 'userId' to match our security rules
          timestamp: serverTimestamp(),
          reactions: [],
          ...additionalData,
        });
      }

      return userDocRef.id;
    } catch (err) {
      console.error("Error adding chat message:", err);
      setError("Failed to send message.");
      return null;
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
      setSuccess("Message deleted successfully!");
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
      const q = query(messagesRef);
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setMessages([]);
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

export default ChatContext;
