import { initializeApp } from "firebase/app";
import { getAuth, getRedirectResult, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED, disableNetwork, enableNetwork } from "firebase/firestore";
import { getStorage } from "firebase/storage";
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Enable offline persistence for auth
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

// Function to handle persistence enablement
const enablePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
  } catch (err) {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Multiple tabs open, persistence disabled');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Persistence not supported in this browser');
    }
  }
};

// Function to handle connection state
const handleConnectionState = async () => {
  if (!navigator.onLine) {
    await disableNetwork(db);
  } else {
    await enableNetwork(db);
  }
};

// Initialize persistence
enablePersistence();

// Add network listeners
window.addEventListener('online', handleConnectionState);
window.addEventListener('offline', handleConnectionState);

export { auth, db, storage, analytics, getRedirectResult };
