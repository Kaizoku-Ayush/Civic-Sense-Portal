import express from 'express';
import authRoutes from './auth.js';
import issueRoutes from './issues.js';
import adminRoutes from './admin.js';
import analyticsRoutes from './analytics.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/issues', issueRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
