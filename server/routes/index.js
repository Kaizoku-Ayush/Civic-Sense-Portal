import express from 'express';
import authRoutes from './auth.js';

const router = express.Router();

router.use('/auth', authRoutes);

// Future route mounts:
// router.use('/issues', issueRoutes);
// router.use('/departments', departmentRoutes);

export default router;
