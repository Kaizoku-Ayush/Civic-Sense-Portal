import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { Issue } from '../models/index.js';
import {
  createIssue,
  listIssues,
  getIssue,
  updateIssueStatus,
  upvoteIssue,
} from '../controllers/issueController.js';

const router = express.Router();

// Store image in memory so we can pass buffer to Cloudinary + AI service
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

router.get('/', listIssues);

// GET /api/issues/department — department staff see only their assigned queue
router.get('/department', authenticate, authorize(['DEPARTMENT_STAFF', 'ADMIN']), async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    // DEPARTMENT_STAFF are scoped to their own department
    const deptId = req.user.role === 'DEPARTMENT_STAFF' ? req.user.departmentId : req.query.departmentId;
    if (!deptId) {
      return res.status(400).json({ error: 'No department assigned', code: 'NO_DEPARTMENT' });
    }

    const filter = { assignedDepartment: deptId };
    if (status) filter.status = status.toUpperCase();

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('userId', 'name email')
        .lean(),
      Issue.countDocuments(filter),
    ]);

    return res.json({ issues, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

router.get('/:id', getIssue);
router.post('/', authenticate, upload.single('image'), createIssue);
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'DEPARTMENT_STAFF']), updateIssueStatus);
router.post('/:id/upvote', authenticate, upvoteIssue);

export default router;
