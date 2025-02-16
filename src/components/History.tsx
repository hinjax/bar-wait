
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
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

interface HistoryProps {
  onBack: () => void;
}

export const History = ({ onBack }: HistoryProps) => {
  const [times, setTimes] = useState<any[]>([]);

  useEffect(() => {
    const savedTimes = localStorage.getItem('pubTimes');
    if (savedTimes) {
      setTimes(JSON.parse(savedTimes));
    }
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
                <TableHead>Pub</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {times.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.name}</TableCell>
                  <TableCell>{record.orderType}</TableCell>
                  <TableCell>{formatTime(record.time)}</TableCell>
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
                  <TableCell>{formatDate(record.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
