import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';

const RANK_BADGES = ['🥇', '🥈', '🥉'];

const ROLE_LABELS = {
  CITIZEN:          { label: 'Citizen',     color: 'bg-blue-100 text-blue-700'    },
  ADMIN:            { label: 'Admin',       color: 'bg-red-100 text-red-700'      },
  DEPARTMENT_STAFF: { label: 'Staff',       color: 'bg-purple-100 text-purple-700'},
};

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/analytics/leaderboard')
      .then(r => setLeaders(r.data))
      .catch(() => setError('Could not load leaderboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const maxPoints = leaders[0]?.civicPoints || 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">🏆 Civic Leaderboard</h1>
          <p className="text-gray-500 mt-2">Top citizens driving change in their communities.</p>
          <p className="text-xs text-gray-400 mt-1">Earn Civic Points by submitting valid reports that get acknowledged or resolved.</p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-100 rounded w-2/3" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm text-center">{error}</div>
        )}

        {!loading && !error && leaders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">🏅</p>
            <p className="text-lg font-medium text-gray-600">No points scored yet</p>
            <p className="text-sm mt-2">Be the first to report an issue and earn Civic Points!</p>
            <Link
              to="/submit"
              className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Report an Issue
            </Link>
          </div>
        )}

        {!loading && leaders.length > 0 && (
          <div className="space-y-3">
            {leaders.map((user, idx) => {
              const rank = idx + 1;
              const badge = RANK_BADGES[idx] ?? `#${rank}`;
              const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.CITIZEN;
              const barWidth = Math.max(4, Math.round((user.civicPoints / maxPoints) * 100));

              return (
                <div
                  key={user._id}
                  className={`bg-white rounded-2xl border p-4 flex items-center gap-4 transition hover:shadow-md ${
                    idx === 0 ? 'border-yellow-300 shadow-sm shadow-yellow-100' :
                    idx === 1 ? 'border-gray-300' :
                    idx === 2 ? 'border-orange-200' :
                    'border-gray-100'
                  }`}
                >
                  {/* Rank */}
                  <div className={`text-2xl w-10 text-center flex-shrink-0 ${idx < 3 ? '' : 'text-gray-400 text-lg font-bold'}`}>
                    {badge}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${
                    idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-indigo-400'
                  }`}>
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      : (user.name?.[0]?.toUpperCase() || '?')
                    }
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-lg font-extrabold ${idx === 0 ? 'text-yellow-500' : idx < 3 ? 'text-gray-700' : 'text-indigo-600'}`}>
                      {user.civicPoints}
                    </p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && leaders.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">Want to climb the board?</p>
            <Link
              to="/submit"
              className="inline-block mt-3 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
            >
              Report an Issue → Earn Points
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
