
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Star, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Map } from './Map';

interface PubStats {
  pub_name: string;
  location: string;
  formatted_address: string;
  avg_rating: number;
  avg_wait_time: number;
  distance_meters: number;
  latitude?: number;
  longitude?: number;
}

interface NearbyPlacesProps {
  onStartTimer?: (pubData: { 
    name: string; 
    formatted_address: string;
    place_id?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
}

export const NearbyPlaces = ({ onStartTimer }: NearbyPlacesProps) => {
  const [places, setPlaces] = useState<PubStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const searchNearbyPubs = async (position: GeolocationPosition) => {
    try {
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('app_secrets')
        .select('value')
        .eq('key', 'GOOGLE_MAPS_API_KEY')
        .single();

      if (apiKeyError) throw apiKeyError;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${position.coords.latitude},${position.coords.longitude}&` +
        `radius=5000&` +
        `type=bar|pub&` +
        `key=${apiKeyData.value}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch nearby places');
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        const placesData = data.results.map((place: any) => ({
          pub_name: place.name,
          location: place.vicinity,
          formatted_address: place.vicinity,
          avg_rating: place.rating || 0,
          avg_wait_time: 0, // We'll get this from our database
          distance_meters: place.distance || 0,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        }));

        setPlaces(placesData);
        toast.success(`Found ${placesData.length} nearby pubs and bars`);
      } else {
        setPlaces([]);
        toast.info('No pubs or bars found nearby');
      }
    } catch (err) {
      console.error('Error fetching nearby places:', err);
      toast.error('Failed to fetch nearby places');
      setError('Failed to fetch nearby places');
    }
  };

  const requestLocationAndFetchPlaces = async () => {
    setLocationRequested(true);
    setLoading(true);
    setError(null);
    
    try {
      if (!('geolocation' in navigator)) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });

      await searchNearbyPubs(position);
      
    } catch (err) {
      console.error('Error getting location:', err);
      let errorMessage = "An error occurred while finding nearby places";
      
      if (err instanceof GeolocationPositionError) {
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location services to see nearby places.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case err.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!locationRequested && !loading && !places.length) {
      requestLocationAndFetchPlaces();
    }
  }, [locationRequested, loading, places.length]);

  if (loading) {
    return (
      <div className="text-center space-y-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-black" />
        <p className="text-muted-foreground">Finding places near you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="text-muted-foreground">{error}</div>
        <Button 
          variant="outline" 
          onClick={requestLocationAndFetchPlaces}
          className="border-2 border-black text-black hover:bg-black/5"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Nearby Places
        </h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={requestLocationAndFetchPlaces}
          className="text-sm"
        >
          Refresh
        </Button>
      </div>

      {userLocation && (
        <Map 
          userLocation={userLocation}
          places={places}
          height="300px"
        />
      )}

      {places.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No places found nearby</p>
          <Button
            onClick={requestLocationAndFetchPlaces}
            variant="ghost"
            size="sm"
            className="mt-2"
          >
            Retry Search
          </Button>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {places.map((place, index) => (
            <div 
              key={`${place.pub_name}-${index}`}
              className="p-4 border border-black/10 rounded-xl bg-white/50 backdrop-blur-sm cursor-pointer hover:bg-white/80 transition-colors"
              onClick={() => onStartTimer?.({
                name: place.pub_name,
                formatted_address: place.formatted_address || place.location,
                latitude: place.latitude,
                longitude: place.longitude
              })}
            >
              <h3 className="font-medium text-black">{place.pub_name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{place.formatted_address || place.location}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>{place.avg_rating ? place.avg_rating.toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{place.avg_wait_time ? `${Math.round(place.avg_wait_time / 60)} min` : 'N/A'}</span>
                </div>
                <span className="text-muted-foreground">
                  {(place.distance_meters / 1000).toFixed(1)}km away
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
