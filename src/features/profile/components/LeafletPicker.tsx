"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const pinIcon = L.divIcon({
  className: "",
  iconSize: [36, 46],
  iconAnchor: [18, 46],
  html: `<svg width="36" height="46" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.2 0 0 7 0 15.7 0 27.5 16 42 16 42s16-14.5 16-26.3C32 7 24.8 0 16 0Z" fill="#F79B29" stroke="#1c3a2e" stroke-width="1.5"/><circle cx="16" cy="15.5" r="6" fill="#fff"/></svg>`,
});

type Point = { lat: number; lng: number };

/** Ikuti perubahan titik dari luar (mis. tombol GPS) dengan animasi terbang. */
function FlyTo({ point, zoom }: { point: Point; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), zoom), { duration: 0.8 });
  }, [map, point.lat, point.lng, zoom]);
  return null;
}

function ClickToMove({ onMove }: { onMove: (point: Point) => void }) {
  useMapEvents({ click: (event) => onMove({ lat: event.latlng.lat, lng: event.latlng.lng }) });
  return null;
}

/** Peta dengan pin yang bisa digeser / dipindah dengan klik. */
export default function LeafletPicker({ point, onMove }: { point: Point; onMove: (point: Point) => void }) {
  return (
    <MapContainer center={[point.lat, point.lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[point.lat, point.lng]}
        icon={pinIcon}
        draggable
        eventHandlers={{
          dragend: (event) => {
            const latlng = (event.target as L.Marker).getLatLng();
            onMove({ lat: latlng.lat, lng: latlng.lng });
          },
        }}
      />
      <ClickToMove onMove={onMove} />
      <FlyTo point={point} zoom={15} />
    </MapContainer>
  );
}
