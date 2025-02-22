// src/hooks/useChatModeration.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  limit,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

const BATCH_SIZE = 20; // Process messages in batches
const ANALYSIS_INTERVAL = 5000; // 5 seconds between batch processing
const MAX_CACHED_ALERTS = 100; // Maximum number of alerts to keep in memory

const useChatModeration = () => {
  const [chatAlerts, setChatAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  
  // Use refs for better performance with large datasets
  const alertsRef = useRef([]);
  const processedMessagesRef = useRef(new Set());
  const isProcessingRef = useRef(false);

  // Memoize word lists for better performance
  const wordLists = useMemo(() => ({
    abuse: [
      'fuck', 'shit', 'bitch', 'asshole', 
      'nigger', 'faggot', 'slut', 'whore',
      'cunt', 'dick', 'cock', 'stupid', 'idiot',
      'bastard', 'motherfucker', 'cocksucker', 'douchebag',
      'prick', 'fucking', 'damn', 'screw you'
    ],
    spam: [
      'buy now', 'free', 'click here', 'subscribe', 'check out',
      'discount', 'sale', 'limited offer', 'act now', 'winner',
      'win', 'congratulations', 'credit', 'loan', 'deal'
    ],
    distress: [
      'suicide', 'kill myself', 'i want to die', 'i dont want to live',
      'depressed', 'depression', 'hopeless', 'worthless', 'self harm',
      'self-harm', 'hurt myself', 'no hope', 'cant go on', 'end my life'
    ]
  }), []);

  // Optimized message analysis function
  const analyzeMessage = useCallback((message) => {
    if (!message?.text || typeof message.text !== 'string') return null;
    
    const textToAnalyze = message.text.trim().toLowerCase();
    if (!textToAnalyze) return null;

    const results = {
      abuse: [],
      spam: [],
      distress: []
    };

    // Use Set for faster lookups
    const words = new Set(textToAnalyze.split(/\s+/));
    
    for (const [category, list] of Object.entries(wordLists)) {
      for (const phrase of list) {
        if (phrase.includes(' ')) {
          // For multi-word phrases
          if (textToAnalyze.includes(phrase)) {
            results[category].push(phrase);
          }
        } else {
          // For single words
          if (words.has(phrase)) {
            results[category].push(phrase);
          }
        }
      }
    }

    if (Object.values(results).some(arr => arr.length > 0)) {
      return {
        categories: Object.entries(results)
          .filter(([_, words]) => words.length > 0)
          .map(([category]) => category),
        severity: results.distress.length > 0 
          ? 'critical' 
          : Object.values(results).reduce((sum, arr) => sum + arr.length, 0) > 2 
            ? 'high' 
            : 'medium',
        detectedWords: results
      };
    }

    return null;
  }, [wordLists]);

  // Batch processing of messages
  const processBatch = useCallback(async (messages) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const batch = writeBatch(db);
      const newAlerts = [];
      let updates = 0;

      for (const message of messages) {
        if (processedMessagesRef.current.has(message.id)) continue;
        
        const analysis = analyzeMessage(message);
        if (analysis) {
          const alert = {
            id: `chat-${message.id}`,
            messageId: message.id,
            userId: message.userId,
            text: message.text,
            timestamp: message.timestamp,
            categories: analysis.categories,
            severity: analysis.severity,
            detectedWords: analysis.detectedWords
          };

          // Add to batch operations
          batch.set(doc(db, 'chatAbuse', alert.id), {
            ...alert,
            createdAt: serverTimestamp(),
          });

          batch.update(doc(db, 'messages', message.id), {
            isFlagged: true,
            flagType: analysis.categories.includes('distress') ? 'distress' : 'abuse',
            flaggedAt: serverTimestamp(),
            categories: analysis.categories,
            severity: analysis.severity,
            detectedWords: analysis.detectedWords,
            isAnalyzed: true,
            analyzedAt: serverTimestamp()
          });

          newAlerts.push(alert);
          updates++;
        } else {
          // Mark as analyzed even if no issues found
          batch.update(doc(db, 'messages', message.id), {
            isAnalyzed: true,
            analyzedAt: serverTimestamp()
          });
        }

        processedMessagesRef.current.add(message.id);
      }

      if (updates > 0) {
        await batch.commit();
        
        // Update alerts with limit
        alertsRef.current = [...newAlerts, ...alertsRef.current]
          .slice(0, MAX_CACHED_ALERTS);
        setChatAlerts(alertsRef.current);
      }
    } catch (error) {
      console.error('Error processing message batch:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [analyzeMessage]);

  // Optimized message listener with batching
  useEffect(() => {
    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(BATCH_SIZE)
    );

    let timeoutId;
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(msg => !msg.isAnalyzed && !msg.isBot);

      if (messages.length > 0) {
        // Debounce processing to avoid too frequent updates
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          processBatch(messages);
        }, ANALYSIS_INTERVAL);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [processBatch]);

  // Listen for flagged messages with optimized query
  useEffect(() => {
    const flaggedQuery = query(
      collection(db, 'messages'),
      where('isFlagged', '==', true),
      orderBy('timestamp', 'desc'),
      limit(MAX_CACHED_ALERTS)
    );

    const unsubscribe = onSnapshot(flaggedQuery, (snapshot) => {
      const flagged = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFlaggedMessages(flagged);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Optimized alert handling with batching
  const handleAlert = useCallback(async (alertId, action) => {
    const alert = alertsRef.current.find(a => a.id === alertId);
    if (!alert) return false;

    try {
      const batch = writeBatch(db);

      if (action === 'remove') {
        batch.update(doc(db, 'messages', alert.messageId), {
          text: '[Message removed by moderator]',
          isRemoved: true,
          removedAt: serverTimestamp(),
        });
      }

      batch.update(doc(db, 'chatAbuse', alert.id), {
        status: action,
        resolvedAt: serverTimestamp(),
      });

      await batch.commit();

      // Update local state
      alertsRef.current = alertsRef.current.filter(a => a.id !== alertId);
      setChatAlerts(alertsRef.current);
      return true;
    } catch (error) {
      console.error('Error handling chat alert:', error);
      return false;
    }
  }, []);

  // Optimized message moderation with batching
  const moderateMessage = useCallback(async (messageId, action) => {
    try {
      const batch = writeBatch(db);
      const messageRef = doc(db, 'messages', messageId);
      const updates = {
        moderationStatus: action,
        moderatedAt: serverTimestamp(),
      };

      if (action === 'removed') {
        updates.text = '[Message removed by moderator]';
        updates.isRemoved = true;
      }

      batch.update(messageRef, updates);
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error moderating message:', error);
      return false;
    }
  }, []);

  return {
    chatAlerts: alertsRef.current,
    flaggedMessages,
    loading,
    handleAlert,
    moderateMessage
  };
};

export default useChatModeration;
