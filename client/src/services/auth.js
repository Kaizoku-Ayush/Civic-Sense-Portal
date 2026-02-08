import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import auth from '../config/firebase';
import api from './api';

/**
 * Sign up with email and password
 * Also registers user in backend database
 */
export const signUp = async (email, password, name, phone) => {
  try {
    // Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    if (name) {
      await updateProfile(user, { displayName: name });
    }
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    // Register in backend
    const response = await api.post('/auth/register', {
      idToken,
      name,
      phone
    });
    
    return {
      firebaseUser: user,
      userData: response.data.user
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get ID token and login to backend
    const idToken = await user.getIdToken();
    
    const response = await api.post('/auth/login', { idToken });
    
    return {
      firebaseUser: user,
      userData: response.data.user
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Get ID token and login to backend
    const idToken = await user.getIdToken();
    
    const response = await api.post('/auth/login', { idToken });
    
    return {
      firebaseUser: user,
      userData: response.data.user
    };
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

/**
 * Sign out
 */
export const logOut = async () => {
  try {
    await signOut(auth);
    // Clear any stored tokens
    localStorage.removeItem('authToken');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Get current user's ID token
 */
export const getCurrentUserToken = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Get token error:', error);
    return null;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthChanged = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get current Firebase user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Auth error messages mapping
export const getAuthErrorMessage = (error) => {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/operation-not-allowed': 'Operation not allowed',
    'auth/weak-password': 'Password is too weak (min 6 characters)',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-credential': 'Invalid email or password',
    'auth/too-many-requests': 'Too many failed attempts. Try again later',
    'auth/network-request-failed': 'Network error. Check your connection',
    'auth/popup-closed-by-user': 'Sign-in popup was closed',
  };
  
  return errorMessages[error.code] || error.message || 'An error occurred during authentication';
};

export default {
  signUp,
  signIn,
  signInWithGoogle,
  logOut,
  resetPassword,
  getCurrentUserToken,
  getCurrentUser,
  onAuthChanged,
  getAuthErrorMessage
};
