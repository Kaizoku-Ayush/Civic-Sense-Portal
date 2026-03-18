import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon in Vite/webpack builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

/** Keep Leaflet canvas sized correctly when container dimensions change. */
function MapResizeSync({ isFullscreen }) {
  const map = useMapEvents({});

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 220);

    return () => clearTimeout(timer);
  }, [map, isFullscreen]);

  return null;
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

  useEffect(() => {
    if (!isFullscreen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const center =
    lat != null && lng != null
      ? [lat, lng]
      : [20.5937, 78.9629]; // India centroid fallback

  const zoom = lat != null ? 15 : 5;

  return (
    <div
      className={[
        'rounded-xl overflow-hidden border border-gray-200 shadow-sm relative transition-all duration-300 ease-out bg-white',
        isFullscreen ? 'fixed inset-0 z-[9999] rounded-none border-0 shadow-none' : '',
      ].join(' ')}
      style={{ height: isFullscreen ? '100dvh' : height }}
    >
      {isFullscreen && (
        <div
          className="absolute inset-0 bg-black/20 transition-opacity duration-300 pointer-events-none"
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        onClick={() => setIsFullscreen((prev) => !prev)}
        className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 rounded-lg border border-white/60 bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow hover:bg-white active:scale-[0.98] transition"
      >
        {isFullscreen ? 'Exit Fullscreen' : 'Expand Map'}
      </button>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={isFullscreen}
      >
        <MapResizeSync isFullscreen={isFullscreen} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker
          position={lat != null ? { lat, lng } : null}
          onChange={onChange}
        />
      </MapContainer>
      {!lat && (
        <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-600 pointer-events-none z-[900]">
          Click map to place pin
        </p>
      )}

      {isFullscreen && (
        <p className="absolute bottom-3 left-3 right-3 text-center text-xs text-white bg-black/45 rounded-md px-2 py-1 pointer-events-none z-[900]">
          Tap anywhere to place pin. Press Esc or use the button to close.
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
