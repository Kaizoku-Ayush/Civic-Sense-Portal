import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { StatusBadge, CategoryBadge, SeverityBar } from '../components/common/StatusBadge';
import Navbar from '../components/common/Navbar';

// Fix Leaflet default icon URLs for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom category icons (coloured divIcon)
const ICON_COLORS = {
  pothole:     '#ef4444', // red
  road_damage: '#f97316', // orange
  garbage:     '#22c55e', // green
  other:       '#6366f1', // indigo
};

const CATEGORY_ICONS = { pothole: '🕳️', road_damage: '🛣️', garbage: '🗑️', other: '📍' };

function makeCategoryIcon(category) {
  const color = ICON_COLORS[category] || ICON_COLORS.other;
  const emoji = CATEGORY_ICONS[category] || '📍';
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      border:2px solid white;
      border-radius:50%;
      width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

/** Fly to user's current position */
function FlyToMe({ trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!trigger) return;
    navigator.geolocation?.getCurrentPosition((pos) => {
      map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.2 });
    });
  }, [trigger, map]);
  return null;
}

const MapDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [flyTrigger, setFlyTrigger] = useState(0);

  // Fetch all issues
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/issues', { params: { limit: 500 } });
        const arr = Array.isArray(data) ? data : (data.issues || []);
        setIssues(arr);
      } catch (err) {
        console.error('Map: failed to load issues', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Socket.io — live new issue pins
  useEffect(() => {
    const socket = connectSocket();
    socket.on('issue:new', (newIssue) => {
      setIssues((prev) => [newIssue, ...prev]);
    });
    return () => {
      socket.off('issue:new');
      disconnectSocket();
    };
  }, []);

  const filtered = filterCategory === 'all'
    ? issues
    : issues.filter((i) => (i.aiCategory || i.category) === filterCategory);

  const CATEGORIES = ['all', 'pothole', 'road_damage', 'garbage', 'other'];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navbar />

      {/* Controls bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
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

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {loading ? 'Loading…' : `${filtered.length} issue${filtered.length !== 1 ? 's' : ''}`}
          </span>
          <button
            onClick={() => setFlyTrigger((t) => t + 1)}
            className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition"
          >
            📍 My Location
          </button>
          <Link
            to="/submit"
            className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
          >
            ＋ Report
          </Link>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FlyToMe trigger={flyTrigger} />

          <MarkerClusterGroup chunkedLoading>
            {filtered.map((issue) => {
              if (!issue.location?.coordinates) return null;
              const [issueLng, issueLat] = issue.location.coordinates;
              const cat = issue.aiCategory || issue.category || 'other';

              return (
                <Marker
                  key={issue._id}
                  position={[issueLat, issueLng]}
                  icon={makeCategoryIcon(cat)}
                >
                  <Popup maxWidth={280} className="civic-popup">
                    <div className="text-sm space-y-2 min-w-[200px]">
                      {/* Image thumbnail */}
                      {issue.imageUrl && (
                        <img
                          src={issue.imageUrl}
                          alt="issue"
                          className="w-full h-28 object-cover rounded"
                        />
                      )}

                      <div className="flex flex-wrap gap-1">
                        <CategoryBadge category={cat} />
                        <StatusBadge status={issue.status} />
                      </div>

                      {issue.description && (
                        <p className="text-gray-600 line-clamp-2 text-xs">{issue.description}</p>
                      )}

                      {issue.aiSeverityScore != null && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Severity</p>
                          <SeverityBar score={issue.aiSeverityScore} />
                        </div>
                      )}

                      <a
                        href={`/issues/${issue._id}`}
                        className="block text-center text-xs text-indigo-600 font-medium hover:underline pt-1"
                      >
                        View Details →
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 right-4 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-[1000]">
        <p className="text-xs font-semibold text-gray-600 mb-2">Legend</p>
        {Object.entries(ICON_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <span
              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            {cat.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapDashboard;
