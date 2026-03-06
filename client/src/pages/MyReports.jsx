import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import IssueCard from '../components/issues/IssueCard';
import Navbar from '../components/common/Navbar';

const STATUSES = ['all', 'PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

const STATS_CONFIG = [
  { key: 'total',    label: 'Total Reported', icon: '📋', color: 'text-indigo-600 bg-indigo-50' },
  { key: 'pending',  label: 'Pending',         icon: '⏳', color: 'text-yellow-600 bg-yellow-50' },
  { key: 'resolved', label: 'Resolved',         icon: '✅', color: 'text-green-600 bg-green-50' },
  { key: 'points',   label: 'Civic Points',     icon: '⭐', color: 'text-purple-600 bg-purple-50' },
];

const MyReports = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchMyIssues = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/issues', { params: { myIssues: true, limit: 100 } });
        const arr = Array.isArray(data) ? data : (data.issues || []);
        setIssues(arr);
      } catch (err) {
        setError('Failed to load your reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyIssues();
  }, []);

  const filtered = filterStatus === 'all'
    ? issues
    : issues.filter((i) => i.status === filterStatus);

  const stats = {
    total:   issues.length,
    pending: issues.filter((i) => i.status === 'PENDING').length,
    resolved:issues.filter((i) => i.status === 'RESOLVED').length,
    points:  user?.civicPoints ?? 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track all civic issues you've submitted.</p>
          </div>
          <Link
            to="/submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Report Issue
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {STATS_CONFIG.map((s) => (
            <div key={s.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-lg ${s.color} mb-2`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '—' : stats[s.key]}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Status tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-1 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  filterStatus === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
                {s !== 'all' && (
                  <span className="ml-1 text-[10px] opacity-70">
                    ({issues.filter((i) => i.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-lg font-medium text-gray-600">
              {filterStatus === 'all' ? 'No reports yet' : `No ${filterStatus.replace('_', ' ').toLowerCase()} reports`}
            </p>
            {filterStatus === 'all' && (
              <>
                <p className="text-sm text-gray-400 mt-1">Be the first to report a civic issue in your area!</p>
                <Link
                  to="/submit"
                  className="mt-4 inline-block px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                >
                  Report an Issue
                </Link>
              </>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="w-full h-44 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-20 bg-gray-200 rounded-full" />
                    <div className="h-5 w-16 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReports;
