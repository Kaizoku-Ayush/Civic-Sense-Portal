import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
// For development, you can use the Firebase emulator or service account key
// For production, use environment variables

let firebaseApp;

try {
  // Check if running with service account key file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = JSON.parse(
      readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
    );
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } 
  // Use service account key from environment variable (for production)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
  // For development without service account
  else if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Firebase Admin running in development mode without service account');
    // You can use Firebase emulator or skip verification in development
    firebaseApp = null;
  } else {
    throw new Error('Firebase credentials not configured');
  }
  
  if (firebaseApp) {
    console.log('✅ Firebase Admin SDK initialized');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Verify Firebase ID token
export const verifyIdToken = async (idToken) => {
  try {
    if (!firebaseApp) {
      // In development mode without Firebase setup, skip verification
      if (process.env.NODE_ENV === 'development' && process.env.SKIP_FIREBASE_AUTH === 'true') {
        console.warn('⚠️  Skipping Firebase token verification (development mode)');
        return { uid: 'dev-user-id', email: 'dev@example.com' };
      }
      throw new Error('Firebase Admin not initialized');
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error.message);
    throw error;
  }
};

// Get user by UID
export const getUserByUid = async (uid) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase Admin not initialized');
    }
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Get user error:', error.message);
    throw error;
  }
};

// Create custom token (for testing)
export const createCustomToken = async (uid) => {
  try {
    if (!firebaseApp) {
      throw new Error('Firebase Admin not initialized');
    }
    const customToken = await admin.auth().createCustomToken(uid);
    return customToken;
  } catch (error) {
    console.error('Create custom token error:', error.message);
    throw error;
  }
};

export { admin, firebaseApp };
