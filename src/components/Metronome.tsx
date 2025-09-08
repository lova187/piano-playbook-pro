import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import * as Tone from 'tone';
import { Button } from '@/components/ui/button';

const Metronome: React.FC = () => {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const loopRef = useRef<Tone.Loop | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const click = new Tone.MembraneSynth().toDestination();
      loopRef.current = new Tone.Loop((time) => {
        click.triggerAttackRelease("C2", "32n", time);
        Tone.Draw.schedule(() => {
          setBeat(b => (b + 1) % 4);
        }, time);
      }, `4n`).start(0);
      
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.start();
    } else {
      Tone.Transport.stop();
      loopRef.current?.dispose();
      setBeat(0);
    }

    return () => {
      Tone.Transport.stop();
      loopRef.current?.dispose();
    };
  }, [isPlaying, bpm]);

  return (
    <div className="bg-card rounded-xl p-6 shadow-elegant border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Metronome</h3>
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          variant={isPlaying ? "destructive" : "default"}
          size="sm"
          className="w-12 h-12 rounded-full"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <input
          type="range"
          min="40"
          max="220"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer 
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                   [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
                   [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:bg-primary-light"
        />
        <div className="text-2xl font-mono font-bold text-primary w-16 text-center">
          {bpm}
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              beat === i 
                ? 'bg-primary shadow-purple animate-pulse-glow' 
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Metronome;