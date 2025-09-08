import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

interface VirtualPianoProps {
  onNotePlay?: (note: string) => void;
  isRecording?: boolean;
}

const VirtualPiano: React.FC<VirtualPianoProps> = ({ onNotePlay, isRecording }) => {
  const [activeNotes, setActiveNotes] = useState(new Set<string>());
  const synthRef = useRef<Tone.PolySynth | null>(null);

  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
    return () => {
      synthRef.current?.dispose();
    };
  }, []);

  const playNote = useCallback((note: string) => {
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease(note, "8n");
      setActiveNotes(prev => new Set(prev).add(note));
      setTimeout(() => {
        setActiveNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(note);
          return newSet;
        });
      }, 200);
      onNotePlay?.(note);
    }
  }, [onNotePlay]);

  const whiteKeys = [
    { note: 'C4', label: 'C' },
    { note: 'D4', label: 'D' },
    { note: 'E4', label: 'E' },
    { note: 'F4', label: 'F' },
    { note: 'G4', label: 'G' },
    { note: 'A4', label: 'A' },
    { note: 'B4', label: 'B' },
    { note: 'C5', label: 'C' }
  ];

  const blackKeys = [
    { note: 'C#4', position: 8.5 },
    { note: 'D#4', position: 20.5 },
    { note: 'F#4', position: 44.5 },
    { note: 'G#4', position: 56.5 },
    { note: 'A#4', position: 68.5 }
  ];

  return (
    <div className="relative bg-card rounded-xl p-6 shadow-elegant border border-border">
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 text-destructive">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording</span>
        </div>
      )}
      <div className="relative h-36">
        {/* White Keys */}
        <div className="flex gap-1 h-full">
          {whiteKeys.map((key) => (
            <button
              key={key.note}
              onMouseDown={() => playNote(key.note)}
              onTouchStart={() => playNote(key.note)}
              className={`flex-1 bg-white border-2 border-border rounded-b-lg hover:bg-muted transition-all duration-150 shadow-sm ${
                activeNotes.has(key.note) ? 'bg-accent transform scale-95 shadow-glow' : ''
              }`}
            >
              <span className="text-sm font-medium text-muted-foreground mt-auto mb-3 block">
                {key.label}
              </span>
            </button>
          ))}
        </div>
        {/* Black Keys */}
        <div className="absolute top-0 left-0 w-full h-24">
          {blackKeys.map((key) => (
            <button
              key={key.note}
              onMouseDown={() => playNote(key.note)}
              onTouchStart={() => playNote(key.note)}
              style={{ left: `${key.position}%` }}
              className={`absolute w-8 h-full bg-foreground hover:bg-muted-foreground transition-all duration-150 rounded-b-lg shadow-md ${
                activeNotes.has(key.note) ? 'bg-primary transform scale-95 shadow-purple' : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualPiano;