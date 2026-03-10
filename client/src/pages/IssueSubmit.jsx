import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import LocationPicker from '../components/map/LocationPicker';
import { CategoryBadge, SeverityBar } from '../components/common/StatusBadge';
import Navbar from '../components/common/Navbar';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  { value: 'pothole',     label: 'Pothole',     icon: '🕳️' },
  { value: 'road_damage', label: 'Road Damage',  icon: '🛣️' },
  { value: 'garbage',    label: 'Garbage',       icon: '🗑️' },
  { value: 'other',      label: 'Other',         icon: '📍' },
];

const IssueSubmit = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Form state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // AI analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Nearby similar issues
  const [nearbyIssues, setNearbyIssues] = useState([]);
  const [nearbyDismissed, setNearbyDismissed] = useState(false);

  useEffect(() => {
    if (!aiResult || lat == null || lng == null) return;
    setNearbyDismissed(false);
    api.get('/issues', { params: { lat, lng, radius: 500, limit: 3 } })
      .then(r => {
        const arr = Array.isArray(r.data) ? r.data : (r.data.issues || []);
        setNearbyIssues(arr.filter(i => i.status !== 'RESOLVED' && i.status !== 'REJECTED'));
      })
      .catch(() => {});
  }, [aiResult, lat, lng]);

  // ── Image selection ──────────────────────────────────────────────────
  const handleImageSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAiResult(null);
    setAiError(null);
    runAiPreview(file);
  }, []);

  const onFileChange = (e) => {
    if (e.target.files[0]) handleImageSelect(e.target.files[0]);
  };

  // ── AI preview ───────────────────────────────────────────────────────
  const runAiPreview = async (file) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('use_groq', 'true');
      // When VITE_AI_SERVICE_URL is set, call the service directly (/predict).
      // When empty, use the /ai/predict path handled by Vite proxy or Vercel rewrite.
      const aiBase = import.meta.env.VITE_AI_SERVICE_URL || '';
      const aiPath = aiBase ? '/predict' : '/ai/predict';
      const res = await axios.post(`${aiBase}${aiPath}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      setAiResult(res.data);
      // Auto-fill category from AI if user hasn't chosen one
      setCategory((prev) => prev || res.data.category || '');
      // Auto-fill description from Groq if present
      if (res.data.groq_analysis?.description) {
        setDescription((prev) => prev || res.data.groq_analysis.description);
      }
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.error || err.message;
      const label  = status ? `${status}: ${detail}` : detail;
      setAiError(`AI preview failed${label ? ` — ${label}` : ''}. You can still submit manually.`);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Geolocation ──────────────────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGeoLoading(false);
        addToast('Location detected successfully!', 'success', 2500);
      },
      (err) => {
        addToast('Could not detect location: ' + err.message, 'error');
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return;
    if (lat == null || lng == null) {
      setSubmitError({ msg: 'Please set a location on the map.' });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const form = new FormData();
      form.append('image', imageFile);
      form.append('latitude', lat);
      form.append('longitude', lng);
      form.append('description', description);
      if (category) form.append('category', category);

      const res = await api.post('/issues', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast('Issue submitted successfully! 🎉', 'success');
      navigate(`/issues/${res.data._id}`, { state: { fresh: true } });
    } catch (err) {
      const status = err.response?.status;
      const data   = err.response?.data;
      const msg    = data?.error || data?.message || err.message || 'Failed to submit issue. Please try again.';
      const detail = data ? JSON.stringify(data, null, 2) : null;
      setSubmitError({ msg, status, detail });
      addToast(`Submit failed${status ? ` (${status})` : ''}: ${msg}`, 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Report a Civic Issue</h1>
          <p className="text-gray-500 mt-1 text-sm">Upload a photo — AI will classify it instantly.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Step 1: Image ─────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">1 · Upload Photo</h2>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Issue preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); setAiResult(null); }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-gray-600 hover:text-red-600 hover:bg-red-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer"
                >
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500">Choose from gallery</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition cursor-pointer"
                >
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">Take a photo</span>
                </button>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
          </div>

          {/* ── AI Preview Card ────────────────────────────────────────── */}
          {(aiLoading || aiResult || aiError) && (
            <div className={`rounded-xl border p-4 ${aiResult ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-indigo-700">🤖 AI Analysis</span>
                {aiLoading && (
                  <span className="ml-2">
                    <svg className="animate-spin h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  </span>
                )}
              </div>

              {aiLoading && <p className="text-sm text-gray-500 animate-pulse">Analysing image with AI…</p>}

              {aiError && <p className="text-sm text-orange-600">{aiError}</p>}

              {aiResult && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <CategoryBadge category={aiResult.category} />
                    <span className="text-xs text-gray-500">
                      {Math.round((aiResult.confidence || 0) * 100)}% confidence
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Severity</p>
                    <SeverityBar score={aiResult.severity_score} />
                  </div>

                  {aiResult.groq_analysis && (
                    <div className="space-y-1 pt-1 border-t border-indigo-200">
                      <p className="text-sm text-gray-700">{aiResult.groq_analysis.description}</p>
                      {aiResult.groq_analysis.recommendation && (
                        <p className="text-xs text-indigo-700 font-medium">
                          💡 {aiResult.groq_analysis.recommendation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Similar Nearby Issues Strip ──────────────────────────────── */}
          {nearbyIssues.length > 0 && !nearbyDismissed && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-semibold text-amber-800">
                  ⚠️ {nearbyIssues.length} similar issue{nearbyIssues.length > 1 ? 's' : ''} already reported within 500 m
                </p>
                <button
                  type="button"
                  onClick={() => setNearbyDismissed(true)}
                  className="text-amber-500 hover:text-amber-700 ml-2 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {nearbyIssues.map(issue => (
                  <a
                    key={issue._id}
                    href={`/issues/${issue._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-900 hover:bg-amber-100 transition"
                  >
                    {issue.imageUrl && (
                      <img src={issue.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                    )}
                    <span className="capitalize">{(issue.aiCategory || issue.category || 'issue').replace('_', ' ')}</span>
                    <span className="text-amber-500">↗️ Upvote instead</span>
                  </a>
                ))}
              </div>
              <p className="text-xs text-amber-600 mt-2">Consider upvoting an existing report rather than creating a duplicate.</p>
            </div>
          )}

          {/* ── Step 2: Location ───────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">2 · Location</h2>
              <button
                type="button"
                onClick={detectLocation}
                disabled={geoLoading}
                className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition disabled:opacity-50 flex items-center gap-1"
              >
                {geoLoading ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Detecting…
                  </>
                ) : (
                  <>📍 Use My Location</>
                )}
              </button>
            </div>

            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={({ lat: newLat, lng: newLng }) => { setLat(newLat); setLng(newLng); }}
              height="200px"
            />

            {lat != null && (
              <p className="text-xs text-green-600 mt-2 font-medium">
                ✓ Location set: {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            )}
            {lat == null && (
              <p className="text-xs text-gray-400 mt-2">
                Click "Use My Location" or tap the map to drop a pin.
              </p>
            )}
          </div>

          {/* ── Step 3: Details ────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">3 · Details</h2>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-sm font-medium transition ${
                      category === cat.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-indigo-300 text-gray-600'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="font-normal text-gray-400">(optional — AI-generated if blank)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Describe the issue in your own words…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{description.length}/500</p>
            </div>
          </div>

          {/* ── Submit ─────────────────────────────────────────────────── */}
          {submitError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 space-y-1">
              <p className="font-semibold">
                {submitError.status ? `Error ${submitError.status}: ` : ''}{submitError.msg ?? submitError}
              </p>
              {submitError.detail && (
                <pre className="text-xs bg-red-100 rounded p-2 overflow-x-auto whitespace-pre-wrap">{submitError.detail}</pre>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!imageFile || submitting}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting…
              </>
            ) : (
              'Submit Issue Report'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IssueSubmit;
