import React, { createContext, useState, useEffect } from "react";
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
  // Optionally, import reauthenticateWithCredential and EmailAuthProvider if implementing reauthentication
} from "firebase/auth";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

import LoadingSpinner from "../components/LoadingSpinner"; // Your LoadingSpinner component
import ErrorAlert from "../components/ErrorAlert"; // Your ErrorAlert component

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Indicates if auth state is being determined
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const googleProvider = new GoogleAuthProvider();

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userSnapshot = await getDoc(userDocRef);
      if (userSnapshot.exists()) {
        return userSnapshot.data();
      } else {
        const defaultProfile = {
          displayName: auth.currentUser?.displayName || "",
          email: auth.currentUser?.email || "",
          phone: "",
          address: "",
          avatar: "",
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, defaultProfile);
        return defaultProfile;
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
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

  // Listen for auth state changes and process any redirect result (if present)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[onAuthStateChanged] firebaseUser:", firebaseUser);
      if (firebaseUser) {
        try {
          const userProfile = await fetchUserProfile(firebaseUser.uid);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            ...userProfile,
          });
          console.log("[onAuthStateChanged] User profile loaded and state updated.");
        } catch (err) {
          console.error("Error fetching user profile in onAuthStateChanged:", err);
          setError("Failed to load user profile.");
          setUser(null);
        } finally {
          setLoading(false);
          console.log("[onAuthStateChanged] Loading set to false.");
        }
      } else {
        console.log("[onAuthStateChanged] No user detected. Checking for redirect result...");
        getRedirectResult(auth)
          .then(async (result) => {
            console.log("[getRedirectResult] Result:", result);
            if (result && result.user) {
              const firebaseUserFromRedirect = result.user;
              try {
                const userProfile = await fetchUserProfile(firebaseUserFromRedirect.uid);
                setUser({
                  uid: firebaseUserFromRedirect.uid,
                  email: firebaseUserFromRedirect.email,
                  displayName: firebaseUserFromRedirect.displayName,
                  ...userProfile,
                });
                setSuccess("Signed in with Google successfully.");
                console.log("[getRedirectResult] Redirect user profile loaded.");
              } catch (profileErr) {
                console.error("Error fetching user profile after redirect:", profileErr);
                setError("Failed to load user profile after Google Sign-in.");
                setUser(null);
              } finally {
                setLoading(false);
                console.log("[getRedirectResult] Loading set to false after redirect.");
              }
            } else {
              console.log("[getRedirectResult] No redirect result found.");
              setLoading(false);
              console.log("[getRedirectResult] Loading set to false - no redirect result.");
            }
          })
          .catch((redirectError) => {
            console.error("[getRedirectResult] Error:", redirectError);
            handleFirebaseError(redirectError);
            setUser(null);
            setLoading(false);
            console.log("[getRedirectResult] Loading set to false after redirect error.");
          });
      }
    }, (error) => {
      console.error("onAuthStateChanged error:", error);
      setLoading(false);
      setError("Error during authentication state check.");
    });

    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email, password) => {
    console.log("Attempting to log in with:", email);
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful for:", email);
    } catch (err) {
      console.error("Login error:", err);
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
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        ...userProfile,
      });
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

  // Helper to capitalize strings
  const capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
