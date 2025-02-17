
/// <reference types="google.maps" />
import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MapProps {
  userLocation?: { lat: number; lng: number };
  places?: Array<{
    pub_name: string;
    latitude?: number;
    longitude?: number;
    formatted_address: string;
  }>;
  height?: string;
}

export const Map = ({ userLocation, places = [], height = "300px" }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMapsAPI = async () => {
      try {
        // Get the API key from Supabase
        const { data, error } = await supabase
          .from('app_secrets')
          .select('value')
          .eq('key', 'GOOGLE_MAPS_API_KEY')
          .single();

        if (error) throw error;
        
        // Create and load the script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.value}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setScriptLoaded(true);
        document.head.appendChild(script);

        return () => {
          // Cleanup script on unmount
          document.head.removeChild(script);
        };
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
      }
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !userLocation || !scriptLoaded || !window.google) return;

      // Initialize the map
      const map = new window.google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 13,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      mapInstanceRef.current = map;

      // Add user location marker
      new window.google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#000",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#fff",
        },
        title: "Your Location",
      });

      // Add place markers
      places.forEach((place) => {
        if (place.latitude && place.longitude) {
          const marker = new window.google.maps.Marker({
            position: { lat: place.latitude, lng: place.longitude },
            map: map,
            title: place.pub_name,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-medium">${place.pub_name}</h3>
                <p class="text-sm">${place.formatted_address}</p>
              </div>
            `,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
        }
      });
    };

    initMap();

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [userLocation, places, scriptLoaded]);

  if (!userLocation || !scriptLoaded) {
    return (
      <Card className="w-full flex items-center justify-center" style={{ height }}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <div ref={mapRef} style={{ height }} className="w-full" />
    </Card>
  );
};
