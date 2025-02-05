// src/components/FirebaseAuthUI.jsx
import React from 'react';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from '../firebase'; // Your Firebase config file

// Configure FirebaseUI.
const uiConfig = {
  // Use redirect sign-in flow.
  signInFlow: 'redirect',

  // Enable Google as the only sign-in provider.
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    // You can add more providers here (e.g., firebase.auth.EmailAuthProvider.PROVIDER_ID)
  ],

  // Callback after sign-in (return false to prevent automatic redirect).
  callbacks: {
    signInSuccessWithAuthResult: () => {
      // Returning false prevents automatic redirects.
      return false;
    },
  },
};

const FirebaseAuthUI = () => {
  return (
    <div>
      <h1>Sign in</h1>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />
    </div>
  );
};

export default FirebaseAuthUI;
