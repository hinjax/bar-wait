
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google: any;
  }
}

interface LocationPickerProps {
  value: string;
  onChange: (location: string, placeData?: {
    formatted_address: string;
    place_id: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
  const autoCompleteRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const loadGoogleMapsAPI = async () => {
      try {
        const { data, error } = await supabase
          .from('app_secrets')
          .select('value')
          .eq('key', 'GOOGLE_MAPS_API_KEY')
          .single();

        if (error) throw error;
        
        setApiKey(data.value);
        
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
      fields: ['formatted_address', 'geometry', 'place_id', 'name'],
    });

    autoCompleteRef.current.addListener('place_changed', () => {
      const place = autoCompleteRef.current?.getPlace();
      if (place && place.geometry?.location) {
        onChange(place.name || value, {
          formatted_address: place.formatted_address || '',
          place_id: place.place_id || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        });
      }
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="location">Establishment</Label>
      <Input
        ref={inputRef}
        id="location"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing to search for establishments..."
      />
    </div>
  );
};
