import { initializeApp } from "firebase/app";
import { getAuth, getRedirectResult } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

export { auth, db, storage, getRedirectResult };
