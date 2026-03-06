import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, CategoryBadge, PriorityBadge, SeverityBar } from '../components/common/StatusBadge';
import Navbar from '../components/common/Navbar';
import { useToast } from '../context/ToastContext';

const STATUS_STEPS = ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];

const IssueDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const { addToast } = useToast();

  const [issue, setIssue] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upvoting, setUpvoting] = useState(false);
  const [freshBanner, setFreshBanner] = useState(!!location.state?.fresh);

  useEffect(() => {
    const loadIssue = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/issues/${id}`);
        setIssue(data.issue || data);
        setUpdates(data.updates || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load issue.');
      } finally {
        setLoading(false);
      }
    };
    loadIssue();
    if (freshBanner) {
      const t = setTimeout(() => setFreshBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [id]);

  const handleUpvote = async () => {
    if (upvoting) return;
    setUpvoting(true);
    try {
      const { data } = await api.post(`/issues/${id}/upvote`);
      setIssue((prev) => ({ ...prev, upvotes: data.upvotes ?? (prev.upvotes || 0) + 1 }));
      addToast('Upvote recorded!', 'success', 2500);
    } catch {
      addToast('Could not upvote. Please try again.', 'error');
    } finally {
      setUpvoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div className="h-64 bg-gray-200 rounded-lg" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <Link to="/issues" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
            Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  const groq = issue.groqAnalysis || null;
  const currentStepIdx = issue.status === 'REJECTED' ? -1 : STATUS_STEPS.indexOf(issue.status);
  const dateLabel = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {freshBanner && (
        <div className="bg-green-600 text-white text-sm text-center py-2 px-4">
          ✅ Issue submitted successfully! Our team will review it shortly.
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link to="/issues" className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-5 w-fit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Issues
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Image + Basic Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Image */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <img
                src={issue.imageUrl}
                alt="Issue photo"
                className="w-full max-h-96 object-cover"
              />
            </div>

            {/* Header badges */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <CategoryBadge category={issue.aiCategory || issue.category} />
                <StatusBadge status={issue.status} />
                <PriorityBadge priority={issue.priority} />
                {issue.duplicateOf && (
                  <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">Duplicate</span>
                )}
              </div>

              <p className="text-gray-700 text-sm leading-relaxed">
                {issue.description || 'No description provided.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                <span>📅 {dateLabel(issue.createdAt)}</span>
                {issue.location?.coordinates && (
                  <span>
                    📍 {issue.location.coordinates[1].toFixed(5)}, {issue.location.coordinates[0].toFixed(5)}
                  </span>
                )}
                {issue.upvotes != null && (
                  <span>👍 {issue.upvotes} upvotes</span>
                )}
              </div>
            </div>

            {/* AI Analysis Panel */}
            {(issue.aiCategory || groq) && (
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-5">
                <h3 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                  🤖 AI Analysis
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs text-gray-400 mb-0.5">Category</p>
                    <CategoryBadge category={issue.aiCategory || issue.category} />
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs text-gray-400 mb-0.5">Confidence</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {Math.round((issue.aiConfidence || 0) * 100)}%
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-indigo-100 mb-3">
                  <p className="text-xs text-gray-400 mb-1.5">Severity Score</p>
                  <SeverityBar score={issue.aiSeverityScore} />
                </div>

                {groq && (
                  <div className="space-y-2">
                    {groq.description && (
                      <div className="bg-white rounded-lg p-3 border border-indigo-100">
                        <p className="text-xs text-gray-400 mb-1">Description</p>
                        <p className="text-sm text-gray-700">{groq.description}</p>
                      </div>
                    )}
                    {groq.severity_reason && (
                      <div className="bg-white rounded-lg p-3 border border-indigo-100">
                        <p className="text-xs text-gray-400 mb-1">Severity Reason</p>
                        <p className="text-sm text-gray-700">{groq.severity_reason}</p>
                      </div>
                    )}
                    {groq.recommendation && (
                      <div className="bg-indigo-100 rounded-lg p-3 border border-indigo-200">
                        <p className="text-xs font-medium text-indigo-600 mb-1">💡 Recommendation</p>
                        <p className="text-sm text-indigo-800">{groq.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Updates / Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity Timeline</h3>
              {updates.length === 0 ? (
                <p className="text-sm text-gray-400">No activity yet.</p>
              ) : (
                <ol className="relative border-l border-gray-200 space-y-5 ml-3">
                  {updates.map((upd) => (
                    <li key={upd._id} className="ml-4">
                      <div className="absolute -left-1.5 mt-1 w-3 h-3 rounded-full border-2 border-white bg-indigo-500" />
                      <div className="flex items-center gap-2 mb-0.5">
                        {upd.oldStatus && <StatusBadge status={upd.oldStatus} />}
                        {upd.oldStatus && <span className="text-gray-400 text-xs">→</span>}
                        <StatusBadge status={upd.newStatus} />
                      </div>
                      {upd.comment && (
                        <p className="text-sm text-gray-600 mt-1">{upd.comment}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{dateLabel(upd.createdAt)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Right Column — Status + Actions */}
          <div className="space-y-5">
            {/* Status Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Progress</h3>

              {issue.status === 'REJECTED' ? (
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-red-600 font-medium text-sm">Issue Rejected</p>
                </div>
              ) : (
                <ol className="space-y-3">
                  {STATUS_STEPS.map((step, idx) => {
                    const done = idx <= currentStepIdx;
                    const current = idx === currentStepIdx;
                    return (
                      <li key={step} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? (current ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white') : 'bg-gray-100 text-gray-400'}`}>
                          {done && !current ? '✓' : idx + 1}
                        </div>
                        <span className={`text-sm ${current ? 'font-semibold text-indigo-700' : done ? 'text-green-700' : 'text-gray-400'}`}>
                          {step.replace('_', ' ')}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Actions</h3>

              {user && issue.status !== 'RESOLVED' && issue.status !== 'REJECTED' && (
                <button
                  onClick={handleUpvote}
                  disabled={upvoting}
                  className="w-full py-2 border border-indigo-300 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition disabled:opacity-50"
                >
                  {upvoting ? 'Upvoting…' : `👍 Upvote (${issue.upvotes || 0})`}
                </button>
              )}

              {issue.location?.coordinates && (
                <a
                  href={`https://www.google.com/maps?q=${issue.location.coordinates[1]},${issue.location.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition text-center"
                >
                  🗺️ View on Google Maps
                </a>
              )}

              <Link
                to="/submit"
                className="block w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition text-center"
              >
                Report Similar Issue
              </Link>
            </div>

            {/* Duplicate warning */}
            {issue.duplicateOf && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-xs text-yellow-700 font-medium">⚠️ Duplicate Issue</p>
                <p className="text-xs text-yellow-600 mt-1">This issue was marked as a duplicate.</p>
                <Link
                  to={`/issues/${issue.duplicateOf}`}
                  className="text-xs text-indigo-600 underline mt-1 block"
                >
                  View original →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
