
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Square, Star, History, MapPin, RotateCw, Clock, Users } from 'lucide-react';
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
  autoStart?: boolean;
}

interface PubStats {
  avg_wait_time: number;
  visit_count: number;
  drink_stats: {
    drink_details: string;
    order_type: string;
    avg_wait_time: number;
    count: number;
  }[];
  avg_rating: number;
}

export const Timer = ({ pubData, onComplete, onBack, autoStart = false }: TimerProps) => {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [time, setTime] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [savedTime, setSavedTime] = useState<{
    timeString: string;
    rating: number;
  } | null>(null);
  const [pubStats, setPubStats] = useState<PubStats | null>(null);

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

      const { mins, secs } = formatTime(time);
      const timeString = `${mins}m ${secs}s`;

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

      setSavedTime({ timeString, rating });
      setShowRating(false);
      setShowCompletion(true);
      
      toast.success('Successfully saved your visit!');
    } catch (error) {
      console.error('Error saving pub visit:', error);
      toast.error('Failed to save pub visit');
    }
  };

  const fetchPubStats = async () => {
    try {
      const { data: visits, error } = await supabase
        .from('pub_visits')
        .select('wait_time_seconds, rating, order_type, drink_details')
        .eq('pub_name', pubData.name);

      if (error) throw error;

      if (!visits || visits.length === 0) {
        return;
      }

      const avgWaitTime = visits.reduce((acc, visit) => acc + (visit.wait_time_seconds || 0), 0) / visits.length;
      const avgRating = visits.reduce((acc, visit) => acc + (visit.rating || 0), 0) / visits.length;

      const drinkGroups = visits.reduce((acc, visit) => {
        const key = `${visit.order_type} - ${visit.drink_details}`;
        if (!acc[key]) {
          acc[key] = {
            drink_details: visit.drink_details,
            order_type: visit.order_type,
            total_time: 0,
            count: 0
          };
        }
        acc[key].total_time += visit.wait_time_seconds || 0;
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, any>);

      const drinkStats = Object.values(drinkGroups).map(group => ({
        drink_details: group.drink_details,
        order_type: group.order_type,
        avg_wait_time: group.total_time / group.count,
        count: group.count
      }));

      setPubStats({
        avg_wait_time: avgWaitTime,
        visit_count: visits.length,
        drink_stats: drinkStats,
        avg_rating: avgRating
      });

    } catch (error) {
      console.error('Error fetching pub stats:', error);
    }
  };

  useEffect(() => {
    if (showCompletion) {
      fetchPubStats();
    }
  }, [showCompletion]);

  const { mins, secs } = formatTime(time);

  if (showCompletion && savedTime) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Thank You!</h2>
          <div className="space-y-2">
            <p className="text-lg font-medium">{pubData.name}</p>
            <p className="text-sm text-muted-foreground">
              {pubData.orderType} - {pubData.drinkDetails}
            </p>
            <div className="flex justify-center items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{savedTime.rating}</span>
              </div>
              <span className="text-muted-foreground">
                Wait time: {savedTime.timeString}
              </span>
            </div>
          </div>
        </div>

        {pubStats && (
          <div className="bg-white/50 backdrop-blur-sm border border-black/10 rounded-xl p-4 space-y-4">
            <h3 className="font-medium text-center">Pub Statistics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center space-y-1">
                <div className="flex justify-center items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Average Wait</span>
                </div>
                <p className="font-medium">
                  {Math.round(pubStats.avg_wait_time / 60)}m {Math.round(pubStats.avg_wait_time % 60)}s
                </p>
              </div>
              
              <div className="text-center space-y-1">
                <div className="flex justify-center items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Total Visits</span>
                </div>
                <p className="font-medium">{pubStats.visit_count}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Wait times by drink:</p>
              <div className="space-y-2">
                {pubStats.drink_stats.map((stat, index) => (
                  <div 
                    key={index}
                    className="bg-black/5 rounded p-2 text-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span>{stat.order_type} - {stat.drink_details}</span>
                      <span className="text-muted-foreground text-xs">
                        ({stat.count} orders)
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      Average: {Math.round(stat.avg_wait_time / 60)}m {Math.round(stat.avg_wait_time % 60)}s
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-center mb-4">What would you like to do next?</h3>
          
          <Button
            onClick={() => onComplete()}
            className="w-full h-12 border-2 border-black text-black hover:bg-black/5"
            variant="outline"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Find Another Place
          </Button>
          
          <Button
            onClick={() => {
              onComplete();
              // Navigate back to form to select a new drink
              onBack();
            }}
            variant="outline"
            className="w-full h-12 border-2 border-black text-black hover:bg-black/5"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Time Another Order Here
          </Button>
          
          <Button
            onClick={() => {
              onComplete();
              // You can add navigation to history here if needed
            }}
            variant="outline"
            className="w-full h-12 border-2 border-black text-black hover:bg-black/5"
          >
            <History className="mr-2 h-4 w-4" />
            View History
          </Button>
        </div>
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
