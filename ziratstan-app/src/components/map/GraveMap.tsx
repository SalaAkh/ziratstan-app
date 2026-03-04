'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet иконки (нужно переопределить для работы в Next.js)
const graveIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <rect x="8" y="2" width="8" height="14" rx="4" fill="#2d3748"/>
      <rect x="11" y="4" width="2" height="8" fill="#d4af37"/>
      <rect x="8" y="6" width="8" height="2" fill="#d4af37"/>
      <rect x="5" y="16" width="14" height="2" rx="1" fill="#4a5568"/>
    </svg>
  `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="#d4af37" opacity="0.8"/>
      <circle cx="12" cy="12" r="5" fill="#2d3748"/>
    </svg>
  `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

interface MapProfile {
    id: string;
    first_name: string;
    last_name: string | null;
    birth_date: string | null;
    death_date: string | null;
    lat: number;
    lng: number;
}

interface GraveMapProps {
    profiles?: MapProfile[];
    userLat?: number | null;
    userLng?: number | null;
    center?: [number, number];
}

// Компонент для перемещения камеры
function FlyToUser({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 17, { duration: 1.5 });
    }, [lat, lng, map]);
    return null;
}

export default function GraveMap({ profiles = [], userLat, userLng, center = [43.2567, 76.9286] }: GraveMapProps) {
    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
            className="z-0"
        >
            {/* Бесплатные тайлы OpenStreetMap */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Маркеры могил */}
            {profiles.map((p) => (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={graveIcon}>
                    <Popup>
                        <div className="text-center min-w-[150px]">
                            <p className="font-bold text-base">
                                {p.last_name} {p.first_name}
                            </p>
                            {p.birth_date && p.death_date && (
                                <p className="text-sm text-gray-600">
                                    {p.birth_date} — {p.death_date}
                                </p>
                            )}
                            <a
                                href={`/profile/${p.id}`}
                                className="mt-2 inline-block bg-gray-800 text-white text-sm px-3 py-1 rounded-full hover:opacity-80"
                            >
                                Открыть профиль
                            </a>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Позиция пользователя */}
            {userLat && userLng && (
                <>
                    <Marker position={[userLat, userLng]} icon={userIcon}>
                        <Popup>Вы здесь</Popup>
                    </Marker>
                    <FlyToUser lat={userLat} lng={userLng} />
                </>
            )}
        </MapContainer>
    );
}
