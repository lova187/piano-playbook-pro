import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

interface VirtualPianoProps {
  onNotePlay?: (note: string) => void;
  isRecording?: boolean;
  highlightedKeys?: Set<string>;
  autoPlayActive?: boolean;
}

const VirtualPiano: React.FC<VirtualPianoProps> = ({ 
  onNotePlay, 
  isRecording, 
  highlightedKeys = new Set(),
  autoPlayActive = false 
}) => {
  const [activeNotes, setActiveNotes] = useState(new Set<string>());
  const synthRef = useRef<Tone.Sampler | null>(null);

  // Generate all 88 piano keys (A0 to C8)
  const generatePianoKeys = () => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keys = [];
    
    // Start from A0, B0
    keys.push({ note: 'A0', type: 'white', octave: 0 });
    keys.push({ note: 'A#0', type: 'black', octave: 0 });
    keys.push({ note: 'B0', type: 'white', octave: 0 });
    
    // Generate C1 to C8
    for (let octave = 1; octave <= 8; octave++) {
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const fullNote = `${note}${octave}`;
        
        if (octave === 8 && i > 0) break; // Stop after C8
        
        keys.push({
          note: fullNote,
          type: note.includes('#') ? 'black' : 'white',
          octave: octave
        });
      }
    }
    
    return keys;
  };

  const allKeys = generatePianoKeys();
  const whiteKeys = allKeys.filter(key => key.type === 'white');
  const blackKeys = allKeys.filter(key => key.type === 'black');

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

  // Calculate black key positions relative to white keys
  const getBlackKeyPosition = (blackKey: any, index: number) => {
    const whiteKeyWidth = 100 / whiteKeys.length; // Percentage width of each white key
    const whiteKeyIndex = whiteKeys.findIndex(wk => {
      const blackNote = blackKey.note.replace('#', '');
      const whiteNote = wk.note.replace(/\d+/, '');
      const blackOctave = parseInt(blackKey.note.match(/\d+/)?.[0] || '0');
      const whiteOctave = parseInt(wk.note.match(/\d+/)?.[0] || '0');
      
      // Position black keys between appropriate white keys
      if (blackNote === 'C' && whiteNote === 'C' && blackOctave === whiteOctave) return true;
      if (blackNote === 'D' && whiteNote === 'D' && blackOctave === whiteOctave) return true;
      if (blackNote === 'F' && whiteNote === 'F' && blackOctave === whiteOctave) return true;
      if (blackNote === 'G' && whiteNote === 'G' && blackOctave === whiteOctave) return true;
      if (blackNote === 'A' && whiteNote === 'A' && blackOctave === whiteOctave) return true;
      return false;
    });
    
    if (whiteKeyIndex === -1) return 0;
    return (whiteKeyIndex * whiteKeyWidth) + (whiteKeyWidth * 0.7); // Position at 70% of white key
  };

  return (
    <div className="relative bg-card rounded-xl p-4 shadow-elegant border border-border overflow-x-auto">
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 text-destructive z-10">
          <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording</span>
        </div>
      )}
      {autoPlayActive && (
        <div className="absolute top-4 left-4 flex items-center gap-2 text-primary z-10">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium">Auto Playing</span>
        </div>
      )}
      <div className="relative h-32 min-w-[1200px]">
        {/* White Keys */}
        <div className="flex h-full">
          {whiteKeys.map((key, index) => {
            const isActive = activeNotes.has(key.note);
            const isHighlighted = highlightedKeys.has(key.note);
            const noteLabel = key.note.replace(/\d+/, '');
            
            return (
              <button
                key={key.note}
                onMouseDown={() => playNote(key.note)}
                onTouchStart={() => playNote(key.note)}
                className={`flex-1 border border-border rounded-b-lg transition-all duration-150 shadow-sm flex items-end justify-center pb-2 min-w-[13px] ${
                  isActive 
                    ? 'bg-accent transform scale-95 shadow-glow' 
                    : isHighlighted
                    ? 'bg-primary text-primary-foreground shadow-primary'
                    : 'bg-white hover:bg-muted'
                }`}
              >
                <span className="text-xs font-medium text-muted-foreground pointer-events-none">
                  {key.octave <= 2 || index % 12 === 0 ? noteLabel : ''}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Black Keys */}
        <div className="absolute top-0 left-0 w-full h-20">
          {blackKeys.map((key, index) => {
            const isActive = activeNotes.has(key.note);
            const isHighlighted = highlightedKeys.has(key.note);
            const position = getBlackKeyPosition(key, index);
            
            return (
              <button
                key={key.note}
                onMouseDown={() => playNote(key.note)}
                onTouchStart={() => playNote(key.note)}
                style={{ left: `${position}%` }}
                className={`absolute w-3 h-full transition-all duration-150 rounded-b-lg shadow-md ${
                  isActive 
                    ? 'bg-primary transform scale-95 shadow-purple' 
                    : isHighlighted
                    ? 'bg-accent shadow-accent'
                    : 'bg-foreground hover:bg-muted-foreground'
                }`}
              />
            );
          })}
        </div>
      </div>
      
      {/* Octave indicators */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground px-2">
        <span>A0</span>
        <span>C1</span>
        <span>C2</span>
        <span>C3</span>
        <span>C4 (Middle C)</span>
        <span>C5</span>
        <span>C6</span>
        <span>C7</span>
        <span>C8</span>
      </div>
    </div>
  );
};

export default VirtualPiano;