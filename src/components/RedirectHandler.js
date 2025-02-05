// src/components/RedirectHandler.jsx
import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedirectResult } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthContext } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const RedirectHandler = () => {
  const navigate = useNavigate();
  const { setUserInternal, setSuccess, setError } = useContext(AuthContext);

  // A helper to fetch the user profile from Firestore.
  const fetchUserProfile = async (uid) => {
    const userDocRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userDocRef);
    if (userSnapshot.exists()) {
      return userSnapshot.data();
    } else {
      // If no profile exists, create a default profile
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
  };

  useEffect(() => {
    const processRedirect = async () => {
      try {
        // Process the redirect result.
        const result = await getRedirectResult(auth);
        if (result) {
          const firebaseUser = result.user;
          // Optionally, fetch or create the user's profile.
          const userProfile = await fetchUserProfile(firebaseUser.uid);
          // Use a helper from your AuthContext to update the internal user state.
          setUserInternal({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            ...userProfile,
          });
          setSuccess("Signed in with Google successfully.");
        }
      } catch (err) {
        console.error("Error processing redirect result:", err);
        setError(err.message || "Failed to process redirect.");
      } finally {
        // Whether successful or not, navigate away from the redirect page.
        navigate('/dashboard');
      }
    };

    processRedirect();
  }, [navigate, setError, setSuccess, setUserInternal]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
      <LoadingSpinner />
    </div>
  );
};

export default RedirectHandler;
