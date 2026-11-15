"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Pin oranye sesuai desain (tanpa memuat gambar ikon default Leaflet).
const pinIcon = L.divIcon({
  className: "",
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -38],
  html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.2 0 0 7 0 15.7 0 27.5 16 42 16 42s16-14.5 16-26.3C32 7 24.8 0 16 0Z" fill="#F79B29"/><circle cx="16" cy="15.5" r="6" fill="#fff"/></svg>`,
});

export default function LeafletMap({ latitude, longitude, label }: { latitude: number; longitude: number; label: string }) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={pinIcon}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  );
}
