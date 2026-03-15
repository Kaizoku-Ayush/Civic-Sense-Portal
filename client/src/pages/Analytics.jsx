import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import api from '../services/api';
import Navbar from '../components/common/Navbar';

const CATEGORY_COLORS = {
  pothole:     '#ef4444',
  road_damage: '#f97316',
  garbage:     '#22c55e',
  other:       '#6366f1',
};

function StatCard({ label, value, suffix = '', color = 'text-indigo-600', sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-4xl font-extrabold ${color}`}>
        {value != null ? `${value}${suffix}` : '—'}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/timeline', { params: { days: 30 } }),
    ])
      .then(([s, t]) => {
        setSummary(s.data);
        setTimeline(t.data);
      })
      .catch(() => setError('Could not load analytics data.'))
      .finally(() => setLoading(false));
  }, []);

  const categoryData = summary
    ? Object.entries(summary.byCategory || {}).map(([name, count]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
        fill: CATEGORY_COLORS[name] || '#6366f1',
      }))
    : [];

  const statusData = summary
    ? Object.entries(summary.byStatus || {}).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      }))
    : [];

  const resolutionRate = summary && summary.total > 0
    ? Math.round(((summary.byStatus?.resolved || 0) / summary.total) * 100)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Real-time civic issue intelligence — powered by NagarAI.</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        )}

        {!loading && summary && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Issues"
                value={summary.total}
                color="text-indigo-600"
                sub="All time"
              />
              <StatCard
                label="Resolved"
                value={summary.byStatus?.resolved ?? 0}
                color="text-green-600"
                sub={resolutionRate != null ? `${resolutionRate}% resolution rate` : undefined}
              />
              <StatCard
                label="Avg Resolution"
                value={summary.avgResolutionHours}
                suffix=" hrs"
                color="text-orange-500"
                sub="Time to close"
              />
              <StatCard
                label="Resolved Last 7d"
                value={summary.resolvedLast7Days}
                color="text-purple-600"
                sub="Weekly velocity"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Category breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Issues by Category</h2>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val) => [val, 'Issues']}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {categoryData.map((entry) => (
                          <rect key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No data yet.</p>
                )}
              </div>

              {/* Status breakdown */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Issues by Status</h2>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={statusData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                        formatter={(val) => [val, 'Issues']}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No data yet.</p>
                )}
              </div>
            </div>

            {/* 30-day Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Issues Reported — Last 30 Days</h2>
              {timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={timeline} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(d) => d.slice(5)} // show MM-DD
                    />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                      labelFormatter={(d) => `Date: ${d}`}
                      formatter={(val) => [val, 'Reports']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Reports"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">No timeline data yet. Issues will appear here as they are reported.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
