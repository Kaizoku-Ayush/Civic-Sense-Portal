import mongoose from 'mongoose';

const chatEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    intent: {
      type: String,
      default: 'unknown',
      index: true,
    },
    scope: {
      type: String,
      enum: ['city-wide', 'my-area', 'unknown'],
      default: 'unknown',
      index: true,
    },
    city: {
      type: String,
      default: null,
      index: true,
    },
    followUpNeeded: {
      type: Boolean,
      default: false,
      index: true,
    },
    success: {
      type: Boolean,
      default: true,
      index: true,
    },
    hadLocation: {
      type: Boolean,
      default: false,
    },
    latencyMs: {
      type: Number,
      default: null,
    },
    questionSnippet: {
      type: String,
      default: '',
      maxlength: 200,
    },
  },
  { timestamps: true }
);

chatEventSchema.index({ createdAt: -1 });
chatEventSchema.index({ intent: 1, createdAt: -1 });

const ChatEvent = mongoose.model('ChatEvent', chatEventSchema);

export default ChatEvent;
