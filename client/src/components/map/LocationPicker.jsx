import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function DraggableMarker({ position, onChange }) {
  useMapEvents({
    click(e) { onChange({ lat: e.latlng.lat, lng: e.latlng.lng }); },
  });
  if (!position) return null;
  return (
    <Marker
      position={[position.lat, position.lng]}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          onChange({ lat, lng });
        },
      }}
    />
  );
}

function MapInner({ lat, lng, onChange, zoom, scrollWheelZoom }) {
  const center = lat != null ? [lat, lng] : [20.5937, 78.9629];
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={scrollWheelZoom}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker
        position={lat != null ? { lat, lng } : null}
        onChange={onChange}
      />
    </MapContainer>
  );
}

const LocationPicker = ({ lat, lng, onChange, height = '200px' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const zoom = lat != null ? 15 : 5;

  useEffect(() => {
    if (!isFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isFullscreen]);

  return (
    <>
      {/* ── Compact map ── */}
      <div
        className="rounded-xl overflow-hidden border border-gray-200 shadow-sm relative"
        style={{ height }}
      >
        <MapInner lat={lat} lng={lng} onChange={onChange} zoom={zoom} scrollWheelZoom={false} />

        {!lat && (
          <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500 pointer-events-none z-10">
            Click map to place pin
          </p>
        )}

        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2 right-2 z-[1000] inline-flex items-center gap-1.5 rounded-lg border border-white/60 bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow hover:bg-indigo-50 hover:text-indigo-700 transition"
        >
          ⛶ Expand Map
        </button>
      </div>

      {/* ── Fullscreen portal — renders directly into <body> ── */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-gray-800">📍 Pick Location</p>
              {lat != null
                ? <p className="text-xs text-green-600 font-medium">✓ {lat.toFixed(5)}, {lng.toFixed(5)}</p>
                : <p className="text-xs text-gray-400">Tap the map to place a pin</p>
              }
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition"
            >
              ✓ Done
            </button>
          </div>

          {/* Map fills remaining height */}
          <div className="flex-1 min-h-0">
            <MapInner lat={lat} lng={lng} onChange={onChange} zoom={zoom} scrollWheelZoom />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default LocationPicker;