
import { useState } from 'react';
import { Card } from '@/components/ui/card';
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

interface PubFormProps {
  onSubmit: (data: { name: string; location: string; orderType: string; drinkDetails: string }) => void;
  onBack: () => void;
}

export const PubForm = ({ onSubmit, onBack }: PubFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    orderType: '',
    drinkDetails: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
        <h2 className="text-2xl font-bold">Pub Details</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Pub Name</Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            required
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orderType">Order Type</Label>
          <Select
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, orderType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select order type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pint">Pint</SelectItem>
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
        disabled={!formData.name || !formData.location || !formData.orderType || !formData.drinkDetails}
      >
        Start Timer
      </Button>
    </form>
  );
};
