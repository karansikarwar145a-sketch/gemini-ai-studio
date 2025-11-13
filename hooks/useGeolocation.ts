
import { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
}

export const useGeolocation = (enabled: boolean) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setError(null);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(`Failed to get location: ${err.message}`);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError);

  }, [enabled]);

  return { location, error };
};
