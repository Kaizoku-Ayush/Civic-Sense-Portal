import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { Issue, User, Department, IssueUpdate } from '../models/index.js';
import { io } from '../app.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize(['ADMIN']));

// GET /api/admin/stats — analytics summary for admin dashboard
router.get('/stats', async (_req, res) => {
  try {
    const [total, byStatus, byCategory, avgSeverityResult] = await Promise.all([
      Issue.countDocuments(),
      Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: null, avg: { $avg: '$aiSeverityScore' } } }]),
    ]);

    const statusMap = {};
    byStatus.forEach(({ _id, count }) => { statusMap[_id.toLowerCase()] = count; });

    const categoryMap = {};
    byCategory.forEach(({ _id, count }) => { categoryMap[_id] = count; });

    return res.json({
      total,
      pending: statusMap.pending || 0,
      acknowledged: statusMap.acknowledged || 0,
      inProgress: statusMap.in_progress || 0,
      resolved: statusMap.resolved || 0,
      rejected: statusMap.rejected || 0,
      duplicate: statusMap.duplicate || 0,
      byCategory: categoryMap,
      avgSeverity: avgSeverityResult[0]?.avg != null
        ? Math.round(avgSeverityResult[0].avg * 100) / 100
        : null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// GET /api/admin/issues — full list with filters
router.get('/issues', async (req, res) => {
  try {
    const { category, status, departmentId, page = 1, limit = 50, sort = '-createdAt' } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status.toUpperCase();
    if (departmentId) filter.assignedDepartment = departmentId;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('userId', 'name email')
        .populate('assignedDepartment', 'name')
        .lean(),
      Issue.countDocuments(filter),
    ]);

    return res.json({ issues, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// PATCH /api/admin/issues/:id/assign
router.patch('/issues/:id/assign', async (req, res) => {
  try {
    const { departmentId } = req.body;
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { assignedDepartment: departmentId || null },
      { new: true }
    ).populate('assignedDepartment', 'name');

    if (!issue) return res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' });
    return res.json(issue);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// PATCH /api/admin/issues/:id — full update (status + department + priority)
router.patch('/issues/:id', async (req, res) => {
  try {
    const { status, assignedDepartment, priority, comment } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' });

    const updates = {};
    const oldStatus = issue.status;
    if (status) updates.status = status;
    if (assignedDepartment !== undefined) updates.assignedDepartment = assignedDepartment || null;
    if (priority) updates.priority = priority;
    if (status === 'RESOLVED' && !issue.resolvedAt) updates.resolvedAt = new Date();

    const updated = await Issue.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('userId', 'name email')
      .populate('assignedDepartment', 'name');

    // Create timeline entry when status changes
    if (status && status !== oldStatus) {
      await IssueUpdate.create({
        issueId: issue._id,
        userId: req.user._id,
        oldStatus,
        newStatus: status,
        comment: comment || `Status updated to ${status} by admin`,
        isPublic: true,
      });
    }

    // Broadcast to all clients & specific department room
    io.emit('issue:updated', { issueId: issue._id.toString(), status: updated.status });
    if (updated.assignedDepartment) {
      io.to(`dept:${updated.assignedDepartment._id}`).emit('queue:updated', updated);
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// POST /api/admin/issues/bulk — bulk status / department update
router.post('/issues/bulk', async (req, res) => {
  try {
    const { ids, status, assignedDepartment } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required', code: 'VALIDATION_ERROR' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (assignedDepartment !== undefined) updates.assignedDepartment = assignedDepartment || null;
    if (status === 'RESOLVED') updates.resolvedAt = new Date();

    const result = await Issue.updateMany({ _id: { $in: ids } }, { $set: updates });
    io.emit('issues:bulk-updated', { ids, updates });

    return res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// GET /api/admin/departments
router.get('/departments', async (_req, res) => {
  const depts = await Department.find().lean();
  return res.json(depts);
});

// POST /api/admin/departments
router.post('/departments', async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    return res.status(201).json(dept);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message, code: 'VALIDATION_ERROR' });
  }
});

// GET /api/admin/users
router.get('/users', async (_req, res) => {
  const users = await User.find().select('-__v').lean();
  return res.json(users);
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role, departmentId } = req.body;
    const update = { role };
    if (departmentId) update.departmentId = departmentId;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

export default router;
