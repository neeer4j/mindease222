import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from './firebase';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

export const signInWithGoogle = async () => {
  try {
    // Sign in with Google using Capacitor
    const result = await FirebaseAuthentication.signInWithGoogle();
    
    if (!result.credential?.idToken) {
      throw new Error('No ID token present in credentials');
    }

    // Create a credential with the token
    const credential = GoogleAuthProvider.credential(
      result.credential.idToken,
      result.credential.accessToken
    );

    // Sign in to Firebase with the credential
    const userCredential = await signInWithCredential(auth, credential);
    
    return {
      user: userCredential.user,
      credential: credential
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await FirebaseAuthentication.signOut();
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const result = await FirebaseAuthentication.getCurrentUser();
    return result.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}; 