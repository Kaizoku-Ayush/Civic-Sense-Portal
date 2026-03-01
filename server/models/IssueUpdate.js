import mongoose from 'mongoose';

// Tracks the status timeline of an issue (audit log / activity feed)
const issueUpdateSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
    },
    // The user who made the update (admin/staff/citizen)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    oldStatus: {
      type: String,
      enum: ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE', null],
      default: null,
    },
    newStatus: {
      type: String,
      enum: ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE', null],
      default: null,
    },
    comment: {
      type: String,
      default: null,
    },
    // Public updates are visible to the issue reporter
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Optional attachment (e.g., resolution photo)
    attachmentUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast timeline queries per issue
issueUpdateSchema.index({ issueId: 1, createdAt: 1 });

const IssueUpdate = mongoose.model('IssueUpdate', issueUpdateSchema);

export default IssueUpdate;
