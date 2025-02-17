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

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Initialize persistence only once and handle errors properly
const initializeFirebase = async () => {
  try {
    // Enable auth persistence
    await setPersistence(auth, browserLocalPersistence);
    
    // Enable Firestore offline persistence
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true
    }).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Multiple tabs open, persistence can only be enabled in one tab');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser doesn\'t support persistence');
      }
    });

  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
};

// Initialize Firebase features
initializeFirebase();

// Handle online/offline state
window.addEventListener('online', () => enableNetwork(db));
window.addEventListener('offline', () => disableNetwork(db));

export { auth, db, storage, analytics, getRedirectResult };
