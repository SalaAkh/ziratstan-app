'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Search, Locate, MapPin } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/lib/supabase';

const GraveMap = dynamic(() => import('@/components/map/GraveMap'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full bg-primary/5 rounded-2xl">
            <p className="animate-pulse text-foreground/60">Загрузка карты...</p>
        </div>
    ),
});

type MapProfile = {
    id: string;
    first_name: string;
    last_name: string | null;
    birth_date: string | null;
    death_date: string | null;
    lat: number;
    lng: number;
};

type DbProfileRow = {
    id: string;
    first_name: string;
    last_name: string | null;
    birth_date: string | null;
    death_date: string | null;
    location: { type?: string; coordinates?: [number, number] } | null;
};

function toMapProfiles(rows: DbProfileRow[]): MapProfile[] {
    return rows
        .map((row) => {
            const coordinates = row.location?.coordinates;
            const lng = Array.isArray(coordinates) ? Number(coordinates[0]) : NaN;
            const lat = Array.isArray(coordinates) ? Number(coordinates[1]) : NaN;

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return null;
            }

            return {
                id: row.id,
                first_name: row.first_name,
                last_name: row.last_name,
                birth_date: row.birth_date,
                death_date: row.death_date,
                lat,
                lng,
            };
        })
        .filter((item): item is MapProfile => item !== null);
}

export default function MapPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [profiles, setProfiles] = useState<MapProfile[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [profilesError, setProfilesError] = useState<string | null>(null);
    const { lat, lng, loading, error, getLocation } = useGeolocation();

    useEffect(() => {
        let isMounted = true;

        async function loadProfiles() {
            setLoadingProfiles(true);
            setProfilesError(null);

            const { data, error: dbError } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, birth_date, death_date, location')
                .eq('visibility_status', 'public')
                .not('location', 'is', null)
                .limit(5000);

            if (!isMounted) return;

            if (dbError) {
                setProfiles([]);
                setProfilesError(dbError.message);
                setLoadingProfiles(false);
                return;
            }

            setProfiles(toMapProfiles((data || []) as DbProfileRow[]));
            setLoadingProfiles(false);
        }

        loadProfiles();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredProfiles = (() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return profiles;
        return profiles.filter((profile) => {
            return (
                profile.first_name.toLowerCase().includes(q) ||
                (profile.last_name || '').toLowerCase().includes(q)
            );
        });
    })();

    return (
        <div className="flex flex-col h-screen bg-background">
            <div className="px-4 py-4 space-y-3 bg-background/90 backdrop-blur-sm z-10 shadow-md">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-accent" />
                    Карта захоронений
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

                {profilesError && <p className="text-xs text-red-400 px-2">Ошибка загрузки данных: {profilesError}</p>}
                {error && <p className="text-xs text-red-400 px-2">{error}</p>}
                {lat && lng && (
                    <p className="text-xs text-green-500 px-2">✓ Геолокация определена. Карта перемещается к вам.</p>
                )}
                {!loadingProfiles && !profilesError && (
                    <p className="text-xs text-foreground/50 px-2">Профилей на карте: {profiles.length}</p>
                )}
            </div>

            <div className="flex-1 p-2">
                <GraveMap
                    profiles={filteredProfiles}
                    userLat={lat}
                    userLng={lng}
                    center={[43.2567, 76.9286]}
                />
            </div>

            {!loadingProfiles && searchQuery && filteredProfiles.length > 0 && (
                <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-xs text-foreground/50">Найдено: {filteredProfiles.length}</p>
                    {filteredProfiles.map((profile) => (
                        <a
                            key={profile.id}
                            href={`/profile/${profile.id}`}
                            className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10 hover:bg-primary/10 transition"
                        >
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                                {profile.first_name[0]}
                            </div>
                            <div>
                                <p className="font-medium text-sm">
                                    {profile.last_name} {profile.first_name}
                                </p>
                                {profile.birth_date && profile.death_date && (
                                    <p className="text-xs text-foreground/50">
                                        {new Date(profile.birth_date).getFullYear()} — {new Date(profile.death_date).getFullYear()}
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
