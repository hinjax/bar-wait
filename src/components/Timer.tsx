import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Square, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TimerProps {
  pubData: {
    name: string;
    location: string;
    orderType: string;
    drinkDetails: string;
    formatted_address?: string;
    place_id?: string;
    latitude?: number;
    longitude?: number;
  };
  onComplete: () => void;
  onBack: () => void;
}

export const Timer = ({ pubData, onComplete, onBack }: TimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [savedTimes, setSavedTimes] = useState<any[]>(() => {
    const saved = localStorage.getItem('pubTimes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = window.setInterval(() => {
        setTime((time) => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { mins, secs };
  };

  const handleStop = () => {
    setIsRunning(false);
    setShowRating(true);
  };

  const handleRatingSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('pub_visits').insert({
        pub_name: pubData.name,
        location: pubData.location,
        order_type: pubData.orderType,
        drink_details: pubData.drinkDetails,
        wait_time_seconds: time,
        formatted_address: pubData.formatted_address,
        place_id: pubData.place_id,
        latitude: pubData.latitude,
        longitude: pubData.longitude,
        rating: rating,
        user_id: user.id
      });

      if (error) throw error;

      const newTime = {
        ...pubData,
        time,
        rating,
        date: new Date().toISOString(),
      };
      
      const updatedTimes = [...savedTimes, newTime];
      setSavedTimes(updatedTimes);
      localStorage.setItem('pubTimes', JSON.stringify(updatedTimes));
      
      toast.success('Time and rating logged successfully!');
      onComplete();
    } catch (error) {
      console.error('Error saving pub visit:', error);
      toast.error('Failed to save pub visit');
    }
  };

  const { mins, secs } = formatTime(time);

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isRunning}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold ml-2">Timer</h2>
      </div>

      <div className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">{pubData.name}</p>
          <p className="text-sm text-muted-foreground">
            {pubData.orderType} - {pubData.drinkDetails}
          </p>
        </div>

        <div className="flex justify-center items-baseline space-x-2 py-8">
          <div className="text-7xl font-mono font-light tracking-tighter">
            {mins}
          </div>
          <div className="text-2xl font-mono text-muted-foreground">m</div>
          <div className="text-7xl font-mono font-light tracking-tighter">
            {secs.toString().padStart(2, '0')}
          </div>
          <div className="text-2xl font-mono text-muted-foreground">s</div>
        </div>

        <div className="w-full bg-gray-200 h-0.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-1000"
            style={{ width: `${(time % 60) * 1.67}%` }}
          />
        </div>

        {!showRating ? (
          <div className="flex justify-center space-x-4">
            {!isRunning ? (
              <Button
                onClick={() => setIsRunning(true)}
                size="lg"
                className="glass-button"
              >
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                size="lg"
                variant="destructive"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Service Rating</h3>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleRatingSubmit}
              size="lg"
              className="w-full glass-button"
              disabled={rating === 0}
            >
              Submit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
