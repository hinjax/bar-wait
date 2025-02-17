import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Clock, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DrinkStats {
  drink_details: string;
  avg_wait_time: number;
  count: number;
}

interface PubStats {
  pub_name: string;
  formatted_address: string;
  avg_wait_time: number;
  visit_count: number;
  drink_stats: DrinkStats[];
}

interface ServiceAnalyticsProps {
  onStartTimer?: (pubData: { name: string; formatted_address: string }) => void;
}

export const ServiceAnalytics = ({ onStartTimer }: ServiceAnalyticsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PubStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lastSearchedPlace, setLastSearchedPlace] = useState<{ name: string; formatted_address: string } | null>(null);
  const autoCompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadGoogleMapsAPI = async () => {
      try {
        const { data, error } = await supabase
          .from('app_secrets')
          .select('value')
          .eq('key', 'GOOGLE_MAPS_API_KEY')
          .single();

        if (error) throw error;
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.value}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initializeAutocomplete;
        document.head.appendChild(script);

        return () => {
          document.head.removeChild(script);
        };
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
      }
    };

    loadGoogleMapsAPI();
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current) return;

    autoCompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment'],
      fields: ['formatted_address', 'name'],
    });

    autoCompleteRef.current.addListener('place_changed', () => {
      const place = autoCompleteRef.current?.getPlace();
      if (place) {
        setSearchTerm(place.name);
        handleSearch(place.name);
      }
    });
  };

  const handleSearch = async (placeName: string = searchTerm) => {
    if (!placeName.trim()) return;
    
    setLoading(true);
    try {
      const place = autoCompleteRef.current?.getPlace();
      setLastSearchedPlace(place ? {
        name: place.name,
        formatted_address: place.formatted_address
      } : {
        name: placeName,
        formatted_address: placeName
      });

      const { data: pubStats, error: pubError } = await supabase
        .from('pub_visits')
        .select('pub_name, formatted_address, wait_time_seconds')
        .ilike('pub_name', `%${placeName}%`)
        .limit(10);

      if (pubError) throw pubError;

      if (!pubStats || pubStats.length === 0) {
        setResults([]);
        setSearched(true);
        return;
      }

      const pubMap = new Map<string, PubStats>();

      for (const pub of pubStats) {
        const { data: drinkStats, error: drinkError } = await supabase
          .from('pub_visits')
          .select('drink_details, wait_time_seconds')
          .eq('pub_name', pub.pub_name);

        if (drinkError) throw drinkError;

        const drinkMap = new Map<string, { total: number, count: number }>();
        drinkStats?.forEach(visit => {
          const current = drinkMap.get(visit.drink_details) || { total: 0, count: 0 };
          drinkMap.set(visit.drink_details, {
            total: current.total + visit.wait_time_seconds,
            count: current.count + 1
          });
        });

        const drinkStatsArray: DrinkStats[] = Array.from(drinkMap.entries()).map(([drink, stats]) => ({
          drink_details: drink,
          avg_wait_time: stats.total / stats.count,
          count: stats.count
        }));

        const existingPub = pubMap.get(pub.pub_name);
        if (!existingPub) {
          pubMap.set(pub.pub_name, {
            pub_name: pub.pub_name,
            formatted_address: pub.formatted_address || '',
            avg_wait_time: drinkStats?.reduce((acc, curr) => acc + curr.wait_time_seconds, 0) || 0 / (drinkStats?.length || 1),
            visit_count: drinkStats?.length || 0,
            drink_stats: drinkStatsArray
          });
        }
      }

      setResults(Array.from(pubMap.values()));
    } catch (error) {
      console.error('Error searching pubs:', error);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Search for a pub..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={() => handleSearch()}
          disabled={loading}
          size="icon"
          className="shrink-0"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Searching...
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-muted-foreground">
            No previous visits found for this place
          </p>
          {lastSearchedPlace && onStartTimer && (
            <Button
              onClick={() => onStartTimer(lastSearchedPlace)}
              className="bg-black hover:bg-black/90"
            >
              <Timer className="h-4 w-4 mr-2" />
              Start First Timer
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((pub) => (
            <div 
              key={pub.pub_name}
              className="p-4 border border-black/10 rounded-xl bg-white/50 backdrop-blur-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-black">{pub.pub_name}</h3>
                  <p className="text-sm text-muted-foreground">{pub.formatted_address}</p>
                </div>
                {onStartTimer && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStartTimer({
                      name: pub.pub_name,
                      formatted_address: pub.formatted_address
                    })}
                    className="shrink-0"
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Average wait: {formatTime(pub.avg_wait_time)}</span>
                <span className="text-muted-foreground">
                  ({pub.visit_count} visits)
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">By drink type:</p>
                <div className="grid gap-2">
                  {pub.drink_stats.map((drink) => (
                    <div 
                      key={drink.drink_details}
                      className="text-sm flex items-center justify-between p-2 bg-black/5 rounded"
                    >
                      <span>{drink.drink_details}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatTime(drink.avg_wait_time)}</span>
                        <span className="text-muted-foreground text-xs">
                          ({drink.count} orders)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
