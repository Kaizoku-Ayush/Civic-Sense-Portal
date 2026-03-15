import mongoose from 'mongoose';

const chatFeedbackSchema = new mongoose.Schema(
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
    liked: {
      type: Boolean,
      required: true,
      index: true,
    },
    questionSnippet: {
      type: String,
      default: '',
      maxlength: 200,
    },
  },
  { timestamps: true }
);

chatFeedbackSchema.index({ createdAt: -1 });

const ChatFeedback = mongoose.model('ChatFeedback', chatFeedbackSchema);

export default ChatFeedback;
