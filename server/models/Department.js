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
    // GeoJSON polygon representing the jurisdiction zone
    zonePolygon: {
      type: {
        type: String,
        enum: ['Polygon'],
      },
      coordinates: [[[Number]]],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
departmentSchema.index({ zonePolygon: '2dsphere' });

const Department = mongoose.model('Department', departmentSchema);

export default Department;
