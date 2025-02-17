// src/hooks/useChatModeration.js
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  doc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';

const useChatModeration = () => {
  const [chatAlerts, setChatAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flaggedMessages, setFlaggedMessages] = useState([]);

  // Define lists of words/phrases
  const abuseWords = [
    'fuck', 'shit', 'bitch', 'asshole', 
    'nigger', 'faggot', 'slut', 'whore',
    'cunt', 'dick', 'cock', 'stupid', 'idiot',
    'bastard', 'motherfucker', 'cocksucker', 'douchebag',
    'prick', 'fucking', 'damn', 'screw you'
  ];

  const spamWords = [
    'buy now', 'free', 'click here', 'subscribe', 'check out',
    'discount', 'sale', 'limited offer', 'act now', 'winner',
    'win', 'congratulations', 'credit', 'loan', 'deal'
  ];

  const distressWords = [
    'suicide', 'kill myself', 'i want to die', 'i dont want to live',
    'depressed', 'depression', 'hopeless', 'worthless', 'self harm',
    'self-harm', 'hurt myself', 'no hope', 'cant go on', 'end my life'
  ];

  // 1. Listen for new messages in the global "messages" collection (all messages)
  useEffect(() => {
    const chatQuery = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(chatQuery, async (snapshot) => {
      const messages = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Analyze only un-analyzed messages from any user
      for (const message of messages) {
        if (message.isAnalyzed || message.isBot || !message.text) continue;

        try {
          console.log('Analyzing message:', message.text);
          const textToAnalyze = message.text.trim().toLowerCase();
          if (!textToAnalyze) continue;

          // Check for each type of trigger
          let foundAbuse = [];
          let foundSpam = [];
          let foundDistress = [];

          abuseWords.forEach(word => {
            if (textToAnalyze.includes(word)) {
              foundAbuse.push(word);
            }
          });

          spamWords.forEach(word => {
            if (textToAnalyze.includes(word)) {
              foundSpam.push(word);
            }
          });

          distressWords.forEach(word => {
            if (textToAnalyze.includes(word)) {
              foundDistress.push(word);
            }
          });

          // If any category is triggered, flag the message
          if (foundAbuse.length || foundSpam.length || foundDistress.length) {
            // Determine categories based on detected words
            const categories = [];
            if (foundAbuse.length) categories.push('abuse');
            if (foundSpam.length) categories.push('spam');
            if (foundDistress.length) categories.push('distress');

            // Set severity based on total violations
            const totalFound = foundAbuse.length + foundSpam.length + foundDistress.length;
            const severity = foundDistress.length > 0 
              ? 'critical' 
              : totalFound > 2 
                ? 'high' 
                : 'medium';

            // Create chat abuse record regardless of user type
            const alert = {
              id: `chat-${message.id}`,
              messageId: message.id,
              userId: message.userId,
              text: message.text,
              timestamp: message.timestamp,
              categories,
              severity,
              detectedWords: {
                abuse: foundAbuse,
                spam: foundSpam,
                distress: foundDistress
              }
            };

            // Store abuse alert in Firestore
            await setDoc(doc(db, 'chatAbuse', alert.id), {
              ...alert,
              createdAt: serverTimestamp(),
            });

            // Update local state
            setChatAlerts(prev => [alert, ...prev]);

            // Mark message as flagged
            await updateDoc(doc(db, 'messages', message.id), {
              isFlagged: true,
              flagType: categories.includes('distress') ? 'distress' : 'abuse',
              flaggedAt: serverTimestamp(),
              categories,
              severity,
              detectedWords: {
                abuse: foundAbuse,
                spam: foundSpam,
                distress: foundDistress
              }
            });
          }

          // Always mark as analyzed
          await updateDoc(doc(db, 'messages', message.id), {
            isAnalyzed: true,
            analyzedAt: serverTimestamp()
          });

        } catch (error) {
          console.error('Error analyzing message:', error);
          // Mark as analyzed even on error to prevent infinite loops
          await updateDoc(doc(db, 'messages', message.id), {
            isAnalyzed: true,
            analysisError: true,
            errorMessage: error.message
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen for flagged messages
  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('isFlagged', '==', true),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const flagged = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setFlaggedMessages(flagged);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper functions for handling alerts
  const handleAlert = async (alertId, action) => {
    const alert = chatAlerts.find(a => a.id === alertId);
    if (!alert) return false;

    try {
      if (action === 'remove') {
        await updateDoc(doc(db, 'messages', alert.messageId), {
          text: '[Message removed by moderator]',
          isRemoved: true,
          removedAt: serverTimestamp(),
        });
      }

      await updateDoc(doc(db, 'chatAbuse', alert.id), {
        status: action,
        resolvedAt: serverTimestamp(),
      });

      setChatAlerts(prev => prev.filter(a => a.id !== alertId));
      return true;
    } catch (error) {
      console.error('Error handling chat alert:', error);
      return false;
    }
  };

  const moderateMessage = async (messageId, action) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const updates = {
        moderationStatus: action,
        moderatedAt: serverTimestamp(),
      };

      if (action === 'removed') {
        updates.text = '[Message removed by moderator]';
        updates.isRemoved = true;
      }

      await updateDoc(messageRef, updates);
      return true;
    } catch (error) {
      console.error('Error moderating message:', error);
      return false;
    }
  };

  const updateAbuseReport = async (messageId, details) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        abuseDetails: details,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating abuse report:', error);
      return false;
    }
  };

  return {
    chatAlerts,
    flaggedMessages,
    loading,
    handleAlert,
    moderateMessage,
    updateAbuseReport
  };
};

export default useChatModeration;
