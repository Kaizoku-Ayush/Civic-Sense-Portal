import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon in Vite/webpack builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/** Helper component to invalidate map size when container changes */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/** Inner component: listens for clicks to move the pin */
function DraggableMarker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
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

/**
 * LocationPicker — compact Leaflet map for choosing an issue location.
 * Props:
 *   lat, lng    — current coordinates (or null)
 *   onChange    — ({ lat, lng }) => void
 *   height      — CSS height string (default '200px')
 */
const LocationPicker = ({ lat, lng, onChange, height = '200px' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const center =
    lat != null && lng != null
      ? [lat, lng]
      : [20.5937, 78.9629]; // India centroid fallback

  const zoom = lat != null ? 15 : 5;

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const MapContent = () => (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker
        position={lat != null ? { lat, lng } : null}
        onChange={onChange}
      />
      <MapResizer />
    </>
  );

  return (
    <>
      {/* Normal embedded map */}
      <div className="relative">
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height }}>
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <MapContent />
          </MapContainer>
        </div>

        {/* Fullscreen button */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2 right-2 bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-md border border-gray-200 transition-all z-[1000] group"
          title="Expand map to fullscreen"
          aria-label="Expand map to fullscreen"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>

        {!lat && (
          <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500 pointer-events-none">
            Click map to place pin
          </p>
        )}
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFullscreen(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">Select Location</h3>
                {lat != null && (
                  <span className="text-xs text-green-600 font-medium">
                    ✓ {lat.toFixed(5)}, {lng.toFixed(5)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-lg transition-all"
                aria-label="Close fullscreen"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Map container */}
            <div className="flex-1 relative">
              <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <MapContent />
              </MapContainer>

              {!lat && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200 pointer-events-none z-[1000]">
                  <p className="text-sm text-gray-600">
                    Click map to place pin or drag marker to adjust
                  </p>
                </div>
              )}
            </div>

            {/* Footer with action buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {lat ? 'Click "Done" to confirm location' : 'Click anywhere on the map to set location'}
              </p>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LocationPicker;
