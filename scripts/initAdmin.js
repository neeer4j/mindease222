const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to add your Firebase Admin SDK service account key
const readline = require('readline');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function initializeFirstAdmin() {
    try {
        console.log('=== Admin User Initialization ===');
        
        // Get email from command line
        const email = await new Promise((resolve) => {
            rl.question('Enter the email of the user to make admin: ', (answer) => {
                resolve(answer.trim());
            });
        });

        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Update custom claims to include admin role
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            admin: true
        });

        // Update user document in Firestore
        const db = admin.firestore();
        await db.collection('users').doc(userRecord.uid).update({
            role: 'admin',
            isAdmin: true,
            adminSince: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        console.log(`Successfully set admin privileges for ${email}`);
        console.log('Please sign out and sign back in for the changes to take effect.');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        rl.close();
        process.exit(0);
    }
}

initializeFirstAdmin();