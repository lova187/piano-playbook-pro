import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, RotateCcw, Hand, Music, Volume2, 
  ChevronLeft, ChevronRight, Clock, Target, Piano
} from 'lucide-react';
import * as Tone from 'tone';

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
  const [selectedHand, setSelectedHand] = useState<'left' | 'right'>('right');
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

  const currentParts = song.parts[selectedHand === 'left' ? 'leftHand' : 'rightHand'];
  const currentPart = currentParts[selectedPart];

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
        setIsPlaying(false);
        setPlaybackPosition(0);
        setActiveKeys(new Set());
        return;
      }

      const { notes, timing } = currentPart;
      setIsPlaying(true);
      console.log('Playing part:', currentPart.name, 'Notes:', notes, 'Timing:', timing);

      // Simple immediate playback to test
      notes.forEach((note, index) => {
        setTimeout(() => {
          if (!isPlaying) return;
          
          console.log(`Playing note ${index}:`, note);
          
          if (Array.isArray(note)) {
            // Play chord
            note.forEach(n => {
              if (synthRef.current) {
                synthRef.current.triggerAttackRelease(n, "1n");
                console.log('Triggered chord note:', n);
              }
            });
            setActiveKeys(new Set(note));
          } else {
            // Play single note
            if (synthRef.current) {
              synthRef.current.triggerAttackRelease(note, "1n");
              console.log('Triggered single note:', note);
            }
            setActiveKeys(new Set([note]));
          }

          setPlaybackPosition(index);
          
          // Clear highlight after note
          setTimeout(() => setActiveKeys(new Set()), 600);
        }, index * 1000); // 1 second between notes for testing
      });

      // Stop after all notes
      setTimeout(() => {
        console.log('Auto-stopping playback');
        setIsPlaying(false);
        setPlaybackPosition(0);
        setActiveKeys(new Set());
      }, notes.length * 1000 + 1000);

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

  // Virtual Piano Component
  const VirtualPianoDisplay = () => {
    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeys = [
      { note: 'C#', position: 8.5 },
      { note: 'D#', position: 20.5 },
      { note: 'F#', position: 44.5 },
      { note: 'G#', position: 56.5 },
      { note: 'A#', position: 68.5 }
    ];

    const playNote = useCallback((note: string) => {
      if (synthRef.current) {
        const velocity = 0.8 + (Math.random() * 0.2 - 0.1);
        synthRef.current.triggerAttackRelease(`${note}4`, "8n", undefined, velocity);
        
        setActiveKeys(prev => new Set(prev).add(`${note}4`));
        setTimeout(() => {
          setActiveKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(`${note}4`);
            return newSet;
          });
        }, 300);
      }
    }, []);

    return (
      <div className="relative bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Piano size={16} />
          <span className="text-sm font-medium">Interactive Piano</span>
        </div>
        <div className="relative h-24">
          {/* White Keys */}
          <div className="flex gap-0.5 h-full">
            {whiteKeys.map((key) => {
              const noteKey = `${key}4`;
              return (
                <button
                  key={key}
                  onMouseDown={() => playNote(key)}
                  onTouchStart={() => playNote(key)}
                  className={`flex-1 bg-white border border-border rounded-b-lg hover:bg-muted transition-all duration-150 shadow-sm ${
                    activeKeys.has(noteKey) ? 'bg-primary/20 transform scale-95 shadow-glow' : ''
                  }`}
                >
                  <span className="text-xs font-medium text-muted-foreground mt-auto mb-2 block">
                    {key}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Black Keys */}
          <div className="absolute top-0 left-0 w-full h-16">
            {blackKeys.map((key) => {
              const noteKey = `${key.note}4`;
              return (
                <button
                  key={key.note}
                  onMouseDown={() => playNote(key.note.replace('#', '#'))}
                  onTouchStart={() => playNote(key.note.replace('#', '#'))}
                  style={{ left: `${key.position}%` }}
                  className={`absolute w-6 h-full bg-foreground hover:bg-muted-foreground transition-all duration-150 rounded-b-lg shadow-md ${
                    activeKeys.has(noteKey) ? 'bg-primary transform scale-95' : ''
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
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
            <div className="flex gap-2">
              <Button
                variant={selectedHand === 'left' ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedHand('left');
                  setSelectedPart(0);
                  resetPlayback();
                }}
                className="flex-1"
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
                className="flex-1"
              >
                Right Hand
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
                  {currentPart.notes.map((note, index) => (
                    <div
                      key={index}
                      className={`p-2 text-center text-sm rounded border transition-all ${
                        playbackPosition > index && isPlaying
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border'
                      }`}
                    >
                      {Array.isArray(note) ? note.join(' + ') : note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Virtual Piano */}
            <VirtualPianoDisplay />

            {/* Practice Tips */}
            <div className="bg-accent/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">💡 Practice Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Start slowly and focus on accuracy over speed</li>
                <li>• Practice each hand separately before combining</li>
                <li>• Use the audio preview to learn the rhythm</li>
                <li>• Watch the highlighted keys to learn finger positioning</li>
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