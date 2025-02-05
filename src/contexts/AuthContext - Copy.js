import React, { createContext, useState, useEffect } from "react";
import { auth, db, storage } from "../firebase"; // Firebase services
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    signInWithPopup,
    GoogleAuthProvider,
    updateEmail,
    updatePassword,
} from "firebase/auth";
import {
    doc,
    getDoc,
    setDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; // Storage functions
import { v4 as uuidv4 } from "uuid"; // For unique filenames

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const googleProvider = new GoogleAuthProvider();

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userProfile = await fetchUserProfile(firebaseUser.uid);
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        ...userProfile,
                    });
                } catch (err) {
                    console.error("Error during onAuthStateChanged:", err);
                    setError("Failed to load user profile.");
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch user profile from Firestore
    const fetchUserProfile = async (uid) => {
        try {
            const userDocRef = doc(db, "users", uid);
            const userSnapshot = await getDoc(userDocRef);

            if (userSnapshot.exists()) {
                return userSnapshot.data();
            } else {
                const defaultProfile = {
                    displayName: auth.currentUser.displayName || "",
                    email: auth.currentUser.email || "",
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

    // Login function
    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
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
                displayName,
                email,
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

    // Google sign-in
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
            handleFirebaseError(err);
        } finally {
            setLoading(false);
        }
    };

    // Update user data
    const updateUserData = async (field, value) => {
        if (!user) {
            throw new Error("No authenticated user.");
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const userDocRef = doc(db, "users", user.uid);
            const updatedData = { [field]: value };

            if (field === "name") {
                await updateProfile(auth.currentUser, { displayName: value });
                updatedData.displayName = value;
            } else if (field === "email") {
                await updateEmail(auth.currentUser, value);
                updatedData.email = value;
            } else if (field === "password") {
                await updatePassword(auth.currentUser, value);
                setSuccess("Password updated successfully.");
                return;
            }

            await setDoc(userDocRef, updatedData, { merge: true });
            setUser((prevUser) => ({ ...prevUser, ...updatedData }));
            setSuccess(`${capitalize(field)} updated successfully.`);
        } catch (err) {
            console.error(`Error updating ${field}:`, err);
            setError(err.message || `Failed to update ${field}.`);
        } finally {
            setLoading(false);
        }
    };

    // Handle Firebase errors
    const handleFirebaseError = (err) => {
        const errorMap = {
            "auth/invalid-email": "Invalid email address.",
            "auth/user-disabled": "Your account has been disabled.",
            "auth/user-not-found": "No user found with this email.",
            "auth/wrong-password": "Incorrect password.",
            "auth/email-already-in-use": "This email is already in use.",
            "auth/weak-password": "Password should be at least 6 characters.",
            "auth/popup-closed-by-user": "Authentication popup closed by user.",
        };
        setError(errorMap[err.code] || "An unexpected error occurred.");
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!user,
                user,
                login,
                signup,
                logout,
                loading,
                error,
                success,
                signInWithGoogle,
                updateUserData,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
