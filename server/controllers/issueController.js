import { v2 as cloudinary } from 'cloudinary';
import { Issue, IssueUpdate, Department } from '../models/index.js';
import { classifyImage } from '../services/aiService.js';
import { io } from '../app.js';

// Cloudinary is configured via env vars (CLOUDINARY_CLOUD_NAME, etc.)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Upload buffer to Cloudinary and return secure_url. */
async function uploadToCloudinary(buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'civic-sense/issues', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

/** Derive priority from severity score (0-1). */
function derivePriority(severityScore) {
  if (severityScore >= 0.9) return 'CRITICAL';
  if (severityScore >= 0.7) return 'HIGH';
  if (severityScore >= 0.5) return 'MEDIUM';
  return 'LOW';
}

/** Auto-assign department based on category. */
async function autoAssignDepartment(category) {
  const dept = await Department.findOne({
    categories: category,
  }).select('_id').lean();
  return dept?._id || null;
}

// ─── POST /api/issues ───────────────────────────────────────────────────────

export async function createIssue(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image is required', code: 'VALIDATION_ERROR' });
    }

    const { latitude, longitude, description, category: userCategory } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required', code: 'VALIDATION_ERROR' });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates', code: 'VALIDATION_ERROR' });
    }

    // 1. Upload image to Cloudinary
    const imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    // 2. AI classification (non-blocking fallback)
    let aiResult = null;
    try {
      aiResult = await classifyImage(req.file.buffer, req.file.mimetype, true);
    } catch (err) {
      console.warn('AI service unavailable, proceeding without AI:', err.message);
    }

    const finalCategory = userCategory || aiResult?.category || 'other';
    const severityScore = aiResult?.severity_score ?? 0.5;
    const imageHash = aiResult?.image_hash ?? null;

    // 3. Duplicate detection: geo proximity (50 m) + pHash similarity
    const nearbyIssues = await Issue.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: 50,
        },
      },
      status: { $nin: ['RESOLVED', 'REJECTED'] },
      imageHash: { $ne: null },
    }).select('_id imageHash').lean();

    let duplicateOf = null;
    if (imageHash && nearbyIssues.length > 0) {
      // Simple hex-hamming check (pHash is 16-char hex → 64-bit)
      for (const existing of nearbyIssues) {
        if (hexHamming(imageHash, existing.imageHash) < 10) {
          duplicateOf = existing._id;
          break;
        }
      }
    }

    // 4. Auto-route to department
    const assignedDepartment = await autoAssignDepartment(finalCategory);
    const priority = derivePriority(severityScore);

    // 5. Save issue
    const issue = await Issue.create({
      userId: req.user._id,
      category: finalCategory,
      aiCategory: aiResult?.category ?? null,
      aiConfidence: aiResult?.confidence ?? null,
      aiSeverityScore: severityScore,
      description: description?.slice(0, 500) || null,
      imageUrl,
      imageHash,
      location: { type: 'Point', coordinates: [lng, lat] },
      status: duplicateOf ? 'DUPLICATE' : 'PENDING',
      priority,
      assignedDepartment,
      duplicateOf,
    });

    // Attach Groq analysis as a virtual field on the response (not stored in DB)
    const responsePayload = issue.toObject();
    responsePayload.groqAnalysis = aiResult?.groq_analysis ?? null;

    if (duplicateOf) {
      return res.status(201).json({
        ...responsePayload,
        duplicate: true,
        masterIssueId: duplicateOf,
      });
    }

    // Emit real-time event so map dashboard can show the new pin live
    io.emit('issue:new', {
      _id:      issue._id,
      category: issue.category,
      severity: issue.aiSeverityScore,
      priority: issue.priority,
      location: issue.location,
      status:   issue.status,
      imageUrl: issue.imageUrl,
    });

    return res.status(201).json(responsePayload);
  } catch (err) {
    console.error('createIssue error:', err);
    return res.status(500).json({ error: 'Failed to create issue', code: 'SERVER_ERROR' });
  }
}

// ─── GET /api/issues ────────────────────────────────────────────────────────

export async function listIssues(req, res) {
  try {
    const {
      category,
      status,
      lat,
      lng,
      radius = 5000,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status.toUpperCase();

    // Geo filter — use $near only if lat+lng provided
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius, 10),
        },
      };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // $near doesn't support countDocuments — run both queries
    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name avatarUrl')
        .populate('assignedDepartment', 'name')
        .lean(),
      lat && lng ? 0 : Issue.countDocuments(filter),
    ]);

    return res.json({
      issues,
      total: lat && lng ? issues.length : total,
      page: pageNum,
      pages: lat && lng ? 1 : Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error('listIssues error:', err);
    return res.status(500).json({ error: 'Failed to fetch issues', code: 'SERVER_ERROR' });
  }
}

// ─── GET /api/issues/:id ────────────────────────────────────────────────────

export async function getIssue(req, res) {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('userId', 'name avatarUrl')
      .populate('assignedDepartment', 'name email')
      .populate('duplicateOf', 'status imageUrl')
      .lean();

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' });
    }

    const updates = await IssueUpdate.find({ issueId: req.params.id, isPublic: true })
      .sort('-createdAt')
      .populate('userId', 'name role')
      .lean();

    return res.json({ ...issue, updates });
  } catch (err) {
    console.error('getIssue error:', err);
    return res.status(500).json({ error: 'Failed to fetch issue', code: 'SERVER_ERROR' });
  }
}

// ─── PATCH /api/issues/:id/status ───────────────────────────────────────────

export async function updateIssueStatus(req, res) {
  try {
    const { status, comment, isPublic = true } = req.body;
    const validStatuses = ['ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        error: `status must be one of: ${validStatuses.join(', ')}`,
        code: 'VALIDATION_ERROR',
      });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' });
    }

    const oldStatus = issue.status;
    issue.status = status.toUpperCase();
    if (status.toUpperCase() === 'RESOLVED') {
      issue.resolvedAt = new Date();
    }
    await issue.save();

    await IssueUpdate.create({
      issueId: issue._id,
      userId: req.user._id,
      oldStatus,
      newStatus: issue.status,
      comment: comment?.slice(0, 1000) || null,
      isPublic: Boolean(isPublic),
    });

    return res.json({ _id: issue._id, status: issue.status, resolvedAt: issue.resolvedAt });
  } catch (err) {
    console.error('updateIssueStatus error:', err);
    return res.status(500).json({ error: 'Failed to update status', code: 'SERVER_ERROR' });
  }
}

// ─── POST /api/issues/:id/upvote ────────────────────────────────────────────

export async function upvoteIssue(req, res) {
  try {
    const userId = req.user._id;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found', code: 'NOT_FOUND' });
    }

    const alreadyVoted = issue.upvotedBy.some((id) => id.equals(userId));
    if (alreadyVoted) {
      // Toggle off
      issue.upvotedBy.pull(userId);
      issue.upvotes = Math.max(0, issue.upvotes - 1);
    } else {
      issue.upvotedBy.push(userId);
      issue.upvotes += 1;
    }

    await issue.save();
    return res.json({ upvotes: issue.upvotes, voted: !alreadyVoted });
  } catch (err) {
    console.error('upvoteIssue error:', err);
    return res.status(500).json({ error: 'Failed to upvote', code: 'SERVER_ERROR' });
  }
}

// ─── Hex Hamming distance helper (for pHash comparison) ─────────────────────

function hexHamming(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (xor) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}
