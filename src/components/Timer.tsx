
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Square } from 'lucide-react';
import { toast } from 'sonner';

interface TimerProps {
  pubData: {
    name: string;
    location: string;
    orderType: string;
    drinkDetails: string;
  };
  onComplete: () => void;
  onBack: () => void;
}

export const Timer = ({ pubData, onComplete, onBack }: TimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setIsRunning(false);
    const newTime = {
      ...pubData,
      time,
      date: new Date().toISOString(),
    };
    const updatedTimes = [...savedTimes, newTime];
    setSavedTimes(updatedTimes);
    localStorage.setItem('pubTimes', JSON.stringify(updatedTimes));
    toast.success('Time logged successfully!');
    onComplete();
  };

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

        <div className="flex justify-center">
          <div className="text-6xl font-mono font-bold py-8">
            {formatTime(time)}
          </div>
        </div>

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
      </div>
    </div>
  );
};
