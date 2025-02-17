import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Star, MapPin, History, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceAnalytics } from './ServiceAnalytics';

interface PubStats {
  pub_name: string;
  location: string;
  formatted_address: string;
  avg_rating: number;
  avg_wait_time: number;
  distance_meters: number;
}

interface RecentVisit {
  pub_name: string;
  location: string;
  formatted_address: string;
  rating: number;
  wait_time_seconds: number;
  created_at: string;
}

interface NearbyPlacesProps {
  onStartTimer?: (pubData: { name: string; formatted_address: string }) => void;
}

export const NearbyPlaces = ({ onStartTimer }: NearbyPlacesProps) => {
  const [places, setPlaces] = useState<PubStats[]>([]);
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's recent visits
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: visitsData } = await supabase
            .from('pub_visits')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
          setRecentVisits(visitsData || []);
        }

        // Fetch nearby places
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
        setError("Could not fetch places data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading places...</div>;
  }

  if (error) {
    return <div className="text-center text-muted-foreground">{error}</div>;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Tabs defaultValue="nearby" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="nearby">
          <MapPin className="h-4 w-4 mr-2" />
          Nearby
        </TabsTrigger>
        <TabsTrigger value="recent">
          <History className="h-4 w-4 mr-2" />
          Recent
        </TabsTrigger>
        <TabsTrigger value="search">
          <Search className="h-4 w-4 mr-2" />
          Search
        </TabsTrigger>
      </TabsList>

      <TabsContent value="nearby">
        {places.length === 0 ? (
          <div className="text-center text-muted-foreground">No places found nearby</div>
        ) : (
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
      </TabsContent>

      <TabsContent value="recent">
        {recentVisits.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No recent visits yet
          </div>
        ) : (
          <div className="space-y-3">
            {recentVisits.map((visit, index) => (
              <div 
                key={index}
                className="p-4 border border-black/10 rounded-xl bg-white/50 backdrop-blur-sm"
              >
                <h3 className="font-medium text-black">{visit.pub_name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{visit.formatted_address || visit.location}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{visit.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(visit.wait_time_seconds)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(visit.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="search">
        <ServiceAnalytics onStartTimer={onStartTimer} />
      </TabsContent>
    </Tabs>
  );
};
