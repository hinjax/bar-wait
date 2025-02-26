
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Star } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface HistoryProps {
  onBack: () => void;
}

export const History = ({ onBack }: HistoryProps) => {
  const [times, setTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setTimes([]);
          return;
        }

        const { data, error } = await supabase
          .from('pub_visits')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTimes(data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${formattedDate} ${hours}:${minutes}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const extractCity = (location: string, formatted_address: string): string => {
    if (!location && !formatted_address) return '';
    
    // Define known cities and areas
    const cities = ['Wembley', 'London', 'Preston'];
    
    // Try formatted address first as it's more structured
    if (formatted_address) {
      const parts = formatted_address.split(',').map(part => part.trim());
      for (const part of parts) {
        const cityMatch = cities.find(city => 
          part.toLowerCase() === city.toLowerCase()
        );
        if (cityMatch) return cityMatch;
      }
    }
    
    // If no city found in formatted address, try location
    if (location) {
      const parts = location.split(',').map(part => part.trim());
      for (const part of parts) {
        const cityMatch = cities.find(city => 
          part.toLowerCase() === city.toLowerCase()
        );
        if (cityMatch) return cityMatch;
      }
    }
    
    // If no city found in either, return empty string
    return '';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold ml-2">History</h2>
      </div>

      {times.length === 0 ? (
        <div className="text-center space-y-4 py-8">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No times recorded yet</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Establishment</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {times.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.pub_name}</TableCell>
                  <TableCell>{extractCity(record.location, record.formatted_address)}</TableCell>
                  <TableCell>{record.order_type}</TableCell>
                  <TableCell>{formatTime(record.wait_time_seconds)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {record.rating && (
                        <>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>{record.rating}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDateTime(record.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
