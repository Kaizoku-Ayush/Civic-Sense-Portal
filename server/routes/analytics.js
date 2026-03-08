import express from 'express';
import { Issue, User } from '../models/index.js';

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', async (_req, res) => {
  try {
    const [total, byStatus, byCategory, resolvedDocs] = await Promise.all([
      Issue.countDocuments(),
      Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Issue.find({ status: 'RESOLVED', resolvedAt: { $ne: null } })
        .select('createdAt resolvedAt')
        .lean(),
    ]);

    const statusMap = {};
    byStatus.forEach(({ _id, count }) => { statusMap[_id.toLowerCase()] = count; });

    const categoryMap = {};
    byCategory.forEach(({ _id, count }) => { categoryMap[_id] = count; });

    let avgResolutionHours = null;
    if (resolvedDocs.length > 0) {
      const totalMs = resolvedDocs.reduce(
        (sum, d) => sum + (new Date(d.resolvedAt) - new Date(d.createdAt)),
        0
      );
      avgResolutionHours = Math.round(totalMs / resolvedDocs.length / 3_600_000 * 10) / 10;
    }

    const since7Days = new Date(Date.now() - 7 * 24 * 3_600_000);
    const resolvedLast7Days = await Issue.countDocuments({
      status: 'RESOLVED',
      resolvedAt: { $gte: since7Days },
    });

    return res.json({ total, byStatus: statusMap, byCategory: categoryMap, avgResolutionHours, resolvedLast7Days });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// GET /api/analytics/timeline?days=30
router.get('/timeline', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 24 * 3_600_000);

    const data = await Issue.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// GET /api/analytics/heatmap
router.get('/heatmap', async (_req, res) => {
  try {
    const issues = await Issue.find(
      { location: { $exists: true } },
      { location: 1, aiSeverityScore: 1 }
    ).lean();

    const points = issues.map((i) => ({
      lat: i.location.coordinates[1],
      lng: i.location.coordinates[0],
      weight: i.aiSeverityScore ?? 0.5,
    }));

    return res.json(points);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

// GET /api/analytics/leaderboard
router.get('/leaderboard', async (_req, res) => {
  try {
    const users = await User.find({ civicPoints: { $gt: 0 } })
      .select('name avatarUrl role civicPoints')
      .sort({ civicPoints: -1 })
      .limit(20)
      .lean();
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', code: 'SERVER_ERROR' });
  }
});

export default router;
