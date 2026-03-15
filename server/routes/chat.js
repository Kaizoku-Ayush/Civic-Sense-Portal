import express from 'express';
import { authenticateOptional } from '../middleware/auth.js';
import { chatRateLimit } from '../middleware/chatRateLimit.js';
import { answerChatQuestion } from '../services/chatService.js';
import { ChatEvent, ChatFeedback } from '../models/index.js';

const router = express.Router();

// POST /api/chat/ask
router.post('/ask', authenticateOptional, chatRateLimit, async (req, res) => {
  const startedAt = Date.now();
  try {
    const { question, context } = req.body || {};
    const result = await answerChatQuestion({
      question,
      context: context || {},
      user: req.user || null,
    });

    // Fire-and-forget analytics logging; never block user response.
    ChatEvent.create({
      userId: req.user?._id || null,
      intent: result?.data?.intent || 'unknown',
      scope: result?.data?.scope || 'unknown',
      city: result?.data?.city || null,
      followUpNeeded: Boolean(result?.followUpNeeded),
      success: true,
      hadLocation: Boolean(context?.location?.lat && context?.location?.lng),
      latencyMs: Date.now() - startedAt,
      questionSnippet: String(question || '').trim().slice(0, 200),
    }).catch(() => {});

    return res.json(result);
  } catch (err) {
    console.error('chat ask error:', err);

    const { question, context } = req.body || {};
    ChatEvent.create({
      userId: req.user?._id || null,
      intent: 'unknown',
      scope: context?.scope || 'unknown',
      city: context?.location?.city || null,
      followUpNeeded: false,
      success: false,
      hadLocation: Boolean(context?.location?.lat && context?.location?.lng),
      latencyMs: Date.now() - startedAt,
      questionSnippet: String(question || '').trim().slice(0, 200),
    }).catch(() => {});

    return res.status(500).json({ error: 'Failed to answer chat question', code: 'SERVER_ERROR' });
  }
});

// POST /api/chat/feedback
router.post('/feedback', authenticateOptional, async (req, res) => {
  try {
    const { intent, liked, questionSnippet } = req.body || {};
    if (typeof liked !== 'boolean') {
      return res.status(400).json({ error: 'liked must be boolean', code: 'VALIDATION_ERROR' });
    }

    await ChatFeedback.create({
      userId: req.user?._id || null,
      intent: intent || 'unknown',
      liked,
      questionSnippet: String(questionSnippet || '').trim().slice(0, 200),
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('chat feedback error:', err);
    return res.status(500).json({ error: 'Failed to save feedback', code: 'SERVER_ERROR' });
  }
});

export default router;
