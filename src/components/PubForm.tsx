
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { LocationPicker } from './LocationPicker';

interface PubFormProps {
  initialData?: {
    name: string;
    location: string;
    orderType: string;
    drinkDetails: string;
    formatted_address?: string;
    place_id?: string;
    latitude?: number;
    longitude?: number;
  };
  onSubmit: (data: {
    name: string;
    location: string;
    orderType: string;
    drinkDetails: string;
    formatted_address?: string;
    place_id?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  onBack: () => void;
}

export const PubForm = ({ initialData, onSubmit, onBack }: PubFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    location: initialData?.location || '',
    orderType: initialData?.orderType || '',
    drinkDetails: initialData?.drinkDetails || '',
    formatted_address: initialData?.formatted_address || '',
    place_id: initialData?.place_id || '',
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        location: initialData.location || '',
        orderType: initialData.orderType || '',
        drinkDetails: initialData.drinkDetails || '',
        formatted_address: initialData.formatted_address || '',
        place_id: initialData.place_id || '',
        latitude: initialData.latitude,
        longitude: initialData.longitude,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({...formData, name: formData.location});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Establishment Details</h2>
      </div>

      <div className="space-y-4">
        <LocationPicker
          value={formData.location}
          initialValue={initialData?.location}
          onChange={(location, placeData) =>
            setFormData((prev) => ({
              ...prev,
              location,
              name: location,
              formatted_address: placeData?.formatted_address || prev.formatted_address,
              place_id: placeData?.place_id || prev.place_id,
              latitude: placeData?.latitude || prev.latitude,
              longitude: placeData?.longitude || prev.longitude,
            }))
          }
        />

        <div className="space-y-2">
          <Label htmlFor="orderType">Order Type</Label>
          <Select
            value={formData.orderType}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, orderType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select order type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beer">Beer</SelectItem>
              <SelectItem value="bottles">Bottles</SelectItem>
              <SelectItem value="cocktail">Cocktail</SelectItem>
              <SelectItem value="wine">Wine</SelectItem>
              <SelectItem value="spirit">Spirit</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="drinkDetails">Drink Details</Label>
          <Input
            id="drinkDetails"
            required
            placeholder="e.g., Guinness, Mojito, House Red"
            value={formData.drinkDetails}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, drinkDetails: e.target.value }))
            }
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full glass-button" 
        disabled={!formData.location || !formData.orderType || !formData.drinkDetails}
      >
        Start Timer
      </Button>
    </form>
  );
};
