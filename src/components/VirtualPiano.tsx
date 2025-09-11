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

  // Generate 88-key piano layout starting from A0
  const generateKeys = () => {
    const whiteKeys = [];
    const blackKeys = [];
    
    // Piano starts with A0, A#0, B0
    whiteKeys.push({ note: 'A0', index: 0 });
    blackKeys.push({ note: 'A#0', whiteIndex: 0 });
    whiteKeys.push({ note: 'B0', index: 1 });

    // Generate octaves 1-7 complete, octave 8 only C
    for (let octave = 1; octave <= 8; octave++) {
      const octavePattern = [
        { note: `C${octave}`, type: 'white' },
        { note: `C#${octave}`, type: 'black', after: `C${octave}` },
        { note: `D${octave}`, type: 'white' },
        { note: `D#${octave}`, type: 'black', after: `D${octave}` },
        { note: `E${octave}`, type: 'white' },
        { note: `F${octave}`, type: 'white' },
        { note: `F#${octave}`, type: 'black', after: `F${octave}` },
        { note: `G${octave}`, type: 'white' },
        { note: `G#${octave}`, type: 'black', after: `G${octave}` },
        { note: `A${octave}`, type: 'white' },
        { note: `A#${octave}`, type: 'black', after: `A${octave}` },
        { note: `B${octave}`, type: 'white' }
      ];

      for (const key of octavePattern) {
        if (octave === 8 && key.note !== 'C8') break; // Only C8 for octave 8
        
        if (key.type === 'white') {
          whiteKeys.push({ note: key.note, index: whiteKeys.length });
        } else {
          const afterWhiteIndex = whiteKeys.findIndex(wk => wk.note === key.after);
          if (afterWhiteIndex !== -1) {
            blackKeys.push({ note: key.note, whiteIndex: afterWhiteIndex });
          }
        }
      }
    }

    return { whiteKeys, blackKeys };
  };

  const { whiteKeys, blackKeys } = generateKeys();

  useEffect(() => {
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
      
      <div className="relative h-32 min-w-[1800px]">
        {/* White Keys */}
        <div className="flex h-full gap-0">
          {whiteKeys.map((key, index) => {
            const isActive = activeNotes.has(key.note);
            const isHighlighted = highlightedKeys.has(key.note);
            const noteLabel = key.note.replace(/\d+/, '');
            
            return (
              <button
                key={key.note}
                onMouseDown={() => playNote(key.note)}
                onTouchStart={() => playNote(key.note)}
                className={`h-full border border-gray-300 rounded-b-lg transition-all duration-150 shadow-sm flex items-end justify-center pb-2 ${
                  isActive 
                    ? 'bg-accent transform scale-95 shadow-lg' 
                    : isHighlighted
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-white hover:bg-gray-50'
                }`}
                style={{ width: '20px', minWidth: '20px' }}
              >
                <span className="text-[10px] font-medium text-gray-500 pointer-events-none">
                  {index % 7 === 0 || key.note.includes('C') ? noteLabel : ''}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Black Keys */}
        <div className="absolute top-0 left-0 w-full h-20">
          {blackKeys.map((key) => {
            const isActive = activeNotes.has(key.note);
            const isHighlighted = highlightedKeys.has(key.note);
            const leftPosition = (key.whiteIndex * 20) + 14; // 20px per white key, offset by 14px
            
            return (
              <button
                key={key.note}
                onMouseDown={() => playNote(key.note)}
                onTouchStart={() => playNote(key.note)}
                className={`absolute h-full transition-all duration-150 rounded-b-lg shadow-md z-10 ${
                  isActive 
                    ? 'bg-purple-600 transform scale-95 shadow-lg' 
                    : isHighlighted
                    ? 'bg-yellow-500 shadow-lg'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                style={{ 
                  left: `${leftPosition}px`,
                  width: '12px'
                }}
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
        <span>C4</span>
        <span>C5</span>
        <span>C6</span>
        <span>C7</span>
        <span>C8</span>
      </div>
    </div>
  );
};

export default VirtualPiano;