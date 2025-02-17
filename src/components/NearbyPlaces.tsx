
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PubStats {
  pub_name: string;
  location: string;
  formatted_address: string;
  avg_rating: number;
  avg_wait_time: number;
  distance_meters: number;
}

interface NearbyPlacesProps {
  onStartTimer?: (pubData: { name: string; formatted_address: string }) => void;
}

export const NearbyPlaces = ({ onStartTimer }: NearbyPlacesProps) => {
  const [places, setPlaces] = useState<PubStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationRequested, setLocationRequested] = useState(false);

  const requestLocationAndFetchPlaces = async () => {
    setLocationRequested(true);
    setLoading(true);
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });

        const { data, error: dbError } = await supabase.rpc('get_pub_stats', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius_meters: 5000 // Reduced radius to 5km for more relevant results
        });

        if (dbError) throw dbError;
        
        // Sort places by distance
        const sortedPlaces = (data || []).sort((a, b) => 
          a.distance_meters - b.distance_meters
        );
        
        setPlaces(sortedPlaces);
        toast.success('Found nearby places!');
      } else {
        setError("Geolocation is not supported by your browser");
        toast.error("Your browser doesn't support location services");
      }
    } catch (err) {
      console.error(err);
      if (err instanceof GeolocationPositionError) {
        switch(err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please enable location services to see nearby places.");
            toast.error("Location permission denied");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            toast.error("Couldn't get your location");
            break;
          case err.TIMEOUT:
            setError("Location request timed out.");
            toast.error("Location request timed out");
            break;
          default:
            setError("Could not fetch places data");
            toast.error("Error finding nearby places");
        }
      } else {
        setError("Could not fetch places data");
        toast.error("Error finding nearby places");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!locationRequested) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">
          Would you like to see bars and restaurants near you?
        </p>
        <Button 
          onClick={requestLocationAndFetchPlaces}
          className="bg-black hover:bg-black/90"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Share Location
        </Button>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center text-muted-foreground">Finding places near you...</div>;
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
    <div>
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
      {places.length === 0 ? (
        <div className="text-center text-muted-foreground">No places found nearby</div>
      ) : (
        <div className="space-y-3">
          {places.map((place) => (
            <div 
              key={place.pub_name + place.location} 
              className="p-4 border border-black/10 rounded-xl bg-white/50 backdrop-blur-sm cursor-pointer hover:bg-white/80 transition-colors"
              onClick={() => onStartTimer?.({
                name: place.pub_name,
                formatted_address: place.formatted_address || place.location
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
