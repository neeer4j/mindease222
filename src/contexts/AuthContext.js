import React, { createContext, useState, useEffect, useContext } from "react";
import { auth, db, storage } from "../firebase"; // Ensure correct path
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  getRedirectResult,
  GoogleAuthProvider,
  updateEmail,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
  // Optionally, import reauthenticateWithCredential and EmailAuthProvider if implementing reauthentication
} from "firebase/auth";

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

import LoadingSpinner from "../components/LoadingSpinner"; // Your LoadingSpinner component
import ErrorAlert from "../components/ErrorAlert"; // Your ErrorAlert component
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to get user from localStorage on initial load
    const savedUser = localStorage.getItem('authUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true); // Indicates if auth state is being determined
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSplash, setShowSplash] = useState(false); // Initialize to false
  const [isInAdminMode, setIsInAdminMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const googleProvider = new GoogleAuthProvider();

  // Set Firebase persistence on mount
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log('Firebase persistence set to LOCAL');
      } catch (err) {
        console.error('Error setting persistence:', err);
      }
    };
    setupPersistence();
  }, []);

  // Add network status listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, try to sync with Firebase
      if (auth.currentUser) {
        auth.currentUser.reload().catch(console.error);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup function to detach all listeners
  const cleanup = (unsubscribe) => {
    if (unsubscribe && typeof unsubscribe === 'function') {
      try {
        unsubscribe();
      } catch (err) {
        console.error('Error during cleanup:', err);
      }
    }
    setUser(null);
    setIsAdmin(false);
    setIsBanned(false);
    setError(null);
    setSuccess(null);
    setShowSplash(false);
    setIsInAdminMode(false);
  };

  // Modify fetchUserProfile to handle offline state
  const fetchUserProfile = async (uid) => {
    try {
      if (!isOnline) {
        const cachedUser = localStorage.getItem('authUser');
        if (cachedUser) {
          return JSON.parse(cachedUser);
        }
        throw new Error("No cached user data available offline");
      }

      const userDocRef = doc(db, "users", uid);
      const userSnapshot = await getDoc(userDocRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        // Cache the user data
        localStorage.setItem('authUser', JSON.stringify(userData));
        return userData;
      } else {
        const defaultProfile = {
          displayName: auth.currentUser?.displayName || "",
          email: auth.currentUser?.email || "",
          phone: "",
          address: "",
          avatar: "",
          createdAt: new Date().toISOString(),
        };
        if (isOnline) {
          await setDoc(userDocRef, defaultProfile);
        }
        localStorage.setItem('authUser', JSON.stringify(defaultProfile));
        return defaultProfile;
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      // If offline, try to use cached data
      const cachedUser = localStorage.getItem('authUser');
      if (cachedUser) {
        return JSON.parse(cachedUser);
      }
      throw new Error("Failed to fetch user profile.");
    }
  };

  // Handle Firebase errors
  const handleFirebaseError = (err) => {
    console.error("Firebase Authentication Error Code:", err.code);
    console.error("Firebase Authentication Error Message:", err.message);

    const errorMap = {
      "auth/invalid-email": "Invalid email address.",
      "auth/user-disabled": "Your account has been disabled.",
      "auth/user-not-found": "No user found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/email-already-in-use": "This email is already in use.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/popup-closed-by-user": "Authentication popup closed by user.",
      "auth/cancelled-popup-request": "Cancelled popup request.",
      "auth/account-exists-with-different-credential":
        "An account already exists with the same email address but different sign-in method. Please sign in using Google.",
      "auth/invalid-credential":
        "Invalid email or password. If you signed up with Google, please use the Google sign-in method.",
      "auth/redirect-operation-pending": "Redirect operation is pending. Please wait.",
    };

    setError(errorMap[err.code] || "An unexpected error occurred.");
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(null);

  // Check user role
  const checkUserRole = async (user) => {
    if (!user) return false;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.role === "admin";
    }
    return false;
  };

  // Check user ban status
  const checkUserBanStatus = async (user) => {
    if (!user) return false;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.isBanned || false;
    }
    return false;
  };

  // Listen for auth state changes and process any redirect result
  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeUser;

    const setupAuthListener = () => {
      // Store cleanup functions in an array
      const cleanupFns = [];

      unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log("[onAuthStateChanged] firebaseUser:", firebaseUser);
        if (!firebaseUser) {
          setUser(null);
          setIsAdmin(false);
          setIsInAdminMode(false);
          // Clear local storage when user logs out
          localStorage.removeItem('authUser');
          setLoading(false);
          return;
        }

        try {
          const isUserAdmin = await checkUserRole(firebaseUser);
          const userBanned = await checkUserBanStatus(firebaseUser);
          
          if (userBanned) {
            setIsBanned(true);
            setUser(firebaseUser);
            setIsAdmin(false);
            setIsInAdminMode(false);
          } else {
            setIsBanned(false);
            const userProfile = await fetchUserProfile(firebaseUser.uid);
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              ...userProfile,
            };
            setUser(userData);
            // Store user data in localStorage for offline access
            localStorage.setItem('authUser', JSON.stringify(userData));
            setIsAdmin(isUserAdmin);
            setIsInAdminMode(isUserAdmin && !isMobile);
            console.log("[onAuthStateChanged] User profile loaded and state updated.");
          }
        } catch (err) {
          console.error("Error fetching user profile in onAuthStateChanged:", err);
          // If offline, try to use cached user data
          const cachedUser = localStorage.getItem('authUser');
          if (cachedUser) {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
            setIsAdmin(userData.isAdmin || false);
            setIsInAdminMode(userData.isAdmin && !isMobile);
          } else {
            setError("Failed to load user profile.");
            setUser(null);
            setIsAdmin(false);
            setIsInAdminMode(false);
          }
        } finally {
          setLoading(false);
          console.log("[onAuthStateChanged] Loading set to false.");
        }
      });

      cleanupFns.push(unsubscribeAuth);
      return () => cleanupFns.forEach(fn => fn && fn());
    };

    const cleanup = unsubscribe => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      }
      setUser(null);
      setIsAdmin(false);
      setIsBanned(false);
      setError(null);
      setSuccess(null);
      setShowSplash(false);
      setIsInAdminMode(false);
      localStorage.removeItem('authUser');
    };

    const unsubscribe = setupAuthListener();
    return () => cleanup(unsubscribe);
  }, [isMobile]);

  // Reset splash screen when user logs out
  useEffect(() => {
    if (!user) {
      setShowSplash(false);
    }
  }, [user]);

  // Modify login function to handle offline state
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!isOnline) {
        const cachedUser = localStorage.getItem('authUser');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          if (userData.email === email) {
            setUser(userData);
            setIsAdmin(userData.isAdmin || false);
            setIsInAdminMode(userData.isAdmin && !isMobile);
            setSuccess("Logged in from cached data (offline mode).");
            return;
          }
        }
        throw new Error("Cannot login while offline without cached credentials");
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      const isUserAdmin = await checkUserRole(result.user);
      setIsAdmin(isUserAdmin);
      setIsInAdminMode(isUserAdmin && !isMobile);
      setSuccess("Logged in successfully.");
      setShowSplash(true);
    } catch (err) {
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (email, password, displayName) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      const userRef = doc(db, "users", userCredential.user.uid);
      await setDoc(userRef, {
        displayName: displayName,
        email: email,
        phone: "",
        address: "",
        avatar: "",
        createdAt: new Date().toISOString(),
      });
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        phone: "",
        address: "",
        avatar: "",
        createdAt: new Date().toISOString(),
      });
      setSuccess("Signup successful! Welcome.");
      setShowSplash(true);
    } catch (err) {
      console.error("Signup error:", err);
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setIsInAdminMode(false); // Reset admin mode on logout
      setSuccess("Logged out successfully.");
    } catch (err) {
      console.error("Logout Error:", err);
      setError("Failed to logout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google – ALWAYS USE POPUP
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const userProfile = await fetchUserProfile(firebaseUser.uid);
      const isUserAdmin = await checkUserRole(firebaseUser);
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        ...userProfile,
      });
      setIsAdmin(isUserAdmin);
      // Set admin mode to true by default for admin users on desktop
      setIsInAdminMode(isUserAdmin && !isMobile);
      setSuccess("Signed in with Google successfully.");
    } catch (err) {
      console.error("Google Sign-In error:", err);
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to upload avatar image
  const uploadAvatar = async (file) => {
    if (!user) {
      setError("No authenticated user.");
      return;
    }
    console.log("🚀 Starting avatar upload...");
    console.log("📂 Selected file:", file);
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("❌ Only JPG, PNG, and GIF files are allowed.");
      }
      const filename = `${user.uid}/${uuidv4()}-${file.name}`;
      console.log("📁 Storing file at:", `avatars/${filename}`);
      const storageRef = ref(storage, `avatars/${filename}`);
      console.log("⏳ Uploading file...");
      await uploadBytes(storageRef, file);
      console.log("✅ File uploaded successfully!");
      const downloadURL = await getDownloadURL(storageRef);
      console.log("🌍 Download URL:", downloadURL);
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { avatar: downloadURL }, { merge: true });
      console.log("🔥 Firestore updated with avatar URL!");
      setUser((prevUser) => ({
        ...prevUser,
        avatar: downloadURL,
      }));
      setSuccess("Avatar uploaded successfully!");
    } catch (err) {
      console.error("❌ Error uploading avatar:", err);
      setError(err.message || "Failed to upload avatar.");
    } finally {
      setLoading(false);
    }
  };

  // Function to delete avatar image
  const deleteAvatar = async () => {
    if (!user || !user.avatar) {
      setError("No avatar to delete.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Decode the URL to reliably extract the storage path
      const decodedUrl = decodeURIComponent(user.avatar);
      const startIndex = decodedUrl.indexOf("/o/") + 3;
      const endIndex = decodedUrl.indexOf("?");
      const storagePath = decodedUrl.substring(startIndex, endIndex);
      const avatarRef = ref(storage, storagePath);
      await deleteObject(avatarRef);
      // Update the user data to remove the avatar URL
      await updateUserData("avatar", "");
      setSuccess("Avatar removed successfully.");
    } catch (err) {
      console.error("Error removing avatar:", err);
      setError(err.message || "Failed to remove avatar.");
    } finally {
      setLoading(false);
    }
  };

  // Function to update user data
  const updateUserData = async (field, value) => {
    if (!user) {
      throw new Error("No authenticated user.");
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const userDocRef = doc(db, "users", user.uid);
      let updatedData = {};
      switch (field) {
        case "name":
          await updateProfile(auth.currentUser, { displayName: value });
          updatedData.displayName = value;
          await auth.currentUser.reload();
          break;
        case "email":
          await updateEmail(auth.currentUser, value);
          updatedData.email = value;
          break;
        case "password":
          // To update password, Firebase requires recent authentication.
          // If you get the "auth/requires-recent-login" error, inform the user to reauthenticate.
          try {
            await updatePassword(auth.currentUser, value);
          } catch (error) {
            if (error.code === "auth/requires-recent-login") {
              setError(
                "Updating your password requires you to log in again. Please sign out and sign in again before updating your password."
              );
              return;
            }
            throw error;
          }
          break;
        case "avatar":
          updatedData.avatar = value;
          break;
        default:
          updatedData[field] = value;
          break;
      }
      if (field !== "password") {
        await setDoc(userDocRef, updatedData, { merge: true });
      }
      const updatedProfile = await fetchUserProfile(user.uid);
      setUser((prevUser) => ({
        ...prevUser,
        ...updatedProfile,
        displayName: field === "name" ? value : prevUser?.displayName,
        email: field === "email" ? value : prevUser?.email,
      }));
      setSuccess(`${capitalize(field)} updated successfully.`);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      setError(err.message || `Failed to update ${field}.`);
    } finally {
      setLoading(false);
    }
  };

  // Function to ban user
  const banUser = async (userId) => {
    if (!isAdmin) throw new Error("Unauthorized action");
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isBanned: true,
      bannedAt: new Date().toISOString(),
    });
  };

  // Function to unban user
  const unbanUser = async (userId) => {
    if (!isAdmin) throw new Error("Unauthorized action");
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isBanned: false,
      bannedAt: null,
    });
  };

  // Helper to capitalize strings
  const capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const toggleAdminMode = () => {
    setIsInAdminMode(prev => !prev);
  };

  // Add resetPassword function
  const resetPassword = async (email) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent successfully!');
    } catch (err) {
      handleFirebaseError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        isAdmin,
        isBanned,
        login,
        signup,
        logout,
        loading,
        error, // Expose only 'error'
        success, // Expose success messages
        signInWithGoogle,
        updateUserData,
        uploadAvatar, // Expose uploadAvatar function
        deleteAvatar, // Expose deleteAvatar function
        clearError, // Expose clearError function
        clearSuccess, // Expose clearSuccess function
        setError, // Expose setError function
        banUser, // Expose banUser function
        unbanUser, // Expose unbanUser function
        showSplash,
        setShowSplash,
        isInAdminMode,
        toggleAdminMode,
        isOnline, // Add this to the context value
        resetPassword, // Add resetPassword to the context value
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;