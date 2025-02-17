import { db } from '../firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

export const initializeAdmin = async (userEmail) => {
    try {
        // Query for the user document by email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error('User not found');
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Update or create the admin document
        const adminRef = doc(db, 'users', userDoc.id);
        await updateDoc(adminRef, {
            role: 'admin',
            isAdmin: true,
            adminSince: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return {
            success: true,
            message: `Admin role granted to ${userEmail}`
        };
    } catch (error) {
        console.error('Error initializing admin:', error);
        throw error;
    }
};