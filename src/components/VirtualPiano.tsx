import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

interface VirtualPianoProps {
  onNotePlay?: (note: string) => void;
  isRecording?: boolean;
}

const VirtualPiano: React.FC<VirtualPianoProps> = ({ onNotePlay, isRecording }) => {
  const [activeNotes, setActiveNotes] = useState(new Set<string>());
  const synthRef = useRef<Tone.Sampler | null>(null);

  useEffect(() => {
    // Create a piano sampler with better sounds
    const pianoSampler = new Tone.Sampler({
      urls: {
        C4: "https://tonejs.github.io/audio/salamander/C4.mp3",
        "D#4": "https://tonejs.github.io/audio/salamander/Ds4.mp3", 
        "F#4": "https://tonejs.github.io/audio/salamander/Fs4.mp3",
        A4: "https://tonejs.github.io/audio/salamander/A4.mp3",
        C5: "https://tonejs.github.io/audio/salamander/C5.mp3",
        "D#5": "https://tonejs.github.io/audio/salamander/Ds5.mp3",
        "F#5": "https://tonejs.github.io/audio/salamander/Fs5.mp3", 
        A5: "https://tonejs.github.io/audio/salamander/A5.mp3",
      },
      release: 1,
      baseUrl: "",
    });

    // Add effects for more realistic piano sound
    const reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.25,
    });
    
    const compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 3,
      attack: 0.003,
      release: 0.1,
    });

    // Chain: Piano -> Compressor -> Reverb -> Output
    pianoSampler.chain(compressor, reverb, Tone.Destination);
    
    synthRef.current = pianoSampler;
    
    return () => {
      pianoSampler.dispose();
      reverb.dispose();  
      compressor.dispose();
    };
  }, []);

  const playNote = useCallback((note: string) => {
    if (synthRef.current) {
      // Add slight velocity variation for more natural sound
      const velocity = 0.8 + (Math.random() * 0.2 - 0.1);
      synthRef.current.triggerAttackRelease(note, "2n", undefined, velocity);
      
      setActiveNotes(prev => new Set(prev).add(note));
      setTimeout(() => {
        setActiveNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(note);
          return newSet;
        });
      }, 300);
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