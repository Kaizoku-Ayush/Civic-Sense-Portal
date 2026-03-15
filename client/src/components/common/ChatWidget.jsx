import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const STORAGE_KEY = 'civic-chat-state-v1';

function buildWelcomeMessage(isAuthenticated) {
  return {
    id: 'welcome',
    role: 'assistant',
    text: isAuthenticated
      ? 'Hi! Ask me about reports, pending/resolved counts, or leaderboard trends in your city or area.'
      : 'Hi! I can answer city-wide civic report and leaderboard questions. Log in for personal stats.',
    quickActions: [
      { id: 'reports-city', label: 'Total reports city-wide' },
      { id: 'status-city', label: 'Pending vs resolved' },
      { id: 'leaders', label: 'Top contributors' },
      { id: 'leader-profile', label: 'Who is rank 1?' },
      { id: 'resolved-trend', label: 'Resolved in last 7 days' },
      { id: 'use-gps', label: 'Use My GPS' },
    ],
  };
}

function mapQuickActionToQuestion(actionId) {
  switch (actionId) {
    case 'reports-city':
      return 'How many reports are there city-wide?';
    case 'status-city':
      return 'How many pending, acknowledged, in progress, and resolved reports are there city-wide?';
    case 'leaders':
      return 'Who is on the leaderboard and who is top contributor?';
    case 'leader-profile':
      return 'Who is rank 1 on leaderboard and what is their profile?';
    case 'resolved-trend':
      return 'How many reports were resolved in the last 7 days?';
    default:
      return null;
  }
}

const ChatWidget = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([buildWelcomeMessage(isAuthenticated)]);
  const [geoContext, setGeoContext] = useState(null);
  const endRef = useRef(null);

  const hiddenRoutes = useMemo(() => ['/login', '/register', '/forgot-password'], []);
  const isHidden = hiddenRoutes.includes(location.pathname);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.messages) && saved.messages.length) {
        setMessages(saved.messages);
      }
      if (saved.geoContext) {
        setGeoContext(saved.geoContext);
      }
    } catch {
      // ignore persistence errors
    }
  }, []);

  useEffect(() => {
    const payload = { messages, geoContext };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [messages, geoContext]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  const pushMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  const patchMessage = (id, patch) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const askQuestion = async (question, forcedScope, options = {}) => {
    const { includeUserMessage = true } = options;
    const trimmed = String(question || '').trim();
    if (!trimmed) return;

    if (includeUserMessage) {
      pushMessage({ id: `u-${Date.now()}`, role: 'user', text: trimmed });
    }
    setLoading(true);

    try {
      const { data } = await api.post('/chat/ask', {
        question: trimmed,
        context: {
          scope: forcedScope || undefined,
          location: geoContext || undefined,
        },
      });

      pushMessage({
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data?.answer || 'I could not generate an answer right now.',
        quickActions: data?.quickActions || [],
        sourceQuestion: trimmed,
        intent: data?.data?.intent || 'unknown',
        feedback: null,
      });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) {
        const retryAfter = err?.response?.headers?.['retry-after'];
        const suffix = retryAfter ? ` Please retry in about ${retryAfter}s.` : ' Please retry after a short wait.';
        pushMessage({
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: `You are sending requests too quickly.${suffix}`,
        });
      } else {
        pushMessage({
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: 'I am having trouble reaching the server. Please try again in a moment.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const copyAssistantMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      pushMessage({
        id: `copy-${Date.now()}`,
        role: 'assistant',
        text: 'Copied to clipboard.',
      });
    } catch {
      pushMessage({
        id: `copy-${Date.now()}`,
        role: 'assistant',
        text: 'Could not copy automatically. Please copy manually.',
      });
    }
  };

  const sendFeedback = async (message, liked) => {
    if (message.feedback != null) return;
    patchMessage(message.id, { feedback: liked });
    try {
      await api.post('/chat/feedback', {
        intent: message.intent || 'unknown',
        liked,
        questionSnippet: String(message.sourceQuestion || '').slice(0, 200),
      });
    } catch {
      patchMessage(message.id, { feedback: null });
      pushMessage({
        id: `fb-${Date.now()}`,
        role: 'assistant',
        text: 'Could not save feedback right now. Try again later.',
      });
    }
  };

  const captureGPS = async () => {
    if (!navigator.geolocation) {
      pushMessage({ id: `g-${Date.now()}`, role: 'assistant', text: 'GPS is not supported in this browser.' });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextGeo = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          radiusMeters: 5000,
        };
        setGeoContext(nextGeo);
        pushMessage({
          id: `g-${Date.now()}`,
          role: 'assistant',
          text: 'Location captured. Ask me things like: How many pending reports are near me?',
        });
        setLoading(false);
      },
      () => {
        pushMessage({
          id: `g-${Date.now()}`,
          role: 'assistant',
          text: 'I could not access your location. You can still ask city-wide questions.',
        });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleQuickAction = async (action) => {
    if (action.id === 'use-gps') {
      await captureGPS();
      return;
    }
    if (action.id === 'city-wide') {
      setGeoContext(null);
      await askQuestion('Show city-wide report status summary.', 'city-wide');
      return;
    }

    const question = mapQuickActionToQuestion(action.id);
    if (question) {
      await askQuestion(question);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const text = input;
    setInput('');
    await askQuestion(text);
  };

  if (isHidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[70] h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition"
        aria-label="Open civic assistant"
      >
        {open ? (
          '×'
        ) : (
          <img src="/icons/nagarai-logo.svg" alt="AI" className="w-8 h-8 mx-auto" />
        )}
      </button>

      {open && (
        <section className="fixed bottom-24 right-5 z-[70] w-[min(92vw,380px)] h-[min(70vh,560px)] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <header className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">Civic Assistant</p>
                <p className="text-xs text-indigo-100">Ask about reports, statuses, and leaderboard trends</p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                className="text-xs px-2 py-1 rounded-md bg-white/20 hover:bg-white/30"
                title="What can I ask?"
              >
                Help
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                  <p>{m.text}</p>
                  {m.role === 'assistant' && m.id !== 'welcome' && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.sourceQuestion && (
                        <button
                          type="button"
                          onClick={() => askQuestion(m.sourceQuestion, undefined, { includeUserMessage: false })}
                          className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100"
                        >
                          Regenerate
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copyAssistantMessage(m.text)}
                        className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => sendFeedback(m, true)}
                        disabled={m.feedback != null}
                        className={`text-xs px-2 py-1 rounded-full border ${m.feedback === true ? 'border-green-300 text-green-700 bg-green-50' : 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100'} disabled:opacity-70`}
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() => sendFeedback(m, false)}
                        disabled={m.feedback != null}
                        className={`text-xs px-2 py-1 rounded-full border ${m.feedback === false ? 'border-red-300 text-red-700 bg-red-50' : 'border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100'} disabled:opacity-70`}
                      >
                        👎
                      </button>
                    </div>
                  )}
                  {Array.isArray(m.quickActions) && m.quickActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.quickActions.map((a) => (
                        <button
                          key={`${m.id}-${a.id}`}
                          type="button"
                          onClick={() => handleQuickAction(a)}
                          className="text-xs px-2 py-1 rounded-full border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-xs text-gray-500">Assistant is thinking...</div>
            )}

            <div ref={endRef} />
          </div>

          <form onSubmit={onSubmit} className="border-t border-gray-100 p-3 bg-white">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask: pending reports near me?"
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={300}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">What I Can Answer</h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="px-4 py-4 text-sm text-gray-700 space-y-2">
              <p>• Total reports city-wide or in your area</p>
              <p>• Pending / acknowledged / in progress / resolved breakdown</p>
              <p>• Last 7 days resolved trend</p>
              <p>• Leaderboard and top contributor profile</p>
              <p>• Your own report status summary (when logged in)</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
