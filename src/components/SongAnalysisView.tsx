import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, RotateCcw, Hand, Music, Volume2, 
  ChevronLeft, ChevronRight, Clock, Target, Piano
} from 'lucide-react';
import * as Tone from 'tone';
import VirtualPiano from '@/components/VirtualPiano';

interface SongPart {
  id: number;
  name: string;
  description: string;
  notes: string[] | string[][];
  timing: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface SongAnalysisViewProps {
  song: {
    id: number;
    title: string;
    artist: string;
    parts: {
      leftHand: SongPart[];
      rightHand: SongPart[];
    };
  };
  onBack: () => void;
}

export const SongAnalysisView: React.FC<SongAnalysisViewProps> = ({ song, onBack }) => {
  const [selectedHand, setSelectedHand] = useState<'left' | 'right' | 'combined'>('right');
  const [selectedPart, setSelectedPart] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [activeKeys, setActiveKeys] = useState(new Set<string>());
  const [samplerLoaded, setSamplerLoaded] = useState(false);
  const synthRef = useRef<Tone.Sampler | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    // Create realistic piano sampler
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
      onload: () => {
        setSamplerLoaded(true);
        console.log('Piano sampler loaded');
      }
    });

    // Add realistic effects
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

    // Chain effects
    pianoSampler.chain(compressor, reverb, Tone.Destination);
    synthRef.current = pianoSampler;
    
    return () => {
      pianoSampler.dispose();
      reverb.dispose();
      compressor.dispose();
      sequenceRef.current?.dispose();
    };
  }, []);

  const currentParts = selectedHand === 'combined' 
    ? [...song.parts.leftHand, ...song.parts.rightHand].sort((a, b) => a.id - b.id)
    : song.parts[selectedHand === 'left' ? 'leftHand' : 'rightHand'];
  const currentPart = currentParts[selectedPart];

  // For combined mode, create merged parts with hand indicators
  const getCombinedPart = (leftPart: SongPart, rightPart: SongPart) => {
    const maxLength = Math.max(leftPart.notes.length, rightPart.notes.length);
    const mergedNotes = [];
    const mergedTiming = [];
    const handIndicators = [];

    for (let i = 0; i < maxLength; i++) {
      const leftNote = leftPart.notes[i];
      const rightNote = rightPart.notes[i];
      const leftTime = leftPart.timing[i] || 0;
      const rightTime = rightPart.timing[i] || 0;

      if (leftNote && rightNote) {
        // Both hands play at the same time
        const combinedNote = Array.isArray(leftNote) && Array.isArray(rightNote)
          ? [...leftNote, ...rightNote]
          : Array.isArray(leftNote) 
            ? [...leftNote, rightNote as string]
            : Array.isArray(rightNote)
              ? [leftNote as string, ...rightNote]
              : [leftNote as string, rightNote as string];
        mergedNotes.push(combinedNote);
        mergedTiming.push(Math.min(leftTime, rightTime));
        handIndicators.push('both');
      } else if (leftNote) {
        mergedNotes.push(leftNote);
        mergedTiming.push(leftTime);
        handIndicators.push('left');
      } else if (rightNote) {
        mergedNotes.push(rightNote);
        mergedTiming.push(rightTime);
        handIndicators.push('right');
      }
    }

    return {
      ...leftPart,
      name: `${leftPart.name} + ${rightPart.name}`,
      description: 'Combined left and right hand practice',
      notes: mergedNotes,
      timing: mergedTiming,
      handIndicators
    };
  };

  const difficultyColors = {
    beginner: 'bg-success/20 text-success border-success/30',
    intermediate: 'bg-warning/20 text-warning border-warning/30',
    advanced: 'bg-destructive/20 text-destructive border-destructive/30'
  };

  const playPart = async () => {
    console.log('Play part button clicked');
    if (!synthRef.current || !currentPart || !samplerLoaded) {
      console.log('Missing prerequisites:', { synth: !!synthRef.current, part: !!currentPart, samplerLoaded });
      return;
    }
    
    try {
      console.log('Starting Tone...');
      await Tone.start();
      console.log('Tone started successfully');
      
      if (isPlaying) {
        console.log('Stopping playback...');
        Tone.Transport.stop();
        sequenceRef.current?.dispose();
        setIsPlaying(false);
        setPlaybackPosition(0);
        setActiveKeys(new Set());
        return;
      }

      const { notes, timing } = currentPart;
      setIsPlaying(true);
      setPlaybackPosition(0);
      console.log('Playing part:', currentPart.name, 'Notes:', notes, 'Timing:', timing);

      // Use Tone.js Transport for precise timing
      Tone.Transport.bpm.value = 120; // 120 BPM default
      
      // Create a sequence with proper timing
      const sequence = new Tone.Sequence((time, index) => {
        if (index >= notes.length) {
          // End of sequence
          Tone.Transport.stop();
          setIsPlaying(false);
          setPlaybackPosition(0);
          setActiveKeys(new Set());
          return;
        }

        const note = notes[index];
        const duration = timing[index] || 0.5; // Default duration
        
        console.log(`Playing note ${index}:`, note, 'at time:', time);
        
        // Highlight keys immediately
        Tone.Draw.schedule(() => {
          setPlaybackPosition(index);
          if (Array.isArray(note)) {
            setActiveKeys(new Set(note));
          } else {
            setActiveKeys(new Set([note]));
          }
        }, time);

        // Play the note(s)
        if (Array.isArray(note)) {
          // Play chord
          note.forEach(n => {
            if (synthRef.current) {
              synthRef.current.triggerAttackRelease(n, duration, time);
            }
          });
        } else {
          // Play single note
          if (synthRef.current) {
            synthRef.current.triggerAttackRelease(note, duration, time);
          }
        }

        // Clear highlight after note duration
        Tone.Draw.schedule(() => {
          setActiveKeys(new Set());
        }, time + duration);
        
      }, timing.map((t, i) => i * 0.5), 0); // Schedule every 0.5 seconds with timing offsets

      sequenceRef.current = sequence;
      sequence.start(0);
      Tone.Transport.start();

    } catch (error) {
      console.error('Playback error:', error);
      setIsPlaying(false);
      setPlaybackPosition(0);
      setActiveKeys(new Set());
    }
  };

  const resetPlayback = () => {
    Tone.Transport.stop();
    sequenceRef.current?.dispose();
    setIsPlaying(false);
    setPlaybackPosition(0);
    setActiveKeys(new Set());
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 text-white mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white hover:bg-white/10"
        >
          <ChevronLeft size={20} className="mr-2" />
          Back to Library
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{song.title}</h1>
          <p className="text-lg opacity-90">{song.artist} • AI Analyzed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hand Selection & Parts List */}
        <Card className="lg:col-span-1 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hand size={20} />
              Practice Parts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hand Selection */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedHand === 'left' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedHand('left');
                  setSelectedPart(0);
                  resetPlayback();
                }}
                className="text-xs"
              >
                Left Hand
              </Button>
              <Button
                variant={selectedHand === 'right' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedHand('right');
                  setSelectedPart(0);
                  resetPlayback();
                }}
                className="text-xs"
              >
                Right Hand
              </Button>
              <Button
                variant={selectedHand === 'combined' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedHand('combined');
                  setSelectedPart(0);
                  resetPlayback();
                }}
                className="text-xs"
              >
                Combined
              </Button>
            </div>

            {/* Parts List */}
            <div className="space-y-2">
              {currentParts.map((part, index) => (
                <div
                  key={part.id}
                  onClick={() => {
                    setSelectedPart(index);
                    resetPlayback();
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPart === index 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{part.name}</h4>
                    <Badge variant="outline" className={difficultyColors[part.difficulty]}>
                      {part.difficulty}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{part.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Practice Area */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Music size={20} />
                {currentPart?.name}
              </CardTitle>
              <Badge variant="outline" className={difficultyColors[currentPart?.difficulty || 'beginner']}>
                {currentPart?.difficulty}
              </Badge>
            </div>
            <p className="text-muted-foreground">{currentPart?.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio Controls */}
            <div className="flex items-center gap-4">
              <Button
                onClick={playPart}
                className="flex items-center gap-2"
                disabled={!currentPart || !samplerLoaded}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Stop' : (samplerLoaded ? 'Play Part' : 'Loading Piano...')}
              </Button>
              
              <Button
                variant="outline"
                onClick={resetPlayback}
                disabled={!isPlaying && playbackPosition === 0}
              >
                <RotateCcw size={16} className="mr-2" />
                Reset
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Volume2 size={16} />
                {samplerLoaded ? 'Audio Preview' : 'Preparing samples...'}
              </div>
            </div>

            {/* Visual Note Display */}
            {currentPart && (
              <div className="bg-muted/20 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Notes to Practice
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {currentPart.notes.map((note, index) => {
                    const handIndicator = (currentPart as any).handIndicators?.[index];
                    const isActive = playbackPosition === index && isPlaying;
                    const isPlayed = playbackPosition > index && isPlaying;
                    
                    return (
                      <div
                        key={index}
                        className={`p-2 text-center text-sm rounded border transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                            : isPlayed
                            ? 'bg-success/20 text-success border-success/30'
                            : handIndicator === 'left'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : handIndicator === 'right'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : handIndicator === 'both'
                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            : 'bg-background border-border'
                        }`}
                      >
                        <div className="text-xs">
                          {Array.isArray(note) ? note.join(' + ') : note}
                        </div>
                        {handIndicator && (
                          <div className="text-[10px] opacity-70 mt-1">
                            {handIndicator === 'both' ? 'L+R' : handIndicator === 'left' ? 'L' : 'R'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full 88-Key Virtual Piano */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Piano size={16} />
                Full Piano ({selectedHand === 'combined' ? 'Both Hands' : selectedHand === 'left' ? 'Left Hand' : 'Right Hand'})
              </h4>
              <VirtualPiano 
                highlightedKeys={activeKeys}
                autoPlayActive={isPlaying}
                onNotePlay={(note) => console.log('Manual note played:', note)}
              />
            </div>

            {/* Practice Tips */}
            <div className="bg-accent/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">💡 Practice Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Start slowly and focus on accuracy over speed</li>
                {selectedHand === 'combined' ? (
                  <>
                    <li>• <span className="text-blue-400">Blue notes</span> = Left hand, <span className="text-red-400">Red notes</span> = Right hand, <span className="text-purple-400">Purple notes</span> = Both hands</li>
                    <li>• Practice each hand separately first, then combine</li>
                  </>
                ) : (
                  <li>• Practice each hand separately before combining</li>
                )}
                <li>• Use the audio preview to learn the rhythm</li>
                <li>• Watch the highlighted keys on the full 88-key piano</li>
                <li>• Repeat difficult sections multiple times</li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPart(Math.max(0, selectedPart - 1));
                  resetPlayback();
                }}
                disabled={selectedPart === 0}
              >
                <ChevronLeft size={16} className="mr-2" />
                Previous Part
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPart(Math.min(currentParts.length - 1, selectedPart + 1));
                  resetPlayback();
                }}
                disabled={selectedPart === currentParts.length - 1}
              >
                Next Part
                <ChevronRight size={16} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};