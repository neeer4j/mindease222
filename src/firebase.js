import { initializeApp } from "firebase/app";
import { getAuth, getRedirectResult, setPersistence, browserLocalPersistence, connectAuthEmulator } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED, disableNetwork, enableNetwork, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCdkoemLCIWaQjupsyBVTr2L6IVPD_pjNw",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "mindease-dbed7.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "mindease-dbed7",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "mindease-dbed7.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "873314691877",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:873314691877:web:0d85525d4f8c4a0d9a88cc",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-9PHFB6W537",
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Initialize persistence with retry mechanism
const initializeFirebase = async (retryCount = 0) => {
  try {
    // Enable auth persistence
    await setPersistence(auth, browserLocalPersistence);
    
    // Enable Firestore offline persistence with retry
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true,
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    }).catch(async (err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser doesn\'t support persistence');
      } else if (retryCount < 3) {
        // Wait and retry initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        return initializeFirebase(retryCount + 1);
      }
    });

    // Test connection and enable/disable network accordingly
    const testConnection = async () => {
      try {
        await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ returnSecureToken: true })
        });
        await enableNetwork(db);
      } catch (error) {
        await disableNetwork(db);
        console.warn('Network connection unavailable, switching to offline mode');
      }
    };

    // Initial connection test
    await testConnection();

    // Set up connection monitoring
    setInterval(testConnection, 30000); // Check connection every 30 seconds

  } catch (error) {
    console.error("Firebase initialization error:", error);
    if (retryCount < 3) {
      // Wait and retry initialization
      await new Promise(resolve => setTimeout(resolve, 1000));
      return initializeFirebase(retryCount + 1);
    }
  }
};

// Initialize Firebase features
initializeFirebase();

// Handle online/offline state
window.addEventListener('online', async () => {
  try {
    await enableNetwork(db);
    console.log('Network connection restored');
  } catch (error) {
    console.error('Error enabling network:', error);
  }
});

window.addEventListener('offline', async () => {
  try {
    await disableNetwork(db);
    console.log('Switched to offline mode');
  } catch (error) {
    console.error('Error disabling network:', error);
  }
});

export { auth, db, storage, analytics, getRedirectResult };