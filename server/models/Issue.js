import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    // Category confirmed by user (may differ from AI category)
    category: {
      type: String,
      required: true,
      enum: ['pothole', 'road_damage', 'garbage', 'streetlight', 'drainage', 'graffiti', 'other'],
    },
    // AI-predicted category
    aiCategory: {
      type: String,
      enum: ['pothole', 'road_damage', 'garbage', 'streetlight', 'drainage', 'graffiti', 'other', null],
      default: null,
    },
    // AI confidence score (0-1)
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    // AI severity score (0-10)
    aiSeverityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    // Cloudinary image URL
    imageUrl: {
      type: String,
      required: true,
    },
    // Perceptual hash for duplicate detection
    imageHash: {
      type: String,
      default: null,
    },
    // GeoJSON point
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE'],
      default: 'PENDING',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    assignedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionImageUrl: {
      type: String,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries (nearby issues, heatmaps, etc.)
issueSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ userId: 1, createdAt: -1 });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ assignedDepartment: 1, status: 1 });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
