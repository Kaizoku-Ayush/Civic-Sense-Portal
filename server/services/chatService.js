import axios from 'axios';
import { Issue, User } from '../models/index.js';

const EARTH_RADIUS_METERS = 6_378_100;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CACHE_TTL_MS = 30_000;
const responseCache = new Map();

function normalizeText(text = '') {
  return String(text).trim().toLowerCase();
}

function detectIntent(question) {
  const q = normalizeText(question);

  if (/last\s*7\s*days|recent|trend|weekly|this week/.test(q) && /resolved|resolution/.test(q)) {
    return 'resolution_trend';
  }

  if (/profile|about .*contributor|who is .*top|rank\s*1|number\s*1/.test(q) && /leaderboard|contributor|top/.test(q)) {
    return 'contributor_profile';
  }

  if (/leaderboard|top contributor|top user|highest points|most contributions/.test(q)) {
    return 'leaderboard';
  }

  if (/my reports|my report|my issues|my complaints/.test(q)) {
    return 'my_reports';
  }

  if (/acknowledged|pending|resolved|in[_ ]?progress|status/.test(q)) {
    return 'status_breakdown';
  }

  if (/how many|count|number of reports|total reports|reports are there/.test(q)) {
    return 'report_count';
  }

  return 'status_breakdown';
}

function detectScope(question, explicitScope) {
  if (explicitScope === 'my-area' || explicitScope === 'city-wide') {
    return explicitScope;
  }

  const q = normalizeText(question);
  if (/my area|near me|nearby|around me|in my locality|in my neighborhood/.test(q)) {
    return 'my-area';
  }

  return 'city-wide';
}

function asNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildGeoMatch(locationContext = {}) {
  const lat = asNumber(locationContext.lat, null);
  const lng = asNumber(locationContext.lng, null);
  const radius = Math.min(50_000, Math.max(500, asNumber(locationContext.radiusMeters, 5000)));

  if (lat == null || lng == null) {
    return null;
  }

  return {
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius / EARTH_RADIUS_METERS],
      },
    },
  };
}

function parseTopN(question, fallback = 5) {
  const match = question.match(/top\s+(\d{1,2})/i);
  if (!match) return fallback;
  const n = parseInt(match[1], 10);
  return Math.min(20, Math.max(1, n));
}

function extractCity(question) {
  const q = String(question || '').trim();
  const normalized = normalizeText(q);

  // Guard: avoid treating "city-wide" as a city name.
  if (/(^|\s)city\s*-?\s*wide(\s|$)/i.test(normalized)) {
    return null;
  }

  const match = q.match(/\b(?:in|for)\s+([a-zA-Z][a-zA-Z\s]{1,39})(?=$|[?.!,;])/i)
    || q.match(/\b(?:city|area)\s*[:\-]\s*([a-zA-Z][a-zA-Z\s]{1,39})(?=$|[?.!,;])/i);

  if (!match) return null;
  const city = String(match[1] || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[?.!,;]+$/g, '');

  if (/^city\s*-?\s*wide$/i.test(city)) return null;
  if (!city || city.length < 2) return null;
  return city;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildCacheKey({ question, context, user }) {
  return JSON.stringify({
    q: normalizeText(question),
    s: context?.scope || null,
    l: context?.location || null,
    u: user?._id ? String(user._id) : null,
  });
}

function getCached(key) {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return hit.value;
}

function setCached(key, value) {
  responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function getStatusBreakdown(filter = {}) {
  const rows = await Issue.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const out = {
    pending: 0,
    acknowledged: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
    duplicate: 0,
  };

  for (const row of rows) {
    const key = String(row._id || '').toLowerCase();
    if (key in out) out[key] = row.count;
  }
  return out;
}

async function getTotalReports(filter = {}) {
  return Issue.countDocuments(filter);
}

async function getLeaderboard(limit = 5) {
  return User.find({ civicPoints: { $gt: 0 } })
    .select('name role civicPoints avatarUrl')
    .sort({ civicPoints: -1 })
    .limit(limit)
    .lean();
}

function sanitizeDisplayName(name) {
  const value = String(name || '').trim();
  if (!value) return 'Citizen';
  // Prevent exposing email-style values in leaderboard responses.
  if (value.includes('@')) return 'Citizen';
  return value;
}

async function getTopContributorProfile() {
  return User.findOne({ civicPoints: { $gt: 0 } })
    .select('name role civicPoints avatarUrl createdAt')
    .sort({ civicPoints: -1 })
    .lean();
}

async function getResolvedLast7Days(filter = {}) {
  const since = new Date(Date.now() - 7 * 24 * 3_600_000);
  const rows = await Issue.aggregate([
    {
      $match: {
        ...filter,
        status: 'RESOLVED',
        resolvedAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return { total, points: rows.map((r) => ({ date: r._id, count: r.count })) };
}

function buildDraftAnswer({ intent, scope, total, statuses, leaders, isLoggedIn, topContributor, resolutionTrend, city }) {
  const areaLabel = city ? `${city}` : (scope === 'my-area' ? 'your selected area' : 'city-wide');

  if (intent === 'resolution_trend') {
    return `Resolved reports in the last 7 days for ${areaLabel}: ${resolutionTrend.total}.`;
  }

  if (intent === 'contributor_profile') {
    if (!topContributor) return 'There is no top contributor yet because no civic points are recorded.';
    return `${sanitizeDisplayName(topContributor.name)} is currently rank 1 with ${topContributor.civicPoints} civic points. Role: ${topContributor.role}.`;
  }

  if (intent === 'leaderboard') {
    if (!leaders || leaders.length === 0) {
      return 'No leaderboard data yet. Once people earn civic points, I can show top contributors.';
    }
    const header = leaders
      .slice(0, 3)
      .map((u, idx) => `${idx + 1}. ${sanitizeDisplayName(u.name)} (${u.civicPoints} pts)`)
      .join('; ');
    return `Top contributors right now: ${header}.`;
  }

  if (intent === 'my_reports' && !isLoggedIn) {
    return 'Please log in to view your personal report statistics. I can still answer city-wide questions.';
  }

  if (intent === 'report_count') {
    return `There are ${total} reports for ${areaLabel}.`;
  }

  const statusLine = `Pending: ${statuses.pending}, Acknowledged: ${statuses.acknowledged}, In progress: ${statuses.in_progress}, Resolved: ${statuses.resolved}.`;

  if (intent === 'my_reports') {
    return `Here is your personal report status summary. ${statusLine}`;
  }

  return `Here is the status summary for ${areaLabel}. ${statusLine}`;
}

async function maybePolishWithGroq({ question, draftAnswer, facts }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return draftAnswer;

  try {
    const systemPrompt = [
      'You are a civic analytics assistant.',
      'Use only provided facts. Never invent counts, names, statuses, or percentages.',
      'If facts are insufficient, request clarification in one sentence.',
      'Keep response under 90 words.',
    ].join(' ');

    const userPrompt = JSON.stringify({ question, facts, draftAnswer });

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile',
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 12_000,
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content?.trim();
    return content || draftAnswer;
  } catch {
    return draftAnswer;
  }
}

function shouldPolishWithGroq(intent) {
  // Keep analytics/count/leaderboard answers deterministic and non-hallucinated.
  return !['report_count', 'leaderboard', 'contributor_profile', 'resolution_trend'].includes(intent);
}

export async function answerChatQuestion({ question, context = {}, user = null }) {
  const text = String(question || '').trim();
  if (!text) {
    return {
      answer: 'Please ask a question, for example: How many pending reports are near me?',
      followUpNeeded: false,
      quickActions: [],
      data: null,
    };
  }

  const cacheKey = buildCacheKey({ question: text, context, user });
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const intent = detectIntent(text);
  const scope = detectScope(text, context.scope);
  const geoMatch = buildGeoMatch(context.location || {});
  const contextCity = context?.location?.city ? String(context.location.city).trim() : null;
  const extractedCity = extractCity(text);
  const city = contextCity || extractedCity;

  if (scope === 'my-area' && !geoMatch && intent !== 'leaderboard' && intent !== 'my_reports') {
    return {
      answer: 'I can answer for your area, but I need your location. Share city/area or tap Use My GPS.',
      followUpNeeded: true,
      quickActions: [
        { id: 'use-gps', label: 'Use My GPS' },
        { id: 'city-wide', label: 'Use City-Wide Data' },
      ],
      data: { intent, scope },
    };
  }

  const filter = {};
  if (scope === 'my-area' && geoMatch) {
    Object.assign(filter, geoMatch);
  }
  if (city) {
    filter.address = { $regex: escapeRegex(city), $options: 'i' };
  }
  if (intent === 'my_reports' && user?._id) {
    filter.userId = user._id;
  }

  let total = null;
  let statuses = null;
  let leaders = null;
  let topContributor = null;
  let resolutionTrend = null;

  if (intent === 'report_count') {
    total = await getTotalReports(filter);
  } else if (intent === 'resolution_trend') {
    resolutionTrend = await getResolvedLast7Days(filter);
  } else if (intent === 'contributor_profile') {
    topContributor = await getTopContributorProfile();
  } else if (intent === 'leaderboard') {
    leaders = await getLeaderboard(parseTopN(text));
  } else {
    statuses = await getStatusBreakdown(filter);
    if (intent === 'my_reports') {
      total = Object.values(statuses).reduce((sum, n) => sum + n, 0);
    }
  }

  const draftAnswer = buildDraftAnswer({
    intent,
    scope,
    total,
    statuses: statuses || {
      pending: 0,
      acknowledged: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0,
      duplicate: 0,
    },
    leaders,
    isLoggedIn: Boolean(user),
    topContributor,
    resolutionTrend,
    city,
  });

  const facts = {
    intent,
    scope,
    city,
    total,
    statuses,
    leaders,
    topContributor,
    resolutionTrend,
  };

  const answer = shouldPolishWithGroq(intent)
    ? await maybePolishWithGroq({ question: text, draftAnswer, facts })
    : draftAnswer;

  const result = {
    answer,
    followUpNeeded: false,
    quickActions: [],
    data: facts,
  };

  setCached(cacheKey, result);
  return result;
}
