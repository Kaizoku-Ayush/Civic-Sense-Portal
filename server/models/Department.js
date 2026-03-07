import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    // Issue categories this department handles
    categories: {
      type: [String],
      enum: ['pothole', 'road_damage', 'garbage', 'streetlight', 'drainage', 'graffiti', 'other'],
      default: [],
    },
    // GeoJSON polygon representing the jurisdiction zone (optional)
    zonePolygon: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: undefined,
      },
      coordinates: {
        type: [[[Number]]],
        default: undefined,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Sparse 2dsphere index — only indexes documents that actually have a polygon
departmentSchema.index({ zonePolygon: '2dsphere' }, { sparse: true });

const Department = mongoose.model('Department', departmentSchema);

export default Department;
