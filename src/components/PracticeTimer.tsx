import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PracticeTimerProps {
  onTimeUpdate?: (seconds: number) => void;
}

const PracticeTimer: React.FC<PracticeTimerProps> = ({ onTimeUpdate }) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => {
          const newTime = s + 1;
          onTimeUpdate?.(newTime);
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, onTimeUpdate]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setSeconds(0);
    setIsRunning(false);
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-elegant border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">Practice Timer</h3>
        <Clock size={20} className="text-muted-foreground" />
      </div>

      <div className="text-4xl font-mono font-bold text-center mb-6 text-primary">
        {formatTime(seconds)}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => setIsRunning(!isRunning)}
          variant={isRunning ? "destructive" : "default"}
          className="flex-1 h-12 font-semibold"
        >
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="px-6 h-12"
        >
          Reset
        </Button>
      </div>

      {/* Progress indicator */}
      {seconds > 0 && (
        <div className="mt-4 text-center">
          <div className="text-sm text-muted-foreground">
            {Math.floor(seconds / 60)} minutes practiced
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((seconds / 1800) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Goal: 30 minutes
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeTimer;