import { verifyIdToken } from '../config/firebase.js';
import User from '../models/User.js';

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
    const existingUser = await User.findOne({
      $or: [{ firebaseUid: uid }, { email }]
    });
    
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'User already registered',
        user: existingUser
      });
    }
    
    // Create new user in database
    const newUser = await User.create({
      firebaseUid: uid,
      email,
      name: name || email.split('@')[0],
      phone: phone || undefined,
      role: 'CITIZEN'
    });
    
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
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      // User not in database, auto-register
      user = await User.create({
        firebaseUid: uid,
        email,
        name: email.split('@')[0],
        role: 'CITIZEN'
      });
      
      return res.status(201).json({
        success: true,
        message: 'User auto-registered',
        user,
        isNewUser: true
      });
    }
    
    // Update last login timestamp
    user.updatedAt = new Date();
    await user.save();
    
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
    const user = await User.findById(req.user._id).populate('departmentId', 'name');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user
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
    const { name, phone, avatarUrl } = req.body;
    const allowedUpdates = {};
    
    if (name !== undefined) allowedUpdates.name = name;
    if (phone !== undefined) allowedUpdates.phone = phone;
    if (avatarUrl !== undefined) allowedUpdates.avatarUrl = avatarUrl;
    
    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { ...allowedUpdates },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
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
    await User.findByIdAndDelete(req.user._id);
    
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
