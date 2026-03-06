import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import { useToast } from '../../context/ToastContext';

const VALID_TRANSITIONS = {
  PENDING:      ['ACKNOWLEDGED', 'REJECTED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS:  ['RESOLVED', 'REJECTED'],
  RESOLVED:     [],
  REJECTED:     [],
  DUPLICATE:    [],
};

const STATUS_LABELS = {
  PENDING:      'Pending',
  ACKNOWLEDGED: 'Acknowledged',
  IN_PROGRESS:  'In Progress',
  RESOLVED:     'Resolved',
  REJECTED:     'Rejected',
  DUPLICATE:    'Duplicate',
};

// ── Status summary strip ─────────────────────────────────────────────────────
function StatusStrip({ issues }) {
  const counts = issues.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const items = [
    { label: 'Pending',     key: 'PENDING',      color: 'text-yellow-600' },
    { label: 'In Progress', key: 'IN_PROGRESS',  color: 'text-purple-600' },
    { label: 'Resolved',    key: 'RESOLVED',     color: 'text-green-600' },
    { label: 'Total',       key: '__total__',    color: 'text-indigo-600' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {items.map(({ label, key, color }) => (
        <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className={`text-2xl font-bold ${color}`}>
            {key === '__total__' ? issues.length : (counts[key] || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Queue issue card ─────────────────────────────────────────────────────────
function QueueCard({ issue, onStatusChange, onToast }) {
  const [saving, setSaving] = useState(false);
  const transitions = VALID_TRANSITIONS[issue.status] || [];

  async function handleTransition(newStatus) {
    setSaving(true);
    try {
      await api.patch(`/issues/${issue._id}/status`, {
        status: newStatus,
        comment: `Status updated by department staff`,
      });
      onToast(`Issue marked as ${STATUS_LABELS[newStatus]}.`, 'success');
      onStatusChange();
    } catch (err) {
      onToast(err.response?.data?.error || 'Status update failed.', 'error');
      console.error('Status update failed:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      {issue.imageUrl && (
        <div className="aspect-video overflow-hidden bg-gray-100">
          <img
            src={issue.imageUrl}
            alt="Issue"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-2">
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
          <CategoryBadge category={issue.category} />
        </div>

        {/* Title / description */}
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
          {issue.title || issue.description?.slice(0, 60) || '(no description)'}
        </h3>

        {/* AI analysis snippet */}
        {issue.aiDescription && (
          <p className="text-xs text-gray-500 italic mb-2 line-clamp-2">
            🤖 {issue.aiDescription}
          </p>
        )}

        {/* Location + date */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <span>{issue.address || 'Location not set'}</span>
          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Severity bar */}
        {issue.aiSeverityScore != null && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Severity</span>
              <span>{(issue.aiSeverityScore * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  issue.aiSeverityScore >= 0.9 ? 'bg-red-500' :
                  issue.aiSeverityScore >= 0.7 ? 'bg-orange-500' :
                  issue.aiSeverityScore >= 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${issue.aiSeverityScore * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Reporter */}
        <p className="text-xs text-gray-400 mb-3">
          Reported by: <span className="text-gray-600">{issue.userId?.name || 'Unknown'}</span>
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-auto">
          <Link
            to={`/issues/${issue._id}`}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            View Details
          </Link>
          {transitions.map((t) => (
            <button
              key={t}
              onClick={() => handleTransition(t)}
              disabled={saving}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium disabled:opacity-50 ${
                t === 'RESOLVED'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : t === 'REJECTED'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {saving ? '…' : STATUS_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main DeptDashboard ───────────────────────────────────────────────────────
export default function DeptDashboard() {
  const { user } = useAuth();  const { addToast } = useToast();  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const socketRef = useRef(null);

  const fetchQueue = useCallback(async () => {
    if (!user?.departmentId) return;
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/issues/department', { params });
      setIssues(data.issues || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  }, [user?.departmentId, filterStatus]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Socket.io — join department room for live updates
  useEffect(() => {
    if (!user?.departmentId) return;

    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit('join-department', user.departmentId);

    socket.on('queue:updated', () => fetchQueue());
    socket.on('issue:updated', () => fetchQueue());

    return () => {
      socket.emit('leave-department', user.departmentId);
      socket.off('queue:updated');
      socket.off('issue:updated');
    };
  }, [user?.departmentId, fetchQueue]);

  const activeStatuses = ['PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', '', 'RESOLVED', 'REJECTED'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Department Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.role === 'DEPARTMENT_STAFF' ? 'Your assigned issues' : 'Department issue queue'}
          </p>
        </div>

        {/* Status summary strip */}
        {!loading && issues.length > 0 && <StatusStrip issues={issues} />}

        {/* No department assigned */}
        {!user?.departmentId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-700">
            <p className="font-semibold">No department assigned</p>
            <p className="text-sm mt-1">Contact an admin to assign you to a department.</p>
          </div>
        )}

        {/* Filter tabs */}
        {user?.departmentId && (
          <>
            <div className="flex gap-2 flex-wrap mb-6">
              {activeStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    filterStatus === s
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {s === '' ? 'All' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* Content */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : issues.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-lg font-semibold text-gray-700">Queue is empty</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {filterStatus ? `No issues with status "${STATUS_LABELS[filterStatus]}"` : 'No issues assigned to your department'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {issues.map((issue) => (
                  <QueueCard key={issue._id} issue={issue} onStatusChange={fetchQueue} onToast={addToast} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
