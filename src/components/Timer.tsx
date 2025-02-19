
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Square, Star } from 'lucide-react';
import { toast } from 'sonner';

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

export const Timer = ({ pubData, onComplete, onBack, autoStart = false }: TimerProps) => {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [time, setTime] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [showInteractionCheck, setShowInteractionCheck] = useState(false);

  const handleInteraction = useCallback(() => {
    setLastInteraction(Date.now());
    if (showInteractionCheck) {
      setShowInteractionCheck(false);
      toast.success("Thanks for confirming! Keep the timer running.");
    }
  }, [showInteractionCheck]);

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = window.setInterval(() => {
        setTime((time) => {
          // Check for minimum time
          if (time === 29) {
            toast.error("Hold your horses! The drink's barely touched the glass! 🍺");
            return time + 1;
          }
          
          // Check for maximum time without interaction
          const timeSinceInteraction = Date.now() - lastInteraction;
          if (timeSinceInteraction > 4.5 * 60 * 1000 && !showInteractionCheck) { // 4.5 minutes
            setShowInteractionCheck(true);
            toast.warning("Are you still there? Tap/click anywhere to continue!");
          } else if (timeSinceInteraction > 5 * 60 * 1000) { // 5 minutes
            toast.error("Looks like you've wandered off! Timer stopped.");
            setIsRunning(false);
            onComplete();
            return time;
          }

          // Check for maximum time
          if (time === 20 * 60 - 1) { // 19:59
            toast.warning("20 minutes?! Either this is the world's slowest service, or you're having too good a time! 🎉");
          }
          
          return time + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, lastInteraction, onComplete, showInteractionCheck]);

  useEffect(() => {
    // Set up click listener for interaction check
    const handleClick = () => handleInteraction();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [handleInteraction]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { mins, secs };
  };

  const handleStop = () => {
    if (time < 30) {
      toast.error("Come on, it hasn't even been 30 seconds! Give them a chance! 😅");
      return;
    }
    setIsRunning(false);
    setShowRating(true);
  };

  const handleBack = () => {
    if (isRunning) {
      setIsRunning(false);
    }
    onBack();
  };

  const { mins, secs } = formatTime(time);

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleBack}
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
              onClick={onComplete}
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
