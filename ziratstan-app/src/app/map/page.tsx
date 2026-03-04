'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Search, Locate, MapPin } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

// Динамический импорт карты — Leaflet не работает на сервере (нет window)
const GraveMap = dynamic(() => import('@/components/map/GraveMap'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full bg-primary/5 rounded-2xl">
            <p className="animate-pulse text-foreground/60">Загрузка карты...</p>
        </div>
    ),
});

// Мок-данные захоронений в Алматы для демонстрации
const MOCK_PROFILES = [
    {
        id: 'test-id',
        first_name: 'Динмухамед',
        last_name: 'Кунаев',
        birth_date: '1912',
        death_date: '1993',
        lat: 43.2658,
        lng: 76.9430,
    },
    {
        id: 'mock-2',
        first_name: 'Алихан',
        last_name: 'Бокейханов',
        birth_date: '1866',
        death_date: '1937',
        lat: 43.2571,
        lng: 76.9310,
    },
    {
        id: 'mock-3',
        first_name: 'Абай',
        last_name: 'Кунанбаев',
        birth_date: '1845',
        death_date: '1904',
        lat: 43.2540,
        lng: 76.9380,
    },
];

export default function MapPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const { lat, lng, loading, error, getLocation } = useGeolocation();

    const filteredProfiles = MOCK_PROFILES.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
            p.first_name.toLowerCase().includes(q) ||
            (p.last_name || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Шапка поиска */}
            <div className="px-4 py-4 space-y-3 bg-background/90 backdrop-blur-sm z-10 shadow-md">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    Карта Захоронений
                </h1>

                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-xl px-4">
                        <Search className="w-4 h-4 text-accent flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Поиск по имени или фамилии..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-3 bg-transparent text-sm outline-none placeholder:text-foreground/40"
                        />
                    </div>
                    <button
                        onClick={getLocation}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-3 bg-primary text-background rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                        <Locate className="w-4 h-4" />
                        {loading ? '...' : 'Я здесь'}
                    </button>
                </div>

                {error && (
                    <p className="text-xs text-red-400 px-2">{error}</p>
                )}

                {lat && lng && (
                    <p className="text-xs text-green-500 px-2">
                        ✓ Геолокация определена. Карта перемещается к вам.
                    </p>
                )}
            </div>

            {/* Полноэкранная карта */}
            <div className="flex-1 p-2">
                <GraveMap
                    profiles={filteredProfiles}
                    userLat={lat}
                    userLng={lng}
                    center={[43.2567, 76.9286]}
                />
            </div>

            {/* Список найденных внизу (если поиск активен) */}
            {searchQuery && filteredProfiles.length > 0 && (
                <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-xs text-foreground/50">
                        Найдено: {filteredProfiles.length}
                    </p>
                    {filteredProfiles.map((p) => (
                        <a
                            key={p.id}
                            href={`/profile/${p.id}`}
                            className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 hover:bg-primary/10 transition"
                        >
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                                {p.first_name[0]}
                            </div>
                            <div>
                                <p className="font-medium text-sm">
                                    {p.last_name} {p.first_name}
                                </p>
                                {p.birth_date && p.death_date && (
                                    <p className="text-xs text-foreground/50">
                                        {p.birth_date} — {p.death_date}
                                    </p>
                                )}
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
