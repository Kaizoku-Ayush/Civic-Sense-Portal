import { verifyIdToken } from '../config/firebase.js';
import { query } from '../config/db.js';

/**
 * Middleware to verify Firebase authentication token
 * Adds user data to req.user if authentication is successful
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify token with Firebase
    const decodedToken = await verifyIdToken(idToken);
    
    // Fetch user from database
    const result = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found in database'
      });
    }
    
    // Attach user to request object
    req.user = result.rows[0];
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token expired'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

/**
 * Middleware to check if user has specific role(s)
 * Usage: authorize(['ADMIN', 'DEPARTMENT_STAFF'])
 */
export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (allowedRoles.length === 0) {
      return next();
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredRole: allowedRoles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 * Useful for public endpoints that have extra features for authenticated users
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    
    const result = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );
    
    if (result.rows.length > 0) {
      req.user = result.rows[0];
      req.firebaseUser = decodedToken;
    }
    
    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};
