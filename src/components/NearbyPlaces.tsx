
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Star } from 'lucide-react';

interface PubStats {
  pub_name: string;
  location: string;
  formatted_address: string;
  avg_rating: number;
  avg_wait_time: number;
  distance_meters: number;
}

export const NearbyPlaces = () => {
  const [places, setPlaces] = useState<PubStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNearbyPlaces = async () => {
      try {
        if ('geolocation' in navigator) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const { data, error: dbError } = await supabase.rpc('get_pub_stats', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            radius_meters: 10000
          });

          if (dbError) throw dbError;
          setPlaces(data || []);
        } else {
          setError("Geolocation is not supported by your browser");
        }
      } catch (err) {
        setError("Could not fetch nearby places");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyPlaces();
  }, []);

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading nearby places...</div>;
  }

  if (error) {
    return <div className="text-center text-muted-foreground">{error}</div>;
  }

  if (places.length === 0) {
    return <div className="text-center text-muted-foreground">No places found nearby</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Places Near Me</h2>
      <div className="space-y-3">
        {places.map((place) => (
          <div 
            key={place.pub_name + place.location} 
            className="p-4 border border-black/10 rounded-xl bg-white/50 backdrop-blur-sm"
          >
            <h3 className="font-medium text-black">{place.pub_name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{place.formatted_address || place.location}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>{place.avg_rating || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{place.avg_wait_time ? `${place.avg_wait_time} min` : 'N/A'}</span>
              </div>
              <span className="text-muted-foreground">
                {(place.distance_meters / 1000).toFixed(1)}km away
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
