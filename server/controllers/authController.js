import { query, transaction } from '../config/db.js';
import { verifyIdToken, getUserByUid } from '../config/firebase.js';

/**
 * Register a new user or login existing user
 * Frontend sends Firebase ID token after successful Firebase auth
 */
export const register = async (req, res) => {
  try {
    const { idToken, name, phone } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }
    
    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE firebase_uid = $1 OR email = $2',
      [uid, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'User already registered',
        user: existingUser.rows[0]
      });
    }
    
    // Create new user in database
    const result = await query(
      `INSERT INTO users (firebase_uid, email, name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uid, email, name || email.split('@')[0], phone || null, 'CITIZEN']
    );
    
    const newUser = result.rows[0];
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Login - verify token and return user data
 * This is called after Firebase authentication on frontend
 */
export const login = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }
    
    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);
    const { uid, email } = decodedToken;
    
    // Get user from database
    const result = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [uid]
    );
    
    if (result.rows.length === 0) {
      // User not in database, auto-register
      const newUserResult = await query(
        `INSERT INTO users (firebase_uid, email, name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [uid, email, email.split('@')[0], 'CITIZEN']
      );
      
      return res.status(201).json({
        success: true,
        message: 'User auto-registered',
        user: newUserResult.rows[0],
        isNewUser: true
      });
    }
    
    const user = result.rows[0];
    
    // Update last login
    await query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user,
      isNewUser: false
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Get current user profile
 * Requires authentication middleware
 */
export const getProfile = async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    const userId = req.user.id;
    
    const result = await query(
      `SELECT u.*, d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 * Requires authentication middleware
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, avatar_url } = req.body;
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    values.push(userId);
    
    const result = await query(
      `UPDATE users 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Delete user account
 * Requires authentication middleware
 */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await transaction(async (client) => {
      // Delete user (cascade will handle related records)
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    });
    
    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
};
