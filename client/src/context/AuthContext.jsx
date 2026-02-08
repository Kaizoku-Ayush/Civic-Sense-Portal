import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChanged, getCurrentUserToken } from '../services/auth';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          setFirebaseUser(firebaseUser);
          
          // Get ID token
          const token = await firebaseUser.getIdToken();
          
          // Store token
          localStorage.setItem('authToken', token);
          
          // Fetch user data from backend
          try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
          } catch (apiError) {
            console.error('Failed to fetch user data:', apiError);
            // If user not in database, try to register
            if (apiError.response?.status === 401) {
              const registerResponse = await api.post('/auth/login', { idToken: token });
              setUser(registerResponse.data.user);
            }
          }
        } else {
          // User is signed out
          setFirebaseUser(null);
          setUser(null);
          localStorage.removeItem('authToken');
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      const response = await api.put('/auth/me', updates);
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    error,
    refreshUser,
    updateUserProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isDepartmentStaff: user?.role === 'DEPARTMENT_STAFF',
    isCitizen: user?.role === 'CITIZEN'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
