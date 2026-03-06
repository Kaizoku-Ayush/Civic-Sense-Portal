import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import IssueCard from '../components/issues/IssueCard';
import Navbar from '../components/common/Navbar';

const CATEGORIES = ['all', 'pothole', 'road_damage', 'garbage', 'other'];
const STATUSES   = ['all', 'PENDING', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest First' },
  { value: 'oldest',   label: 'Oldest First' },
  { value: 'severity', label: 'Highest Severity' },
];

const IssueList = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [sortBy,         setSortBy]          = useState('newest');
  const [page,           setPage]            = useState(1);
  const [hasMore,        setHasMore]         = useState(true);

  const LIMIT = 12;

  const fetchIssues = async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: LIMIT, page: reset ? 1 : page };
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterStatus   !== 'all') params.status   = filterStatus;
      if (sortBy === 'severity')    params.sort = '-aiSeverityScore';
      else if (sortBy === 'oldest') params.sort = 'createdAt';
      else                          params.sort = '-createdAt';

      const { data } = await api.get('/issues', { params });
      const incoming = Array.isArray(data) ? data : (data.issues || []);

      if (reset) {
        setIssues(incoming);
        setPage(1);
      } else {
        setIssues((prev) => [...prev, ...incoming]);
      }
      setHasMore(incoming.length === LIMIT);
    } catch (err) {
      setError('Failed to load issues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters change
  useEffect(() => {
    fetchIssues(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, filterStatus, sortBy]);

  const loadMore = () => {
    setPage((p) => p + 1);
  };

  useEffect(() => {
    if (page > 1) fetchIssues(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Civic Issues</h1>
            <p className="text-sm text-gray-500 mt-0.5">Browse and track reported issues in your area.</p>
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

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Category filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCategory(c)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      filterCategory === c
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c === 'all' ? 'All' : c.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
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
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="ml-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Grid */}
        {!loading && issues.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-medium text-gray-600">No issues found</p>
            <p className="text-sm mt-1">Try adjusting the filters or be the first to report one!</p>
            <Link to="/submit" className="mt-4 inline-block px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {issues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}

            {/* Skeleton cards while loading first page */}
            {loading && issues.length === 0 &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="w-full h-44 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2">
                      <div className="h-5 w-20 bg-gray-200 rounded-full" />
                      <div className="h-5 w-16 bg-gray-200 rounded-full" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && issues.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              Load More
            </button>
          </div>
        )}

        {/* Loading spinner for subsequent pages */}
        {loading && issues.length > 0 && (
          <div className="flex justify-center mt-8">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueList;
