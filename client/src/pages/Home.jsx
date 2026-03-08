import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const Home = () => {
  const [stats, setStats] = useState(null);
  const [recentResolved, setRecentResolved] = useState([]);

  useEffect(() => {
    api.get('/analytics/summary').then(r => setStats(r.data)).catch(() => {});
    api.get('/issues', { params: { status: 'RESOLVED', limit: 4, sort: '-resolvedAt' } })
      .then(r => setRecentResolved(Array.isArray(r.data) ? r.data : (r.data.issues || [])))
      .catch(() => {});
  }, []);

  const totalCount   = useCountUp(stats?.total ?? 0);
  const resolvedCount = useCountUp(stats?.byStatus?.resolved ?? 0);
  const hoursCount   = useCountUp(stats?.avgResolutionHours ?? 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌆</span>
              <span className="text-xl font-bold text-gray-900">Nagar<span className="text-indigo-600">AI</span></span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/map" className="text-sm text-gray-600 hover:text-indigo-600 transition">Map</Link>
              <Link to="/issues" className="text-sm text-gray-600 hover:text-indigo-600 transition">Issues</Link>
              <Link to="/analytics" className="text-sm text-gray-600 hover:text-indigo-600 transition">Analytics</Link>
              <Link to="/leaderboard" className="text-sm text-gray-600 hover:text-indigo-600 transition">🏆 Leaderboard</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md">
                Sign In
              </Link>
              <Link to="/register" className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                Get Started →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="text-center">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            AI-Powered Civic Intelligence
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            Report. Track.
            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Fix Your City.
            </span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Snap a photo of a pothole, broken road, or garbage overflow. NagarAI classifies it instantly,
            routes it to the right department, and tracks it to resolution — in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              Report an Issue
            </Link>
            <Link to="/map" className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-200 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition">
              🗺️ View Live Map
            </Link>
          </div>
        </div>

        {/* Live Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: totalCount,    label: 'Issues Reported',       suffix: '+', color: 'text-indigo-600' },
            { value: resolvedCount, label: 'Issues Resolved',       suffix: '',  color: 'text-green-600'  },
            { value: hoursCount,    label: 'Avg Resolution (hrs)',  suffix: 'h', color: 'text-orange-500' },
            { value: 3,             label: 'Categories Tracked',    suffix: '',  color: 'text-purple-600' },
          ].map(({ value, label, suffix, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition">
              <p className={`text-4xl font-extrabold ${color}`}>{value || '—'}{suffix}</p>
              <p className="text-sm text-gray-500 mt-2">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* connector line */}
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-indigo-100" />
          {[
            { step: '1', icon: '📸', title: 'Snap a Photo',        desc: 'Take or upload a photo of the issue. AI analyses it in under 2 seconds — category, severity, and a human-readable description.' },
            { step: '2', icon: '🤖', title: 'AI Routes It',        desc: 'MobileNetV2 + Groq LLaMA-4 Vision classifies the issue and auto-assigns it to the correct municipal department.' },
            { step: '3', icon: '✅', title: 'Track to Resolution', desc: 'Get real-time status updates as the department acknowledges, takes action, and resolves the issue.' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-indigo-200">
                {step}
              </div>
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why NagarAI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🧠', title: '86% AI Accuracy',         desc: 'MobileNetV2 trained on 6,786 real-world civic images across potholes, road damage, and garbage.' },
              { icon: '🔴', title: 'Severity Scoring',        desc: 'Every issue gets a 0–1 severity score. Critical issues are flagged automatically for urgent dispatch.' },
              { icon: '🔁', title: 'Duplicate Detection',     desc: 'pHash image fingerprinting + geo-proximity prevents 100+ spam reports of the same pothole.' },
              { icon: '⚡', title: 'Real-time via Socket.io', desc: 'New reports appear on the live map instantly. Admins see queue updates the moment they happen.' },
              { icon: '📱', title: 'Offline-first PWA',       desc: 'Works without internet. Add to home screen. Lighthouse PWA score ≥ 90.' },
              { icon: '🏆', title: 'Civic Gamification',      desc: 'Citizens earn Civic Points for valid reports. Top contributors ranked on the public leaderboard.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur rounded-xl p-6 text-white border border-white/20">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-indigo-100 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Resolved Issues */}
      {recentResolved.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Recently Resolved</h2>
            <Link to="/issues?status=RESOLVED" className="text-sm text-indigo-600 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentResolved.map((issue) => (
              <Link key={issue._id} to={`/issues/${issue._id}`} className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={issue.imageUrl}
                    alt={issue.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="p-3">
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full mb-1">✓ Resolved</span>
                  <p className="text-xs text-gray-500 capitalize">{(issue.aiCategory || issue.category || '').replace('_', ' ')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to make your city better?</h2>
        <p className="text-gray-500 mb-8">Join citizens who are already using NagarAI to fix their neighbourhoods.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
            Start Reporting
          </Link>
          <Link to="/analytics" className="px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-200 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition">
            📊 View City Analytics
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌆</span>
            <span className="font-bold text-gray-900">Nagar<span className="text-indigo-600">AI</span></span>
            <span className="text-gray-400 text-sm">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/map" className="hover:text-indigo-600">Map</Link>
            <Link to="/analytics" className="hover:text-indigo-600">Analytics</Link>
            <Link to="/leaderboard" className="hover:text-indigo-600">Leaderboard</Link>
            <a href="https://github.com/Kaizoku-Ayush/Civic-Sense-Portal" target="_blank" rel="noreferrer" className="hover:text-indigo-600">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
