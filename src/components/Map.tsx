
import { useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Loader2 } from 'lucide-react';

interface MapProps {
  userLocation?: { lat: number; lng: number };
  places?: Array<{
    pub_name: string;
    latitude: number;
    longitude: number;
    formatted_address: string;
  }>;
  height?: string;
}

export const Map = ({ userLocation, places = [], height = "300px" }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !userLocation) return;

      // Initialize the map
      const map = new google.maps.Map(mapRef.current, {
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
      new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
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
          const marker = new google.maps.Marker({
            position: { lat: place.latitude, lng: place.longitude },
            map: map,
            title: place.pub_name,
          });

          const infoWindow = new google.maps.InfoWindow({
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
  }, [userLocation, places]);

  if (!userLocation) {
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
