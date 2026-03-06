import { useState, useCallback } from 'react';
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

/**
 * LocationPicker — compact Leaflet map for choosing an issue location.
 * Props:
 *   lat, lng    — current coordinates (or null)
 *   onChange    — ({ lat, lng }) => void
 *   height      — CSS height string (default '200px')
 */
const LocationPicker = ({ lat, lng, onChange, height = '200px' }) => {
  const center =
    lat != null && lng != null
      ? [lat, lng]
      : [20.5937, 78.9629]; // India centroid fallback

  const zoom = lat != null ? 15 : 5;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
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
      {!lat && (
        <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-500 pointer-events-none">
          Click map to place pin
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
