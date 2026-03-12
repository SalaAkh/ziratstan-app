'use client';

import { useState } from 'react';

interface GeolocationState {
    lat: number | null;
    lng: number | null;
    error: string | null;
    loading: boolean;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        lat: null,
        lng: null,
        error: null,
        loading: false,
    });

    const getLocation = () => {
        if (!navigator.geolocation) {
            setState(prev => ({ ...prev, error: 'Геолокация не поддерживается вашим устройством' }));
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    error: null,
                    loading: false,
                });
            },
            (err) => {
                setState({
                    lat: null,
                    lng: null,
                    error: `Ошибка: ${err.message}`,
                    loading: false,
                });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return { ...state, getLocation };
}
